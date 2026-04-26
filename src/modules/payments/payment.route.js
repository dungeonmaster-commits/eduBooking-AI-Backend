import { Router }            from 'express';
import * as paymentController from './payment.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate              from '../../middlewares/validate.middleware.js';
import {
  initiatePaymentSchema,
  verifyPaymentSchema,
  refundSchema,
  paymentFilterSchema,
} from './payment.validation.js';

const router = Router();

// ── Webhook — NO auth (called by Razorpay servers) ────────────────────────────
router.post('/webhook', paymentController.handleWebhook);

// ── All other routes require authentication ───────────────────────────────────
router.use(authenticate);

// ── Static routes first ───────────────────────────────────────────────────────

// Admin — all payments
router.get('/admin/all',
  authorize('ADMIN'),
  validate(paymentFilterSchema, 'query'),
  paymentController.getAllPayments
);

// My payment history
router.get('/',
  validate(paymentFilterSchema, 'query'),
  paymentController.getMyPayments
);

// Initiate payment
router.post('/initiate',
  validate(initiatePaymentSchema),
  paymentController.initiatePayment
);

// Verify payment after checkout
router.post('/verify',
  validate(verifyPaymentSchema),
  paymentController.verifyPayment
);

// ── Dynamic :id routes ────────────────────────────────────────────────────────
router.get('/:id', paymentController.getPaymentById);

// Refund — admin only
router.post('/:id/refund',
  authorize('ADMIN'),
  validate(refundSchema),
  paymentController.initiateRefund
);

export default router;