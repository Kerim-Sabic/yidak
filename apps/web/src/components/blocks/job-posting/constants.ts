import { JobCategorySlug, type GCCCountry, type UrgencyLevel } from '@yidak/types';
import {
  AirVent,
  Bug,
  Building2,
  Brush,
  Droplets,
  Flame,
  Hammer,
  HardHat,
  House,
  KeyRound,
  Layers,
  Lightbulb,
  Paintbrush,
  Sparkles,
  Trees,
  Truck,
  Wifi,
  Wrench
} from 'lucide-react';

import type { BudgetSuggestion, JobCategoryItem, JobDraftLocation, JobPostFormValues } from './types';

const makeCategoryId = (suffix: number): string =>
  `10000000-0000-4000-8000-${suffix.toString().padStart(12, '0')}`;

export const JOB_CATEGORIES: ReadonlyArray<JobCategoryItem> = [
  { id: makeCategoryId(1), slug: JobCategorySlug.PLUMBING, icon: Wrench, subcategoryKeys: ['pipeLeak', 'waterHeater', 'drainCleaning'] },
  { id: makeCategoryId(2), slug: JobCategorySlug.ELECTRICAL, icon: Lightbulb, subcategoryKeys: ['socketRepair', 'wiring', 'breaker'] },
  { id: makeCategoryId(3), slug: JobCategorySlug.AC_HVAC, icon: AirVent, subcategoryKeys: ['acMaintenance', 'acRepair', 'ductCleaning'] },
  { id: makeCategoryId(4), slug: JobCategorySlug.PAINTING, icon: Paintbrush, subcategoryKeys: ['interior', 'exterior', 'touchUps'] },
  { id: makeCategoryId(5), slug: JobCategorySlug.CARPENTRY, icon: Hammer, subcategoryKeys: ['cabinetFix', 'doorRepair', 'customShelf'] },
  { id: makeCategoryId(6), slug: JobCategorySlug.CLEANING, icon: Sparkles, subcategoryKeys: ['deepClean', 'moveInOut', 'postRenovation'] },
  { id: makeCategoryId(7), slug: JobCategorySlug.PEST_CONTROL, icon: Bug, subcategoryKeys: ['cockroach', 'termite', 'rodent'] },
  { id: makeCategoryId(8), slug: JobCategorySlug.MOVING, icon: Truck, subcategoryKeys: ['studioMove', 'villaMove', 'packing'] },
  { id: makeCategoryId(9), slug: JobCategorySlug.LOCKSMITH, icon: KeyRound, subcategoryKeys: ['doorUnlock', 'lockChange', 'smartLock'] },
  { id: makeCategoryId(10), slug: JobCategorySlug.APPLIANCE_REPAIR, icon: Wrench, subcategoryKeys: ['washingMachine', 'fridge', 'oven'] },
  { id: makeCategoryId(11), slug: JobCategorySlug.LANDSCAPING, icon: Trees, subcategoryKeys: ['gardenCare', 'irrigation', 'treeTrim'] },
  { id: makeCategoryId(12), slug: JobCategorySlug.TILING, icon: Layers, subcategoryKeys: ['bathroom', 'kitchen', 'outdoor'] },
  { id: makeCategoryId(13), slug: JobCategorySlug.GLASS_MIRRORS, icon: Building2, subcategoryKeys: ['mirrorInstall', 'windowFix', 'glassDoor'] },
  { id: makeCategoryId(14), slug: JobCategorySlug.WELDING, icon: Flame, subcategoryKeys: ['gateRepair', 'railing', 'customFrame'] },
  { id: makeCategoryId(15), slug: JobCategorySlug.MASONRY, icon: HardHat, subcategoryKeys: ['blockWork', 'plaster', 'concretePatch'] },
  { id: makeCategoryId(16), slug: JobCategorySlug.ROOFING, icon: House, subcategoryKeys: ['waterLeak', 'roofCoating', 'tileRepair'] },
  { id: makeCategoryId(17), slug: JobCategorySlug.FLOORING, icon: Layers, subcategoryKeys: ['vinyl', 'wood', 'marblePolish'] },
  { id: makeCategoryId(18), slug: JobCategorySlug.CURTAINS_BLINDS, icon: Paintbrush, subcategoryKeys: ['curtainInstall', 'blindRepair', 'motorized'] },
  { id: makeCategoryId(19), slug: JobCategorySlug.HANDYMAN_GENERAL, icon: Hammer, subcategoryKeys: ['minorFixes', 'assembly', 'maintenance'] },
  { id: makeCategoryId(20), slug: JobCategorySlug.SMART_HOME, icon: Wifi, subcategoryKeys: ['cameraSetup', 'doorbell', 'automation'] },
  { id: makeCategoryId(21), slug: JobCategorySlug.WATERPROOFING, icon: Droplets, subcategoryKeys: ['bathroomSeal', 'roofSeal', 'basement'] },
  { id: makeCategoryId(22), slug: JobCategorySlug.RENOVATION, icon: Brush, subcategoryKeys: ['kitchen', 'bathroom', 'fullUnit'] }
];

