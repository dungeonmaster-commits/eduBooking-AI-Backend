import * as paymentRepository from './payment.repository.js';
import * as razorpayUtil      from '../../utils/razorpay.util.js';
import prisma                 from '../../database/prisma.client.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../utils/errors.util.js';

// ─────────────────────────────────────────────
// INITIATE PAYMENT
// ─────────────────────────────────────────────

/**
 * Step 1 of payment flow.
 * Creates a Razorpay order and a pending payment record in our DB.
 * Returns order details for the frontend to open the checkout.
 */
export const initiatePayment = async (userId, { bookingId }) => {
  // 1. Get the booking
  const booking = await prisma.booking.findUnique({
    where:   { id: bookingId },
    include: { resource: true },
  });

  if (!booking) throw new NotFoundError('Booking not found');

  // 2. Verify ownership
  if (booking.userId !== userId) {
    throw new ForbiddenError('You can only pay for your own bookings');
  }

  // 3. Check booking status
  if (booking.status === 'CANCELLED') {
    throw new ValidationError('Cannot pay for a cancelled booking');
  }
  if (booking.status === 'CONFIRMED') {
    throw new ValidationError('This booking is already paid and confirmed');
  }

  // 4. Check if payment already exists
  const existingPayment = await paymentRepository.findPaymentByBookingId(bookingId);
  if (existingPayment && existingPayment.status === 'SUCCESS') {
    throw new ValidationError('Payment already completed for this booking');
  }

  const amount = Number(booking.resource.price);

  // 5. Handle free resources — no payment needed
  if (amount === 0) {
    // Auto confirm booking for free resources
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data:  { status: 'CONFIRMED', confirmedAt: new Date() },
      }),
    ]);

    return {
      isFree:  true,
      message: 'Resource is free — booking confirmed automatically',
    };
  }

  // 6. Create Razorpay order
  const razorpayOrder = await razorpayUtil.createRazorpayOrder(
    amount,
    bookingId,  // receipt = our bookingId
    {
      bookingId,
      userId,
      resourceTitle: booking.resource.title,
    }
  );

  // 7. Create or update pending payment record in our DB
  let payment;
  if (existingPayment) {
    payment = await paymentRepository.updatePayment(existingPayment.id, {
      razorpayOrderId: razorpayOrder.id,
      status:          'PENDING',
    });
  } else {
    payment = await paymentRepository.createPayment({
      userId,
      bookingId,
      amount,
      currency:        'INR',
      status:          'PENDING',
      razorpayOrderId: razorpayOrder.id,
    });
  }

  // 8. Return what the frontend needs to open Razorpay checkout
  return {
    isFree:   false,
    payment: {
      id:     payment.id,
      amount,
      currency: 'INR',
    },
    razorpay: {
      orderId:  razorpayOrder.id,
      amount:   razorpayOrder.amount,   // in paise
      currency: razorpayOrder.currency,
      keyId:    process.env.RAZORPAY_KEY_ID, // frontend needs this
    },
    booking: {
      id:    booking.id,
      title: booking.resource.title,
    },
  };
};

// ─────────────────────────────────────────────
// VERIFY PAYMENT
// ─────────────────────────────────────────────

/**
 * Step 2 of payment flow.
 * Called by frontend after Razorpay checkout completes.
 * Verifies signature → marks payment successful → confirms booking.
 */
export const verifyPayment = async (userId, data) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = data;

  // 1. Find payment record
  const payment = await paymentRepository.findPaymentByOrderId(razorpayOrderId);
  if (!payment) throw new NotFoundError('Payment record not found');

  // 2. Verify ownership
  if (payment.userId !== userId) {
    throw new ForbiddenError('Unauthorized payment verification');
  }

  // 3. Verify Razorpay signature — this is the critical security check
  const isValid = razorpayUtil.verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValid) {
    // Mark payment as failed if signature is invalid
    await paymentRepository.updatePayment(payment.id, {
      status:        'FAILED',
      failureReason: 'Invalid payment signature',
    });
    throw new ValidationError('Payment verification failed — invalid signature');
  }

  // 4. Signature valid → confirm payment + booking atomically
  await paymentRepository.confirmPaymentAndBooking(
    payment.id,
    bookingId,
    {
      status:            'SUCCESS',
      razorpayPaymentId,
      razorpaySignature,
    }
  );

  return {
    success: true,
    message: 'Payment successful! Booking confirmed.',
    payment: {
      id:               payment.id,
      amount:           payment.amount,
      razorpayPaymentId,
    },
  };
};

