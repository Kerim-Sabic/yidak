import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

const connectionString =
  process.env.SUPABASE_DB_URL ?? 'postgres://postgres:postgres@localhost:5432/postgres';

export const sql = postgres(connectionString, {
  max: 10,
  prepare: false
});

export const db = drizzle(sql, { schema });

export type DrizzleDatabase = typeof db;

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type UserRole = 'customer' | 'worker' | 'admin';
type CountryCode = 'AE' | 'SA' | 'QA' | 'BH' | 'KW' | 'OM';
type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_id: string;
          role: UserRole;
          full_name: string;
          phone: string;
          email: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          country: CountryCode;
          city: string;
          language: string;
          is_verified: boolean;
          is_active: boolean;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          auth_id: string;
          role?: UserRole;
          full_name: string;
          phone: string;
          email?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          country: CountryCode;
          city: string;
          language?: string;
          is_verified?: boolean;
          is_active?: boolean;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          auth_id?: string;
          role?: UserRole;
          full_name?: string;
          phone?: string;
          email?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          country?: CountryCode;
          city?: string;
          language?: string;
          is_verified?: boolean;
          is_active?: boolean;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      worker_profiles: GenericTable;
      jobs: GenericTable;
      bids: GenericTable;
      payments: GenericTable;
      conversations: GenericTable;
      messages: GenericTable;
      reviews: GenericTable;
      notifications: GenericTable;
      job_categories: GenericTable;
      referrals: GenericTable;
      referral_codes: GenericTable;
      referral_rewards: GenericTable;
      disputes: GenericTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      country_code: CountryCode;
    };
    CompositeTypes: Record<string, never>;
  };
};
