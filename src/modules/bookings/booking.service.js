import * as bookingRepository  from './booking.repository.js';
import * as resourceRepository from '../resources/resource.repository.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '../../utils/errors.util.js';

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export const createBooking = async (userId, data) => {
  const { resourceId, startTime, endTime, notes } = data;

  // 1. Check resource exists and is available
  const resource = await resourceRepository.findResourceById(resourceId);
  if (!resource) {
    throw new NotFoundError('Resource not found');
  }
  if (!resource.isAvailable) {
    throw new ValidationError('Resource is not available for booking');
  }

  // 2. Check capacity — only for physical resources (labs, halls, hardware)
  const physicalTypes = ['LAB', 'HARDWARE', 'SEMINAR_HALL'];
  if (physicalTypes.includes(resource.type) && resource.capacity) {

    // Check for time slot conflicts
    const conflict = await bookingRepository.findConflictingBooking(
      resourceId, startTime, endTime
    );

    if (conflict) {
      throw new ConflictError(
        'This resource is already booked for the selected time slot'
      );
    }
  }

  // 3. Create the booking
  const booking = await bookingRepository.createBooking({
    userId,
    resourceId,
    startTime:  new Date(startTime),
    endTime:    new Date(endTime),
    notes,
    status:     'PENDING',
  });

  return booking;
};

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export const getMyBookings = async (userId, filters) => {
  return bookingRepository.findMyBookings(userId, filters);
};

export const getBookingById = async (bookingId, requestingUser) => {
  const booking = await bookingRepository.findBookingById(bookingId);

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Students can only view their own bookings
  // Admins and instructors can view any booking
  if (
    requestingUser.role === 'STUDENT' &&
    booking.user.id !== requestingUser.id
  ) {
    throw new ForbiddenError('You can only view your own bookings');
  }

  return booking;
};

export const getAllBookings = async (filters) => {
  return bookingRepository.findAllBookings(filters);
};

export const getBookingsByResource = async (resourceId, filters, requestingUser) => {
  // Check resource exists
  const resource = await resourceRepository.findResourceById(resourceId);
  if (!resource) throw new NotFoundError('Resource not found');

  // Instructors can only see bookings for their own resources
  if (
    requestingUser.role === 'INSTRUCTOR' &&
    resource.instructorId !== requestingUser.id
  ) {
    throw new ForbiddenError('You can only view bookings for your own resources');
  }

  return bookingRepository.findBookingsByResource(resourceId, filters);
};

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export const cancelBooking = async (bookingId, requestingUser, reason) => {
  const booking = await bookingRepository.findBookingById(bookingId);

  if (!booking) throw new NotFoundError('Booking not found');

  // Only the booking owner or admin can cancel
  if (
    requestingUser.role === 'STUDENT' &&
    booking.user.id !== requestingUser.id
  ) {
    throw new ForbiddenError('You can only cancel your own bookings');
  }

  // Cannot cancel already cancelled or completed bookings
  if (booking.status === 'CANCELLED') {
    throw new ValidationError('Booking is already cancelled');
  }
  if (booking.status === 'COMPLETED') {
    throw new ValidationError('Cannot cancel a completed booking');
  }

  // If was confirmed, decrement enrolled count
  if (booking.status === 'CONFIRMED') {
    await bookingRepository.decrementEnrolledCount(booking.resource.id);
  }

  return bookingRepository.updateBookingStatus(bookingId, {
    status:             'CANCELLED',
    cancelledAt:        new Date(),
    cancellationReason: reason ?? null,
  });
};

export const confirmBooking = async (bookingId, adminUserId) => {
  const booking = await bookingRepository.findBookingById(bookingId);

  if (!booking) throw new NotFoundError('Booking not found');

  if (booking.status !== 'PENDING') {
    throw new ValidationError(
      `Cannot confirm a booking with status: ${booking.status}`
    );
  }

  // Increment enrolled count on resource
  await bookingRepository.incrementEnrolledCount(booking.resource.id);

  return bookingRepository.updateBookingStatus(bookingId, {
    status:      'CONFIRMED',
    confirmedAt: new Date(),
    confirmedBy: adminUserId,
  });
};

export const completeBooking = async (bookingId) => {
  const booking = await bookingRepository.findBookingById(bookingId);

  if (!booking) throw new NotFoundError('Booking not found');

  if (booking.status !== 'CONFIRMED') {
    throw new ValidationError(
      `Cannot complete a booking with status: ${booking.status}`
    );
  }

  return bookingRepository.updateBookingStatus(bookingId, {
    status: 'COMPLETED',
  });
};