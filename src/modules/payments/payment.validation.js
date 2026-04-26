import { z } from 'zod';

// ── Initiate Payment ───────────────────────────────────────────────────────────
export const initiatePaymentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
});

// ── Verify Payment ─────────────────────────────────────────────────────────────
export const verifyPaymentSchema = z.object({
  razorpayOrderId:   z.string().min(1, 'Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Payment ID is required'),
  razorpaySignature: z.string().min(1, 'Signature is required'),
  bookingId:         z.string().uuid('Invalid booking ID'),
});

// ── Refund ─────────────────────────────────────────────────────────────────────
export const refundSchema = z.object({
  reason: z.string().trim().max(500).optional(),
  amount: z.number().positive('Refund amount must be positive').optional(),
  // If amount not provided, full refund is processed
});

// ── Payment Filter ─────────────────────────────────────────────────────────────
export const paymentFilterSchema = z.object({
  status:    z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']).optional(),
  page:      z.coerce.number().int().min(1).optional().default(1),
  limit:     z.coerce.number().int().min(1).max(50).optional().default(10),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
}).transform((data) => ({
  ...data,
  page:      data.page      ?? 1,
  limit:     data.limit     ?? 10,
  sortOrder: data.sortOrder ?? 'desc',
}));