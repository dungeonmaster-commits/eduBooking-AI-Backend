import jwt from 'jsonwebtoken';
import prisma from '../database/prisma.client.js';
import config from '../config/app.config.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.util.js';

/**
 * authenticate — verifies JWT access token.
 * 
 * Spring Boot equivalent: JwtAuthenticationFilter
 * 
 * Reads token from: Authorization: Bearer <token>
 * Attaches decoded user to req.user for downstream use.
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token has expired');
      }
      throw new UnauthorizedError('Invalid access token');
    }

    // 3. Check user still exists and is active
    // Note: This DB call adds latency. For high-traffic APIs, you can skip
    // this and rely only on JWT expiry + short token lifetimes.
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account not found or inactive');
    }

    // 4. Attach user to request object
    // Spring Boot: SecurityContextHolder.getContext().getAuthentication()
    // Node.js: req.user — accessible in all downstream handlers
    req.user = user;
    next();

  } catch (err) {
    next(err); // Pass to global error handler
  }
};

/**
 * authorize — role-based access control (RBAC).
 * 
 * Usage: router.get('/admin/users', authenticate, authorize('ADMIN'), handler)
 * 
 * Spring Boot equivalent: @PreAuthorize("hasRole('ADMIN')")
 * 
 * @param {...string} roles — allowed roles (e.g., 'ADMIN', 'INSTRUCTOR')
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required'));
  }

  if (!roles.includes(req.user.role)) {
    return next(new ForbiddenError(
      `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
    ));
  }

  next();
};