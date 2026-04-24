import * as userRepository from './user.repository.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.util.js';

/**
 * User Service — business logic layer.
 *
 * Spring Boot equivalent: @Service UserService
 *
 * This layer:
 * - Calls the repository
 * - Applies business rules
 * - Throws meaningful errors
 * - Never touches req/res (that's the controller's job)
 */

/**
 * Get the full profile of the currently logged-in user.
 */
export const getMyProfile = async (userId) => {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
};

/**
 * Get a public profile by user ID.
 * Any authenticated user can view another user's public profile.
 */
export const getPublicProfile = async (userId) => {
  const profile = await userRepository.findPublicProfile(userId);

  if (!profile) {
    throw new NotFoundError('Profile not found');
  }

  return profile;
};

/**
 * Update the currently logged-in user's profile.
 *
 * Business rule: users can only update their own profile.
 * Admins can update anyone's (handled at route level via authorize()).
 */
export const updateMyProfile = async (userId, data) => {
  // Make sure user exists first
  const user = await userRepository.findUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updatedProfile = await userRepository.updateProfile(userId, data);
  return updatedProfile;
};

/**
 * Get all users — admin only.
 * Parses and validates query params before passing to repository.
 */
export const getAllUsers = async (query) => {
  const page  = parseInt(query.page)  || 1;
  const limit = parseInt(query.limit) || 20;

  // Convert string "true"/"false" from query params to boolean
  let isActive;
  if (query.isActive === 'true')  isActive = true;
  if (query.isActive === 'false') isActive = false;

  return userRepository.findAllUsers({
    page,
    limit,
    role: query.role,      // e.g. ?role=STUDENT
    isActive,              // e.g. ?isActive=true
  });
};

/**
 * Deactivate a user — admin only.
 *
 * Business rule: an admin cannot deactivate themselves.
 */
export const deactivateUser = async (targetUserId, requestingUserId) => {
  if (targetUserId === requestingUserId) {
    throw new ForbiddenError('You cannot deactivate your own account');
  }

  const user = await userRepository.findUserById(targetUserId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.isActive) {
    throw new ForbiddenError('User is already inactive');
  }

  return userRepository.deactivateUser(targetUserId);
};

/**
 * Reactivate a user — admin only.
 */
export const reactivateUser = async (targetUserId) => {
  const user = await userRepository.findUserById(targetUserId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.isActive) {
    throw new ForbiddenError('User is already active');
  }

  return userRepository.reactivateUser(targetUserId);
};