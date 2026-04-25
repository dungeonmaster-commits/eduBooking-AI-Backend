import { Router }             from 'express';
import * as bookingController from './booking.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate               from '../../middlewares/validate.middleware.js';
import {
  createBookingSchema,
  cancelBookingSchema,
  bookingFilterSchema,
} from './booking.validation.js';

const router = Router();

router.use(authenticate);

// ── Static routes first ───────────────────────────────────────────────────────

// Admin only — get ALL bookings across platform
router.get('/admin/all',
  authorize('ADMIN'),
  validate(bookingFilterSchema, 'query'),
  bookingController.getAllBookings
);

// Admin/Instructor — get bookings for a specific resource
router.get('/resource/:resourceId',
  authorize('ADMIN', 'INSTRUCTOR'),
  validate(bookingFilterSchema, 'query'),
  bookingController.getBookingsByResource
);

// ── Student routes ────────────────────────────────────────────────────────────

// Get my bookings
router.get('/',
  validate(bookingFilterSchema, 'query'),
  bookingController.getMyBookings
);

// Create a booking
router.post('/',
  validate(createBookingSchema),
  bookingController.createBooking
);

// ── Dynamic :id routes ────────────────────────────────────────────────────────

router.get('/:id', bookingController.getBookingById);

// Cancel — student can cancel own, admin can cancel any
router.patch('/:id/cancel',
  validate(cancelBookingSchema),
  bookingController.cancelBooking
);

// Confirm — admin only
router.patch('/:id/confirm',
  authorize('ADMIN'),
  bookingController.confirmBooking
);

// Complete — admin only
router.patch('/:id/complete',
  authorize('ADMIN'),
  bookingController.completeBooking
);

export default router;