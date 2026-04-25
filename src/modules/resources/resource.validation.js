import { z } from 'zod';

const ResourceTypeEnum = z.enum([
  'COURSE',
  'LAB',
  'HARDWARE',
  'SEMINAR_HALL',
  'YOUTUBE_VIDEO',
  'YOUTUBE_PLAYLIST',
  'UDEMY_COURSE',
  'COURSERA_COURSE',
  'STUDY_MATERIAL',
]);

const DifficultyEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

// ── Create Resource (admin/instructor) ────────────────────────────────────────
export const createResourceSchema = z.object({
  title:          z.string().min(3, 'Title must be at least 3 characters').trim(),
  description:    z.string().trim().optional(),
  type:           ResourceTypeEnum,
  difficultyLevel: DifficultyEnum.default('BEGINNER'),
  price:          z.number().min(0).default(0),
  capacity:       z.number().int().positive().optional(),
  location:       z.string().trim().optional(),
  thumbnailUrl:   z.string().url().optional(),
  tags:           z.array(z.string().trim()).default([]),
  branch:         z.array(z.string().trim()).default([]),
  semester:       z.array(z.number().int().min(1).max(12)).default([]),
  duration:       z.number().int().positive().optional(),

  // External resource fields
  isExternal:      z.boolean().default(false),
  externalUrl:     z.string().url().optional(),
  externalId:      z.string().optional(),
  externalPlatform: z.enum(['youtube', 'udemy', 'coursera']).optional(),
});

// ── Update Resource ───────────────────────────────────────────────────────────
export const updateResourceSchema = createResourceSchema.partial();

// ── Filter/Search Resources ───────────────────────────────────────────────────
export const resourceFilterSchema = z.object({
  type:            ResourceTypeEnum.optional(),
  difficultyLevel: DifficultyEnum.optional(),
  branch:          z.string().optional(),
  semester:        z.coerce.number().int().optional(),
  minPrice:        z.coerce.number().min(0).optional(),
  maxPrice:        z.coerce.number().min(0).optional(),
  isExternal:      z.enum(['true', 'false']).optional(),
  platform:        z.enum(['youtube', 'udemy', 'coursera']).optional(),
  search:          z.string().trim().optional(),
  tags:            z.string().optional(),

  // ✅ All have safe defaults + optional() to handle missing params
  page:      z.coerce.number().int().min(1).optional().default(1),
  limit:     z.coerce.number().int().min(1).max(50).optional().default(12),
  sortBy:    z.enum(['createdAt', 'rating', 'price', 'enrolledCount'])
               .optional()
               .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc'])
               .optional()
               .default('desc'),
}).transform((data) => ({
  // ✅ Guarantee all values have fallbacks even if Zod misses them
  ...data,
  page:      data.page      ?? 1,
  limit:     data.limit     ?? 12,
  sortBy:    data.sortBy    ?? 'createdAt',
  sortOrder: data.sortOrder ?? 'desc',
}));

// ── Rate Resource ─────────────────────────────────────────────────────────────
export const rateResourceSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().trim().max(1000).optional(),
});

// ── External Search ───────────────────────────────────────────────────────────
export const externalSearchSchema = z.object({
  query:    z.string().min(2, 'Search query too short').trim(),
  platform: z.enum(['youtube', 'udemy', 'coursera', 'all']).default('all'),
  type:     z.enum(['video', 'playlist']).default('video'),
  limit:    z.coerce.number().int().min(1).max(20).default(10),
});

// ── Import External Resource ──────────────────────────────────────────────────
export const importExternalSchema = z.object({
  externalId:      z.string().min(1),
  externalPlatform: z.enum(['youtube', 'udemy', 'coursera']),
  type:            ResourceTypeEnum,
  tags:            z.array(z.string().trim()).default([]),
  branch:          z.array(z.string().trim()).default([]),
  semester:        z.array(z.number().int().min(1).max(12)).default([]),
  difficultyLevel: DifficultyEnum.default('BEGINNER'),
});