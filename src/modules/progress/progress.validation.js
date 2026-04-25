import { z } from 'zod';

// ── Start Tracking ─────────────────────────────────────────────────────────────
export const startProgressSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID'),

  // Optional — for external resources not in our DB
  isExternal:       z.boolean().default(false),
  externalUrl:      z.string().url().optional(),
  externalPlatform: z.enum(['youtube', 'udemy', 'coursera']).optional(),
});

// ── Update Progress ────────────────────────────────────────────────────────────
export const updateProgressSchema = z.object({
  percentage: z
    .number()
    .min(0,   'Percentage cannot be less than 0')
    .max(100, 'Percentage cannot exceed 100')
    .optional(),

  timeSpentMins: z
    .number()
    .int()
    .min(0, 'Time spent cannot be negative')
    .optional(),

  notes:          z.string().trim().max(2000).optional(),
  personalRating: z.number().int().min(1).max(5).optional(),
  status:         z.enum(['IN_PROGRESS', 'DROPPED']).optional(),

}).refine(
  // At least one field must be provided
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided to update' }
);

// ── Filter Progress ────────────────────────────────────────────────────────────
export const progressFilterSchema = z.object({
  status:   z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED']).optional(),
  page:     z.coerce.number().int().min(1).optional().default(1),
  limit:    z.coerce.number().int().min(1).max(50).optional().default(10),
  sortBy:   z.enum(['lastAccessedAt', 'percentage', 'createdAt']).optional().default('lastAccessedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).transform((data) => ({
  ...data,
  page:      data.page      ?? 1,
  limit:     data.limit     ?? 10,
  sortBy:    data.sortBy    ?? 'lastAccessedAt',
  sortOrder: data.sortOrder ?? 'desc',
}));