import * as userService from './user.service.js';
import { sendSuccess } from '../../utils/response.util.js';

/**
 * User Controller — HTTP layer only.
 *
 * Responsibilities:
 * 1. Read from req (params, query, body, user)
 * 2. Call service
 * 3. Send response
 *
 * Nothing else. No business logic here.
 */

/**
 * GET /api/v1/users/profile
 * Returns the logged-in user's full profile.
 */
export const getMyProfile = async (req, res, next) => {
  try {
    // req.user is set by authenticate() middleware
    const profile = await userService.getMyProfile(req.user.id);
    return sendSuccess(res, {
      message: 'Profile retrieved successfully',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/users/profile
 * Updates the logged-in user's profile.
 */
export const updateMyProfile = async (req, res, next) => {
  try {
    // req.validatedBody is set by validate() middleware
    const updated = await userService.updateMyProfile(req.user.id, req.validatedBody);
    return sendSuccess(res, {
      message: 'Profile updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users/:id/profile
 * Returns any user's public profile.
 */
export const getPublicProfile = async (req, res, next) => {
  try {
    const profile = await userService.getPublicProfile(req.params.id);
    return sendSuccess(res, {
      message: 'Public profile retrieved',
      data: profile,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users
 * Admin only — get all users with pagination.
 */
export const getAllUsers = async (req, res, next) => {
  try {
    // req.query contains URL query params e.g. ?page=1&limit=10&role=STUDENT
    const result = await userService.getAllUsers(req.query);
    return sendSuccess(res, {
      message: 'Users retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/users/:id
 * Admin only — deactivate a user account.
 */
export const deactivateUser = async (req, res, next) => {
  try {
    const result = await userService.deactivateUser(req.params.id, req.user.id);
    return sendSuccess(res, {
      message: 'User deactivated successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/users/:id/reactivate
 * Admin only — reactivate a user account.
 */
export const reactivateUser = async (req, res, next) => {
  try {
    const result = await userService.reactivateUser(req.params.id);
    return sendSuccess(res, {
      message: 'User reactivated successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};