import prisma from '../../database/prisma.client.js';

// ── Shared select shape ────────────────────────────────────────────────────────
// Reuse this in all queries to keep response shape consistent
const bookingSelect = {
  id:                 true,
  status:             true,
  startTime:          true,
  endTime:            true,
  notes:              true,
  cancelledAt:        true,
  cancellationReason: true,
  confirmedAt:        true,
  createdAt:          true,
  updatedAt:          true,
  user: {
    select: {
      id:    true,
      email: true,
      profile: {
        select: {
          firstName: true,
          lastName:  true,
          avatarUrl: true,
        },
      },
    },
  },
  resource: {
    select: {
      id:          true,
      title:       true,
      type:        true,
      location:    true,
      price:       true,
      thumbnailUrl: true,
      instructor: {
        select: {
          profile: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  },
  payment: {
    select: {
      id:     true,
      status: true,
      amount: true,
    },
  },
};

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export const findBookingById = async (id) => {
  return prisma.booking.findUnique({
    where:  { id },
    select: bookingSelect,
  });
};

export const findMyBookings = async (userId, filters) => {
  const { status, page, limit, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where = { userId };
  if (status) where.status = status;

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: sortOrder },
      select:  bookingSelect,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
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

export const findAllBookings = async (filters) => {
  const { status, page, limit, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: sortOrder },
      select:  bookingSelect,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
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

export const findBookingsByResource = async (resourceId, filters) => {
  const { status, page, limit, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where = { resourceId };
  if (status) where.status = status;

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: sortOrder },
      select:  bookingSelect,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
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

// Check if a resource is already booked in the requested time slot
export const findConflictingBooking = async (resourceId, startTime, endTime, excludeBookingId = null) => {
  const where = {
    resourceId,
    status:    { in: ['PENDING', 'CONFIRMED'] },
    // Overlap condition:
    // existing booking overlaps if it starts before our end
    // AND ends after our start
    AND: [
      { startTime: { lt: new Date(endTime)   } },
      { endTime:   { gt: new Date(startTime) } },
    ],
  };

  // Exclude current booking when checking for updates
  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }

  return prisma.booking.findFirst({ where });
};

// ─────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────

export const createBooking = async (data) => {
  return prisma.booking.create({
    data,
    select: bookingSelect,
  });
};

export const updateBookingStatus = async (id, data) => {
  return prisma.booking.update({
    where:  { id },
    data,
    select: bookingSelect,
  });
};

// Increment enrolled count on resource when booking confirmed
export const incrementEnrolledCount = async (resourceId) => {
  return prisma.resource.update({
    where: { id: resourceId },
    data:  { enrolledCount: { increment: 1 } },
  });
};

// Decrement enrolled count when booking cancelled
export const decrementEnrolledCount = async (resourceId) => {
  return prisma.resource.update({
    where: { id: resourceId },
    data:  { enrolledCount: { decrement: 1 } },
  });
};