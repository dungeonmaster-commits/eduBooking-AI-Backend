import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../database/prisma.client.js';
import config from '../../config/app.config.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../utils/errors.util.js';

/**
 * Auth Service — contains all authentication business logic.
 * 
 * Spring Boot equivalent: @Service AuthService
 * Key difference: No @Autowired DI here. We import prisma directly.
 * In large projects, you'd inject dependencies via constructor parameters.
 */

// ─────────────────────────────────────────────
// TOKEN HELPERS
// ─────────────────────────────────────────────

/**
 * Generates a short-lived access token (JWT).
 * Payload contains userId and role — kept minimal for security.
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { sub: userId, role },          // payload (sub = subject, standard JWT claim)
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Generates a long-lived refresh token (opaque UUID, stored in DB).
 * We don't use JWT for refresh tokens — revocation is simpler with DB storage.
 */
const generateRefreshToken = () => uuidv4();

/**
 * Saves refresh token to DB with expiry date.
 */
const saveRefreshToken = async (userId, token) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

  return prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });
};

// ─────────────────────────────────────────────
// AUTH OPERATIONS
// ─────────────────────────────────────────────

/**
 * Registers a new user.
 * 
 * Flow:
 * 1. Check if email already exists
 * 2. Hash password with bcrypt
 * 3. Create user + profile in a transaction
 * 4. Generate tokens
 * 5. Return user data + tokens
 */
export const register = async ({ email, password, firstName, lastName, role }) => {
  // 1. Check for existing user
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ConflictError('An account with this email already exists');
  }

  // 2. Hash password
  // bcrypt cost factor: higher = more secure but slower
  // 12 rounds ≈ ~300ms — good balance for production
  const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);

  // 3. Create user + profile in a single transaction
  // Prisma transactions: if any operation fails, all are rolled back
  // Spring Boot equivalent: @Transactional
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        role,
        profile: {
          create: {        // creates Profile record simultaneously
            firstName,
            lastName,
          },
        },
      },
      include: {
        profile: true,   // join the profile in the response
      },
    });
    return newUser;
  });

  // 4. Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken();
  await saveRefreshToken(user.id, refreshToken);

  // 5. Return (never return passwordHash)
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
      },
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

/**
 * Authenticates a user and returns tokens.
 * 
 * Security: We use the same error message for "user not found" and "wrong password"
 * to prevent user enumeration attacks.
 */
export const login = async ({ email, password }) => {
  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // 2. Compare password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // 3. Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken();
  await saveRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
      },
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

/**
 * Issues new access token using a valid refresh token.
 * 
 * This is the "silent refresh" flow — users stay logged in without
 * re-entering credentials.
 */
export const refreshAccessToken = async (token) => {
  // 1. Find token in DB
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!storedToken) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // 2. Check if revoked or expired
  if (storedToken.isRevoked || new Date() > storedToken.expiresAt) {
    throw new UnauthorizedError('Refresh token has expired or been revoked');
  }

  // 3. Check user is still active
  if (!storedToken.user.isActive) {
    throw new UnauthorizedError('Account is inactive');
  }

  // 4. Rotate refresh token (security best practice — one-time use)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { isRevoked: true },
  });

  const newRefreshToken = generateRefreshToken();
  await saveRefreshToken(storedToken.userId, newRefreshToken);
  const newAccessToken = generateAccessToken(storedToken.userId, storedToken.user.role);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Revokes a refresh token (logout).
 */
export const logout = async (token) => {
  const storedToken = await prisma.refreshToken.findUnique({ where: { token } });

  if (!storedToken) {
    throw new NotFoundError('Token not found');
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { isRevoked: true },
  });

  return { message: 'Logged out successfully' };
};

/**
 * Revokes all refresh tokens for a user (logout from all devices).
 */
export const logoutAll = async (userId) => {
  await prisma.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });

  return { message: 'Logged out from all devices' };
};