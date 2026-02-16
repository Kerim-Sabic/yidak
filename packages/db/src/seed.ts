import { randomUUID } from 'node:crypto';

import { db, sql } from './client';
import { jobs, jobCategories } from './schema/jobs';
import { profiles } from './schema/users';

const categorySeeds: ReadonlyArray<{
  readonly slug: string;
  readonly name_en: string;
  readonly name_ar: string;
  readonly sort_order: number;
}> = [
  { slug: 'plumbing', name_en: 'Plumbing', name_ar: 'السباكة', sort_order: 1 },
  { slug: 'electrical', name_en: 'Electrical', name_ar: 'الأعمال الكهربائية', sort_order: 2 },
  { slug: 'ac-hvac', name_en: 'AC & HVAC', name_ar: 'التكييف والتهوية', sort_order: 3 },
  { slug: 'painting', name_en: 'Painting', name_ar: 'الدهانات', sort_order: 4 },
  { slug: 'carpentry', name_en: 'Carpentry', name_ar: 'النجارة', sort_order: 5 },
  { slug: 'cleaning', name_en: 'Cleaning', name_ar: 'التنظيف', sort_order: 6 },
  { slug: 'pest-control', name_en: 'Pest Control', name_ar: 'مكافحة الآفات', sort_order: 7 },
  { slug: 'moving', name_en: 'Moving', name_ar: 'النقل', sort_order: 8 },
  { slug: 'locksmith', name_en: 'Locksmith', name_ar: 'الأقفال', sort_order: 9 },
  {
    slug: 'appliance-repair',
    name_en: 'Appliance Repair',
    name_ar: 'صيانة الأجهزة',
    sort_order: 10
  },
  { slug: 'landscaping', name_en: 'Landscaping', name_ar: 'تنسيق الحدائق', sort_order: 11 },
  { slug: 'tiling', name_en: 'Tiling', name_ar: 'التبليط', sort_order: 12 },
  { slug: 'glass-mirrors', name_en: 'Glass & Mirrors', name_ar: 'الزجاج والمرايا', sort_order: 13 },
  { slug: 'welding', name_en: 'Welding', name_ar: 'اللحام', sort_order: 14 },
  { slug: 'masonry', name_en: 'Masonry', name_ar: 'البناء', sort_order: 15 },
  { slug: 'roofing', name_en: 'Roofing', name_ar: 'الأسقف', sort_order: 16 },
  { slug: 'flooring', name_en: 'Flooring', name_ar: 'الأرضيات', sort_order: 17 },
  {
    slug: 'curtains-blinds',
    name_en: 'Curtains & Blinds',
    name_ar: 'الستائر والستائر المعدنية',
    sort_order: 18
  },
  {
    slug: 'handyman-general',
    name_en: 'General Handyman',
    name_ar: 'فني متعدد المهام',
    sort_order: 19
  },
  { slug: 'smart-home', name_en: 'Smart Home', name_ar: 'المنزل الذكي', sort_order: 20 },
  { slug: 'waterproofing', name_en: 'Waterproofing', name_ar: 'العزل المائي', sort_order: 21 },
  { slug: 'renovation', name_en: 'Renovation', name_ar: 'الترميم', sort_order: 22 }
];

export const seedDatabase = async (): Promise<void> => {
  const customerId = randomUUID();
  const workerId = randomUUID();

  await db.insert(jobCategories).values(
    categorySeeds.map((category) => ({
      ...category,
      is_active: true
    }))
  );

  const insertedCategories = await db.select().from(jobCategories);
  const firstCategory = insertedCategories[0];

  if (!firstCategory) {
    throw new Error('No categories found after seed.');
  }

  await db.insert(profiles).values([
    {
      id: customerId,
      auth_id: randomUUID(),
      role: 'customer',
      full_name: 'Aisha Al Mansoori',
      phone: '+971500000001',
      email: 'aisha@example.com',
      country: 'AE',
      city: 'Dubai',
      language: 'en'
    },
    {
      id: workerId,
      auth_id: randomUUID(),
      role: 'worker',
      full_name: 'Omar Al Qahtani',
      phone: '+966500000002',
      email: 'omar@example.com',
      country: 'SA',
      city: 'Riyadh',
      language: 'ar'
    }
  ]);

  await db.insert(jobs).values({
    customer_id: customerId,
    assigned_worker_id: workerId,
    title: 'Fix leaking kitchen sink',
    description: 'Need urgent repair for a leaking sink and inspection of nearby pipes.',
    category_id: firstCategory.id,
    location: 'SRID=4326;POINT(55.2708 25.2048)',
    address: 'Downtown Dubai',
    city: 'Dubai',
    country: 'AE',
    budget_min: 120,
    budget_max: 250,
    urgency: 'urgent',
    status: 'assigned',
    bid_count: 3,
    lowest_bid: 150,
    preferred_gender: 'any',
    photos: []
  });
};

await seedDatabase();
await sql.end();
