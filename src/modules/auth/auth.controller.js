import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/response.util.js';

/**
 * Auth Controller — handles HTTP layer only.
 * No business logic here. Just: parse request → call service → send response.
 * 
 * Spring Boot equivalent: @RestController AuthController
 */

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    // req.validatedBody is set by our validate() middleware
    const result = await authService.register(req.validatedBody);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Account created successfully',
      data: result,
    });
  } catch (err) {
    next(err); // Always pass errors to next() — never throw in controllers
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.validatedBody);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Login successful',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 */
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.validatedBody;
    const tokens = await authService.refreshAccessToken(refreshToken);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Token refreshed',
      data: tokens,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Requires authentication (user must be logged in to log out)
 */
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout-all
 * Logs out from all devices by revoking all refresh tokens
 */
export const logoutAll = async (req, res, next) => {
  try {
    // req.user is set by authenticate middleware
    await authService.logoutAll(req.user.id);
    return sendSuccess(res, { message: 'Logged out from all devices' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Returns currently authenticated user
 */
export const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      message: 'User retrieved',
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
};