export const GCC_CITIES: Readonly<Record<GCCCountry, ReadonlyArray<string>>> = {
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Ras Al Khaimah'],
  SA: ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Makkah', 'Madinah'],
  QA: ['Doha', 'Al Wakrah', 'Lusail', 'Al Rayyan'],
  BH: ['Manama', 'Muharraq', 'Riffa', 'Hamad Town'],
  KW: ['Kuwait City', 'Hawally', 'Salmiya', 'Farwaniya'],
  OM: ['Muscat', 'Seeb', 'Salalah', 'Sohar']
};

export const URGENCY_TIME_LIMIT: Readonly<Record<UrgencyLevel, string>> = {
  flexible: '48h',
  normal: '24h',
  urgent: '6h',
  emergency: '2h'
};

const baseBudgetByCategory: Readonly<Record<string, BudgetSuggestion>> = {
  [JobCategorySlug.PLUMBING]: { min: 120, max: 480 },
  [JobCategorySlug.ELECTRICAL]: { min: 140, max: 520 },
  [JobCategorySlug.AC_HVAC]: { min: 180, max: 760 },
  [JobCategorySlug.PAINTING]: { min: 220, max: 1200 },
  [JobCategorySlug.CARPENTRY]: { min: 200, max: 1400 },
  [JobCategorySlug.CLEANING]: { min: 90, max: 420 },
  [JobCategorySlug.PEST_CONTROL]: { min: 130, max: 500 },
  [JobCategorySlug.MOVING]: { min: 280, max: 1600 },
  [JobCategorySlug.LOCKSMITH]: { min: 100, max: 350 },
  [JobCategorySlug.APPLIANCE_REPAIR]: { min: 140, max: 650 },
  [JobCategorySlug.LANDSCAPING]: { min: 250, max: 2200 },
  [JobCategorySlug.TILING]: { min: 300, max: 1800 },
  [JobCategorySlug.GLASS_MIRRORS]: { min: 260, max: 1500 },
  [JobCategorySlug.WELDING]: { min: 220, max: 1300 },
  [JobCategorySlug.MASONRY]: { min: 300, max: 2000 },
  [JobCategorySlug.ROOFING]: { min: 450, max: 3500 },
  [JobCategorySlug.FLOORING]: { min: 350, max: 2400 },
  [JobCategorySlug.CURTAINS_BLINDS]: { min: 150, max: 1000 },
  [JobCategorySlug.HANDYMAN_GENERAL]: { min: 100, max: 800 },
  [JobCategorySlug.SMART_HOME]: { min: 180, max: 1500 },
  [JobCategorySlug.WATERPROOFING]: { min: 300, max: 2500 },
  [JobCategorySlug.RENOVATION]: { min: 1000, max: 10000 }
};

const cityFactor = (city: string): number => {
  const normalized = city.trim().toLowerCase();

  if (normalized === 'dubai' || normalized === 'riyadh' || normalized === 'doha') {
    return 1.1;
  }

  if (normalized === 'abu dhabi' || normalized === 'jeddah' || normalized === 'muscat') {
    return 1.05;
  }

  return 1;
};

export const getBudgetSuggestion = (categorySlug: string, city: string): BudgetSuggestion => {
  const base = baseBudgetByCategory[categorySlug] ?? { min: 120, max: 600 };
  const factor = cityFactor(city);

  return {
    min: Math.round(base.min * factor),
    max: Math.round(base.max * factor)
  };
};

export const JOB_POSTING_DEFAULTS: JobPostFormValues = {
  category_id: '',
  title: '',
  description: '',
  photos: [],
  preferred_gender: 'any',
  location: {
    latitude: 25.2048,
    longitude: 55.2708,
    address: '',
    city: 'Dubai',
    area: '',
    building: '',
    country: 'AE'
  },
  budget_min: 200,
  budget_max: 1200,
  urgency: 'normal',
  schedule_mode: 'asap',
  scheduled_date: '',
  scheduled_time: '',
  accepted_terms: false
};

export const emptyLocation = (): JobDraftLocation => ({
  latitude: JOB_POSTING_DEFAULTS.location.latitude,
  longitude: JOB_POSTING_DEFAULTS.location.longitude,
  address: '',
  city: '',
  area: '',
  building: '',
  country: 'AE'
});
