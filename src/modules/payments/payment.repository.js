import prisma from '../../database/prisma.client.js';

const paymentSelect = {
  id:                 true,
  amount:             true,
  currency:           true,
  status:             true,
  razorpayOrderId:    true,
  razorpayPaymentId:  true,
  refundId:           true,
  refundedAt:         true,
  refundAmount:       true,
  refundReason:       true,
  failureReason:      true,
  createdAt:          true,
  updatedAt:          true,
  user: {
    select: {
      id:      true,
      email:   true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
  booking: {
    select: {
      id:        true,
      status:    true,
      startTime: true,
      endTime:   true,
      resource: {
        select: { id: true, title: true, type: true },
      },
    },
  },
};

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export const findPaymentById = async (id) => {
  return prisma.payment.findUnique({ where: { id }, select: paymentSelect });
};

export const findPaymentByBookingId = async (bookingId) => {
  return prisma.payment.findUnique({ where: { bookingId }, select: paymentSelect });
};

export const findPaymentByOrderId = async (razorpayOrderId) => {
  return prisma.payment.findUnique({ where: { razorpayOrderId } });
};

export const findMyPayments = async (userId, filters) => {
  const { status, page, limit, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where = { userId };
  if (status) where.status = status;

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: sortOrder },
      select:  paymentSelect,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext:    page < Math.ceil(total / limit),
      hasPrev:    page > 1,
    },
  };
};

export const findAllPayments = async (filters) => {
  const { status, page, limit, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;

  const [payments, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: sortOrder },
      select:  paymentSelect,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext:    page < Math.ceil(total / limit),
      hasPrev:    page > 1,
    },
  };
};

// ─────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────

export const createPayment = async (data) => {
  return prisma.payment.create({ data, select: paymentSelect });
};

export const updatePayment = async (id, data) => {
  return prisma.payment.update({ where: { id }, data, select: paymentSelect });
};

export const updatePaymentByOrderId = async (razorpayOrderId, data) => {
  return prisma.payment.update({ where: { razorpayOrderId }, data });
};

/**
 * Confirm payment + confirm booking in one transaction.
 * Both must succeed or both roll back.
 */
export const confirmPaymentAndBooking = async (paymentId, bookingId, paymentData) => {
  return prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data:  paymentData,
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data:  {
        status:      'CONFIRMED',
        confirmedAt: new Date(),
      },
    }),
  ]);
};