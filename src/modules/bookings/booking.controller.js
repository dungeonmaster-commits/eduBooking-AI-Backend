import * as bookingService from './booking.service.js';
import { sendSuccess }     from '../../utils/response.util.js';

export const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(
      req.user.id,
      req.validatedBody
    );
    return sendSuccess(res, {
      statusCode: 201,
      message:    'Booking created successfully',
      data:       booking,
    });
  } catch (err) { next(err); }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getMyBookings(
      req.user.id,
      req.validatedQuery
    );
    return sendSuccess(res, {
      message: 'Bookings retrieved successfully',
      data:    result,
    });
  } catch (err) { next(err); }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(
      req.params.id,
      req.user
    );
    return sendSuccess(res, {
      message: 'Booking retrieved',
      data:    booking,
    });
  } catch (err) { next(err); }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getAllBookings(req.validatedQuery);
    return sendSuccess(res, {
      message: 'All bookings retrieved',
      data:    result,
    });
  } catch (err) { next(err); }
};

export const getBookingsByResource = async (req, res, next) => {
  try {
    const result = await bookingService.getBookingsByResource(
      req.params.resourceId,
      req.validatedQuery,
      req.user
    );
    return sendSuccess(res, {
      message: 'Resource bookings retrieved',
      data:    result,
    });
  } catch (err) { next(err); }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { cancellationReason } = req.validatedBody;
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user,
      cancellationReason
    );
    return sendSuccess(res, {
      message: 'Booking cancelled successfully',
      data:    booking,
    });
  } catch (err) { next(err); }
};

export const confirmBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.confirmBooking(
      req.params.id,
      req.user.id
    );
    return sendSuccess(res, {
      message: 'Booking confirmed successfully',
      data:    booking,
    });
  } catch (err) { next(err); }
};

export const completeBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.completeBooking(req.params.id);
    return sendSuccess(res, {
      message: 'Booking marked as completed',
      data:    booking,
    });
  } catch (err) { next(err); }
};