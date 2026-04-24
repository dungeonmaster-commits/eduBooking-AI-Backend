import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import { updateProfileSchema } from './user.validation.js';

const router = Router();

/**
 * All user routes require authentication.
 * We apply authenticate() globally to this router.
 *
 * Spring Boot equivalent: .antMatchers("/api/v1/users/**").authenticated()
 */
router.use(authenticate);

// ─── Student/Instructor Routes ────────────────────────────────────────────────

// My own profile
router.get('/profile', userController.getMyProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateMyProfile);

// Anyone's public profile
router.get('/:id/profile', userController.getPublicProfile);

// ─── Admin Only Routes ────────────────────────────────────────────────────────

router.get(
  '/',
  authorize('ADMIN'),               // only ADMINs can list all users
  userController.getAllUsers
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  userController.deactivateUser
);

router.patch(
  '/:id/reactivate',
  authorize('ADMIN'),
  userController.reactivateUser
);

export default router;