// ─────────────────────────────────────────────
// WEBHOOK
// ─────────────────────────────────────────────

/**
 * Handles Razorpay webhooks.
 * This is the safety net — called directly by Razorpay servers.
 *
 * Even if the frontend crashed after payment,
 * this ensures our DB gets updated.
 */
export const handleWebhook = async (body, signature) => {
  // 1. Verify webhook signature
  const isValid = razorpayUtil.verifyWebhookSignature(body, signature);
  if (!isValid) {
    throw new ValidationError('Invalid webhook signature');
  }

  const event   = body.event;
  const payload = body.payload?.payment?.entity;

  if (!payload) return { received: true };

  // 2. Handle different webhook events
  switch (event) {

    case 'payment.captured': {
      // Payment successful
      const payment = await paymentRepository.findPaymentByOrderId(payload.order_id);
      if (payment && payment.status !== 'SUCCESS') {
        await paymentRepository.confirmPaymentAndBooking(
          payment.id,
          payment.bookingId,
          {
            status:            'SUCCESS',
            razorpayPaymentId: payload.id,
          }
        );
      }
      break;
    }

    case 'payment.failed': {
      // Payment failed
      const payment = await paymentRepository.findPaymentByOrderId(payload.order_id);
      if (payment) {
        await paymentRepository.updatePayment(payment.id, {
          status:        'FAILED',
          failureReason: payload.error_description ?? 'Payment failed',
        });
      }
      break;
    }

    case 'refund.processed': {
      // Refund processed by Razorpay
      const razorpayPaymentId = payload.payment_id;
      const payment = await prisma.payment.findUnique({
        where: { razorpayPaymentId },
      });
      if (payment) {
        await paymentRepository.updatePayment(payment.id, {
          status:     'REFUNDED',
          refundId:   payload.id,
          refundedAt: new Date(),
        });
      }
      break;
    }

    default:
      console.log(`Unhandled Razorpay webhook event: ${event}`);
  }

  return { received: true };
};

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export const getMyPayments = async (userId, filters) => {
  return paymentRepository.findMyPayments(userId, filters);
};

export const getPaymentById = async (paymentId, requestingUser) => {
  const payment = await paymentRepository.findPaymentById(paymentId);
  if (!payment) throw new NotFoundError('Payment not found');

  // Students can only view their own payments
  if (
    requestingUser.role === 'STUDENT' &&
    payment.user.id !== requestingUser.id
  ) {
    throw new ForbiddenError('You can only view your own payments');
  }

  return payment;
};

export const getAllPayments = async (filters) => {
  return paymentRepository.findAllPayments(filters);
};

// ─────────────────────────────────────────────
// REFUND
// ─────────────────────────────────────────────

export const initiateRefund = async (paymentId, data, requestingUser) => {
  const payment = await paymentRepository.findPaymentById(paymentId);
  if (!payment) throw new NotFoundError('Payment not found');

  if (payment.status !== 'SUCCESS') {
    throw new ValidationError('Only successful payments can be refunded');
  }

  const refundAmount = data.amount ?? Number(payment.amount);

  // Initiate refund via Razorpay
  const refund = await razorpayUtil.initiateRefund(
    payment.razorpayPaymentId,
    refundAmount
  );

  // Update payment record
  return paymentRepository.updatePayment(paymentId, {
    status:       'REFUNDED',
    refundId:     refund.id,
    refundedAt:   new Date(),
    refundAmount,
    refundReason: data.reason ?? null,
  });
};