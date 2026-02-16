import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../middleware';

const defaultCodePrefix = 'YIDAK';

const overviewOutputSchema = z.object({
  code: z.string(),
  share_link: z.string().url(),
  referral_message_en: z.string(),
  referral_message_ar: z.string(),
  stats: z.object({
    total_referrals: z.number().int().nonnegative(),
    successful_referrals: z.number().int().nonnegative(),
    earned_amount: z.number().nonnegative()
  }),
  tier_progress: z.object({
    current_rate: z.number().nonnegative(),
    next_rate: z.number().nonnegative().nullable(),
    remaining_to_next_tier: z.number().int().nonnegative(),
    next_threshold: z.number().int().nonnegative().nullable()
  }),
  history: z.array(
    z.object({
      id: z.string().uuid(),
      referee_name: z.string(),
      status: z.enum(['pending', 'completed', 'credited', 'cancelled']),
      reward_amount: z.number().nonnegative(),
      created_at: z.string()
    })
  )
});

const leaderboardInputSchema = z.object({
  category: z.string().default('all'),
  city: z.string().default('all'),
  limit: z.number().int().positive().max(50).default(50)
});

const leaderboardOutputSchema = z.object({
  items: z.array(
    z.object({
      rank: z.number().int().positive(),
      user_id: z.string().uuid(),
      full_name: z.string(),
      city: z.string(),
      avatar_url: z.string().nullable(),
      tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
      average_rating: z.number().nonnegative(),
      completion_rate: z.number().nonnegative(),
      total_jobs: z.number().int().nonnegative(),
      score: z.number().nonnegative(),
      is_current_user: z.boolean()
    })
  ),
  current_user_rank: z.number().int().positive().nullable()
});

const readString = (row: Record<string, unknown>, key: string): string => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : '';
};

const readNullableString = (row: Record<string, unknown>, key: string): string | null => {
  const value = Reflect.get(row, key);
  return typeof value === 'string' ? value : null;
};

