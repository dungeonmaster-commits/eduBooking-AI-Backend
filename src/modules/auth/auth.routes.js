import { Router } from 'express';
import * as authController from './auth.controller.js';
import validate from '../../middlewares/validate.middleware.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation.js';

/**
 * Express Router — equivalent to Spring Boot's @RequestMapping on a controller.
 * 
 * The base path (/api/auth) is set when this router is mounted in app.js.
 */
const router = Router();

// Public routes — no authentication required
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);

// Protected routes — must be authenticated
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.getMe);

export default router;