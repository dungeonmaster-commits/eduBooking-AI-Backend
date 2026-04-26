import * as adminService from './admin.service.js';
import { sendSuccess }   from '../../utils/response.util.js';

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getPlatformStats = async (req, res, next) => {
  try {
    const stats = await adminService.getPlatformStats();
    return sendSuccess(res, { message: 'Platform stats retrieved', data: stats });
  } catch (err) { next(err); }
};

export const getActivityReport = async (req, res, next) => {
  try {
    const report = await adminService.getActivityReport();
    return sendSuccess(res, { message: 'Activity report retrieved', data: report });
  } catch (err) { next(err); }
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const getAllUsers = async (req, res, next) => {
  try {
    const result = await adminService.getAllUsers(req.validatedQuery);
    return sendSuccess(res, { message: 'Users retrieved', data: result });
  } catch (err) { next(err); }
};

export const getUserDetails = async (req, res, next) => {
  try {
    const user = await adminService.getUserDetails(req.params.id);
    return sendSuccess(res, { message: 'User details retrieved', data: user });
  } catch (err) { next(err); }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const user = await adminService.updateUserRole(
      req.params.id,
      req.validatedBody.role,
      req.user.id
    );
    return sendSuccess(res, { message: 'User role updated', data: user });
  } catch (err) { next(err); }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const user = await adminService.deactivateUser(req.params.id, req.user.id);
    return sendSuccess(res, { message: 'User deactivated', data: user });
  } catch (err) { next(err); }
};

export const activateUser = async (req, res, next) => {
  try {
    const user = await adminService.activateUser(req.params.id);
    return sendSuccess(res, { message: 'User activated', data: user });
  } catch (err) { next(err); }
};

// ── Resources ─────────────────────────────────────────────────────────────────
export const getAllResources = async (req, res, next) => {
  try {
    const result = await adminService.getAllResources(req.validatedQuery);
    return sendSuccess(res, { message: 'Resources retrieved', data: result });
  } catch (err) { next(err); }
};

export const toggleResourceAvailability = async (req, res, next) => {
  try {
    const resource = await adminService.toggleResourceAvailability(req.params.id);
    return sendSuccess(res, {
      message: `Resource ${resource.isAvailable ? 'enabled' : 'disabled'}`,
      data:    resource,
    });
  } catch (err) { next(err); }
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const getAllBookings = async (req, res, next) => {
  try {
    const result = await adminService.getAllBookings(req.validatedQuery);
    return sendSuccess(res, { message: 'Bookings retrieved', data: result });
  } catch (err) { next(err); }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await adminService.updateBookingStatus(
      req.params.id,
      req.validatedBody
    );
    return sendSuccess(res, { message: 'Booking status updated', data: booking });
  } catch (err) { next(err); }
};