const readNumber = (row: Record<string, unknown>, key: string): number => {
  const value = Reflect.get(row, key);
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

const rows = (value: unknown): ReadonlyArray<Record<string, unknown>> =>
  Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    : [];

const normalizeStatus = (value: string): 'pending' | 'completed' | 'credited' | 'cancelled' => {
  if (value === 'completed' || value === 'credited' || value === 'cancelled') {
    return value;
  }

  return 'pending';
};

const normalizeTier = (value: string): 'bronze' | 'silver' | 'gold' | 'platinum' => {
  if (value === 'silver' || value === 'gold' || value === 'platinum') {
    return value;
  }

  return 'bronze';
};

const rewardRateForCount = (referralCount: number): number => {
  if (referralCount >= 16) {
    return 100;
  }

  if (referralCount >= 6) {
    return 75;
  }

  return 50;
};

const nextTier = (successfulCount: number): { threshold: number; rate: number } | null => {
  if (successfulCount < 6) {
    return { threshold: 6, rate: 75 };
  }

  if (successfulCount < 16) {
    return { threshold: 16, rate: 100 };
  }

  return null;
};

const buildReferralCode = (fullName: string): string => {
  const prefix = fullName
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();
  const stablePrefix = prefix.length > 0 ? prefix : defaultCodePrefix;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${stablePrefix}${suffix}`;
};

export const referralRouter = createTRPCRouter({
  getOverview: protectedProcedure.output(overviewOutputSchema).query(async ({ ctx }) => {
    let codeResult = await ctx.supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', ctx.profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!codeResult.data) {
      const generatedCode = buildReferralCode(readString(ctx.profile, 'full_name'));
      const inserted = await ctx.supabase
        .from('referral_codes')
        .insert({ user_id: ctx.profile.id, code: generatedCode, uses_count: 0, max_uses: 200 })
        .select('*')
        .single();

      codeResult = inserted;
    }

    const codeRow =
      codeResult.data && typeof codeResult.data === 'object' && !Array.isArray(codeResult.data)
        ? codeResult.data
        : null;

    if (!codeRow) {
      throw new Error('Unable to load referral code');
    }

    const rewardsResult = await ctx.supabase
      .from('referral_rewards')
      .select('*')
      .eq('referrer_id', ctx.profile.id)
      .order('created_at', { ascending: false })
      .limit(200);

    const rewardRows = rows(rewardsResult.data);
    const refereeIds = [...new Set(rewardRows.map((row) => readString(row, 'referee_id')).filter(Boolean))];

    const refereeMap = new Map<string, string>();
    if (refereeIds.length > 0) {
      const refereeResult = await ctx.supabase
        .from('profiles')
        .select('id,full_name')
        .in('id', refereeIds);
      rows(refereeResult.data).forEach((row) => {
        const id = readString(row, 'id');
        const name = readString(row, 'full_name');
        if (id) {
          refereeMap.set(id, name);
        }
      });
    }

    const successfulReferrals = rewardRows.filter((row) => {
      const status = normalizeStatus(readString(row, 'status'));
      return status === 'completed' || status === 'credited';
    }).length;
    const earnedAmount = rewardRows.reduce((sum, row) => {
      const status = normalizeStatus(readString(row, 'status'));
      if (status !== 'credited') {
        return sum;
      }
      return sum + readNumber(row, 'reward_amount');
    }, 0);

    const currentRate = rewardRateForCount(successfulReferrals);
    const upcoming = nextTier(successfulReferrals);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const code = readString(codeRow, 'code');
    const shareLink = `${appUrl}/referral/${encodeURIComponent(code)}`;

    return {
      code,
      share_link: shareLink,
      referral_message_en: `Try Yidak with code ${code} and get a referral reward.`,
      referral_message_ar: `جرب يدك! استخدم كود ${code} واحصل على مكافاة ترحيبية.`,
      stats: {
        total_referrals: rewardRows.length,
        successful_referrals: successfulReferrals,
        earned_amount: earnedAmount
      },
      tier_progress: {
        current_rate: currentRate,
        next_rate: upcoming?.rate ?? null,
        remaining_to_next_tier: upcoming ? Math.max(0, upcoming.threshold - successfulReferrals) : 0,
        next_threshold: upcoming?.threshold ?? null
      },
      history: rewardRows.map((row) => {
        const refereeId = readString(row, 'referee_id');
        return {
          id: readString(row, 'id'),
          referee_name: refereeMap.get(refereeId) ?? 'User',
          status: normalizeStatus(readString(row, 'status')),
          reward_amount: readNumber(row, 'reward_amount'),
          created_at: readString(row, 'created_at')
        };
      })
    };
  }),

  leaderboard: protectedProcedure
    .input(leaderboardInputSchema)
    .output(leaderboardOutputSchema)
    .query(async ({ ctx, input }) => {
      const workerRowsResult = await ctx.supabase
        .from('worker_profiles')
        .select('*')
        .eq('is_available', true);
      const workerRows = rows(workerRowsResult.data);
      const workerIds = workerRows.map((row) => readString(row, 'user_id')).filter(Boolean);

      if (workerIds.length === 0) {
        return { items: [], current_user_rank: null };
      }

      const profileResult = await ctx.supabase
        .from('profiles')
        .select('id,full_name,city,avatar_url,role')
        .in('id', workerIds)
        .eq('role', 'worker');
      const profileRows = rows(profileResult.data);
      const profileMap = new Map<string, Record<string, unknown>>();
      profileRows.forEach((row) => {
        profileMap.set(readString(row, 'id'), row);
      });

      const normalizedCategory = input.category.trim().toLowerCase();
      const normalizedCity = input.city.trim().toLowerCase();

      const scored = workerRows
        .filter((workerRow) => {
          const userId = readString(workerRow, 'user_id');
          const profile = profileMap.get(userId);
          if (!profile) {
            return false;
          }

          if (normalizedCity !== 'all' && readString(profile, 'city').toLowerCase() !== normalizedCity) {
            return false;
          }

          if (normalizedCategory !== 'all') {
            const skills = Reflect.get(workerRow, 'skills');
            if (!Array.isArray(skills)) {
              return false;
            }

            const matchesCategory = skills.some(
              (skill) => typeof skill === 'string' && skill.toLowerCase().includes(normalizedCategory)
            );
            if (!matchesCategory) {
              return false;
            }
          }

          const ratingScore = Math.max(0, Math.min(100, readNumber(workerRow, 'average_rating') * 20));
          const completionScore = Math.max(0, Math.min(100, readNumber(workerRow, 'completion_rate')));
          const jobsScore = Math.max(0, Math.min(100, readNumber(workerRow, 'total_jobs')));
          const speedScore = Math.max(
            0,
            100 - Math.max(0, readNumber(workerRow, 'response_time_minutes')) * 3
          );
          const score =
            ratingScore * 0.4 + completionScore * 0.3 + jobsScore * 0.2 + speedScore * 0.1;

          return score >= 0;
        })
        .map((workerRow) => {
          const userId = readString(workerRow, 'user_id');
          const profile = profileMap.get(userId) ?? {};
          const ratingScore = Math.max(0, Math.min(100, readNumber(workerRow, 'average_rating') * 20));
          const completionScore = Math.max(0, Math.min(100, readNumber(workerRow, 'completion_rate')));
          const jobsScore = Math.max(0, Math.min(100, readNumber(workerRow, 'total_jobs')));
          const speedScore = Math.max(
            0,
            100 - Math.max(0, readNumber(workerRow, 'response_time_minutes')) * 3
          );
          const score =
            ratingScore * 0.4 + completionScore * 0.3 + jobsScore * 0.2 + speedScore * 0.1;

          return {
            user_id: userId,
            full_name: readString(profile, 'full_name') || 'Worker',
            city: readString(profile, 'city'),
            avatar_url: readNullableString(profile, 'avatar_url'),
            tier: normalizeTier(readString(workerRow, 'tier')),
            average_rating: readNumber(workerRow, 'average_rating'),
            completion_rate: readNumber(workerRow, 'completion_rate'),
            total_jobs: Math.max(0, Math.floor(readNumber(workerRow, 'total_jobs'))),
            score
          };
        })
        .sort((a, b) => b.score - a.score);

      const ranked = scored.slice(0, input.limit).map((row, index) => ({
        rank: index + 1,
        ...row,
        is_current_user: row.user_id === ctx.profile.id
      }));

      const currentUserRankIndex = scored.findIndex((row) => row.user_id === ctx.profile.id);

      return {
        items: ranked,
        current_user_rank: currentUserRankIndex >= 0 ? currentUserRankIndex + 1 : null
      };
    })
});

