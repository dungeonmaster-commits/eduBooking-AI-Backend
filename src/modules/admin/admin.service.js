import * as adminRepository from './admin.repository.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../../utils/errors.util.js';

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getPlatformStats = async () => {
  return adminRepository.getPlatformStats();
};

export const getActivityReport = async () => {
  return adminRepository.getActivityReport();
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const getAllUsers = async (filters) => {
  return adminRepository.findAllUsersAdmin(filters);
};

export const getUserDetails = async (userId) => {
  const user = await adminRepository.findUserDetailsAdmin(userId);
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const updateUserRole = async (targetUserId, role, requestingUserId) => {
  // Admin cannot change their own role
  if (targetUserId === requestingUserId) {
    throw new ForbiddenError('You cannot change your own role');
  }

  const user = await adminRepository.findUserDetailsAdmin(targetUserId);
  if (!user) throw new NotFoundError('User not found');

  return adminRepository.updateUserRole(targetUserId, role);
};

export const deactivateUser = async (targetUserId, requestingUserId) => {
  if (targetUserId === requestingUserId) {
    throw new ForbiddenError('You cannot deactivate your own account');
  }

  const user = await adminRepository.findUserDetailsAdmin(targetUserId);
  if (!user) throw new NotFoundError('User not found');

  if (!user.isActive) {
    throw new ValidationError('User is already inactive');
  }

  return adminRepository.setUserActiveStatus(targetUserId, false);
};

export const activateUser = async (targetUserId) => {
  const user = await adminRepository.findUserDetailsAdmin(targetUserId);
  if (!user) throw new NotFoundError('User not found');

  if (user.isActive) {
    throw new ValidationError('User is already active');
  }

  return adminRepository.setUserActiveStatus(targetUserId, true);
};

// ── Resources ─────────────────────────────────────────────────────────────────
export const getAllResources = async (filters) => {
  return adminRepository.findAllResourcesAdmin(filters);
};

export const toggleResourceAvailability = async (resourceId) => {
  return adminRepository.toggleResourceAvailability(resourceId);
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const getAllBookings = async (filters) => {
  return adminRepository.findAllBookingsAdmin(filters);
};

export const updateBookingStatus = async (bookingId, data) => {
  const updateData = { status: data.status };

  if (data.status === 'CANCELLED') {
    updateData.cancelledAt        = new Date();
    updateData.cancellationReason = data.reason ?? null;
  }
  if (data.status === 'CONFIRMED') {
    updateData.confirmedAt = new Date();
  }
  if (data.status === 'COMPLETED') {
    updateData.completedAt = new Date();
  }

  return adminRepository.updateBookingStatusAdmin(bookingId, updateData);
};