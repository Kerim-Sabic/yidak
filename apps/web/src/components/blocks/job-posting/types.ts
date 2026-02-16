import type { GCCCountry, JobCategorySlug, UrgencyLevel } from '@yidak/types';
import type { LucideIcon } from 'lucide-react';

export interface JobCategoryItem {
  id: string;
  slug: JobCategorySlug;
  icon: LucideIcon;
  subcategoryKeys: ReadonlyArray<string>;
}

export interface BudgetSuggestion {
  min: number;
  max: number;
}

export interface JobDraftLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  area: string;
  building: string;
  country: GCCCountry;
}

export interface JobPostFormValues {
  category_id: string;
  title: string;
  description: string;
  photos: string[];
  preferred_gender: 'any' | 'male' | 'female';
  location: JobDraftLocation;
  budget_min: number;
  budget_max: number;
  urgency: UrgencyLevel;
  schedule_mode: 'asap' | 'scheduled';
  scheduled_date: string;
  scheduled_time: string;
  accepted_terms: boolean;
}
