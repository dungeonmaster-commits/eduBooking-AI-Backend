import { Router }          from 'express';
import * as adminController from './admin.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate            from '../../middlewares/validate.middleware.js';
import {
  updateRoleSchema,
  updateBookingStatusSchema,
  adminUserFilterSchema,
  adminBookingFilterSchema,
  adminResourceFilterSchema,
} from './admin.validation.js';

const router = Router();

// ALL admin routes require authentication + ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/stats',             adminController.getPlatformStats);
router.get('/reports/activity',  adminController.getActivityReport);

// ── User Management ───────────────────────────────────────────────────────────
router.get('/users',
  validate(adminUserFilterSchema, 'query'),
  adminController.getAllUsers
);
router.get('/users/:id',         adminController.getUserDetails);
router.patch('/users/:id/role',
  validate(updateRoleSchema),
  adminController.updateUserRole
);
router.patch('/users/:id/deactivate', adminController.deactivateUser);
router.patch('/users/:id/activate',   adminController.activateUser);

// ── Resource Management ───────────────────────────────────────────────────────
router.get('/resources',
  validate(adminResourceFilterSchema, 'query'),
  adminController.getAllResources
);
router.patch('/resources/:id/toggle', adminController.toggleResourceAvailability);

// ── Booking Management ────────────────────────────────────────────────────────
router.get('/bookings',
  validate(adminBookingFilterSchema, 'query'),
  adminController.getAllBookings
);
router.patch('/bookings/:id/status',
  validate(updateBookingStatusSchema),
  adminController.updateBookingStatus
);

export default router;