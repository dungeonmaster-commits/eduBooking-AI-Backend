import { z } from 'zod';

// ── Post ──────────────────────────────────────────────────────────────────────
export const createPostSchema = z.object({
  title: z
    .string()
    .min(5,   'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .trim(),

  content: z
    .string()
    .min(10,  'Content must be at least 10 characters')
    .max(5000,'Content cannot exceed 5000 characters')
    .trim(),

  tags:     z.array(z.string().trim().min(1)).max(10).default([]),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

export const updatePostSchema = z.object({
  title: z
    .string()
    .min(5).max(200).trim()
    .optional(),

  content: z
    .string()
    .min(10).max(5000).trim()
    .optional(),

  tags:     z.array(z.string().trim()).max(10).optional(),
  imageUrl: z.string().url().optional().nullable(),
});

// ── Comment ───────────────────────────────────────────────────────────────────
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1,    'Comment cannot be empty')
    .max(2000, 'Comment cannot exceed 2000 characters')
    .trim(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1).max(2000).trim(),
});

// ── Feed Filters ──────────────────────────────────────────────────────────────
export const postFilterSchema = z.object({
  tags:      z.string().optional(),        // comma-separated e.g. "nodejs,react"
  search:    z.string().trim().optional(),
  userId:    z.string().uuid().optional(), // filter by author
  page:      z.coerce.number().int().min(1).optional().default(1),
  limit:     z.coerce.number().int().min(1).max(50).optional().default(10),
  sortBy:    z.enum(['createdAt', 'likesCount', 'commentsCount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).transform((data) => ({
  ...data,
  page:      data.page      ?? 1,
  limit:     data.limit     ?? 10,
  sortBy:    data.sortBy    ?? 'createdAt',
  sortOrder: data.sortOrder ?? 'desc',
}));