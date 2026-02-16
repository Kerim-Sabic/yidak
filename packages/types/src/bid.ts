import { z } from 'zod';

import { BidStatus, GCCCurrency } from './enums';
import { BidIdSchema, JobIdSchema, UserIdSchema } from './ids';

export const PlaceBidInputSchema = z.object({
  job_id: JobIdSchema,
  amount: z.number().positive(),
  currency: z.nativeEnum(GCCCurrency),
  message: z.string().max(1000).optional(),
  estimated_duration_hours: z.number().positive().max(720)
});

export const BidSchema = z.object({
  id: BidIdSchema,
  job_id: JobIdSchema,
  worker_id: UserIdSchema,
  amount: z.number().positive(),
  currency: z.nativeEnum(GCCCurrency),
  message: z.string().nullable(),
  estimated_duration_hours: z.number().positive(),
  status: z.nativeEnum(BidStatus),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  withdrawn_at: z.coerce.date().nullable()
});

export type PlaceBidInput = z.infer<typeof PlaceBidInputSchema>;
export type Bid = z.infer<typeof BidSchema>;
