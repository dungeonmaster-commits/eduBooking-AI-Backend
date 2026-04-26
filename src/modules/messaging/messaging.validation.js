import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1,    'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters')
    .trim(),
});

export const messageFilterSchema = z.object({
  page:  z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
}).transform((data) => ({
  page:  data.page  ?? 1,
  limit: data.limit ?? 20,
}));