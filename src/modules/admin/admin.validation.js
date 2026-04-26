import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN'], {
    errorMap: () => ({ message: 'Role must be STUDENT, INSTRUCTOR, or ADMIN' }),
  }),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED'], {
    errorMap: () => ({ message: 'Invalid booking status' }),
  }),
  reason: z.string().trim().max(500).optional(),
});

export const adminUserFilterSchema = z.object({
  role:      z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).optional(),
  isActive:  z.enum(['true', 'false']).optional(),
  search:    z.string().trim().optional(),   // search by name or email
  page:      z.coerce.number().int().min(1).optional().default(1),
  limit:     z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy:    z.enum(['createdAt', 'email']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).transform((data) => ({
  ...data,
  page:      data.page      ?? 1,
  limit:     data.limit     ?? 20,
  sortBy:    data.sortBy    ?? 'createdAt',
  sortOrder: data.sortOrder ?? 'desc',
}));

export const adminBookingFilterSchema = z.object({
  status:    z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  userId:    z.string().uuid().optional(),
  resourceId: z.string().uuid().optional(),
  page:      z.coerce.number().int().min(1).optional().default(1),
  limit:     z.coerce.number().int().min(1).max(100).optional().default(20),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).transform((data) => ({
  ...data,
  page:      data.page      ?? 1,
  limit:     data.limit     ?? 20,
  sortOrder: data.sortOrder ?? 'desc',
}));

export const adminResourceFilterSchema = z.object({
  type:        z.enum([
    'COURSE', 'LAB', 'HARDWARE', 'SEMINAR_HALL',
    'YOUTUBE_VIDEO', 'YOUTUBE_PLAYLIST',
    'UDEMY_COURSE', 'COURSERA_COURSE', 'STUDY_MATERIAL',
  ]).optional(),
  isAvailable: z.enum(['true', 'false']).optional(),
  isExternal:  z.enum(['true', 'false']).optional(),
  search:      z.string().trim().optional(),
  page:        z.coerce.number().int().min(1).optional().default(1),
  limit:       z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy:      z.enum(['createdAt', 'enrolledCount', 'rating']).optional().default('createdAt'),
  sortOrder:   z.enum(['asc', 'desc']).optional().default('desc'),
}).transform((data) => ({
  ...data,
  page:      data.page      ?? 1,
  limit:     data.limit     ?? 20,
  sortBy:    data.sortBy    ?? 'createdAt',
  sortOrder: data.sortOrder ?? 'desc',
}));