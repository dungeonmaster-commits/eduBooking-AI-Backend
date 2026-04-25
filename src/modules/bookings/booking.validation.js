import { z } from 'zod';

// ── Create Booking ─────────────────────────────────────────────────────────────
export const createBookingSchema = z.object({
  resourceId: z.string().uuid('Invalid resource ID'),

  startTime: z.string()
    .datetime({ message: 'Invalid start time format. Use ISO 8601 e.g. 2024-06-01T09:00:00Z' }),

  endTime: z.string()
    .datetime({ message: 'Invalid end time format. Use ISO 8601 e.g. 2024-06-01T11:00:00Z' }),

  notes: z.string().trim().max(500).optional(),

}).refine(
  // Business rule: endTime must be after startTime
  (data) => new Date(data.endTime) > new Date(data.startTime),
  {
    message: 'End time must be after start time',
    path:    ['endTime'],
  }
).refine(
  // Business rule: cannot book in the past
  (data) => new Date(data.startTime) > new Date(),
  {
    message: 'Start time cannot be in the past',
    path:    ['startTime'],
  }
);

// ── Cancel Booking ─────────────────────────────────────────────────────────────
export const cancelBookingSchema = z.object({
  cancellationReason: z.string().trim().max(500).optional(),
});

// ── Filter Bookings (for listing) ──────────────────────────────────────────────
export const bookingFilterSchema = z.object({
  status:   z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  page:     z.coerce.number().int().min(1).optional().default(1),
  limit:    z.coerce.number().int().min(1).max(50).optional().default(10),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).transform((data) => ({
  ...data,
  page:      data.page      ?? 1,
  limit:     data.limit     ?? 10,
  sortOrder: data.sortOrder ?? 'desc',
}));