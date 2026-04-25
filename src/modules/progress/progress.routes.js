import { Router }              from 'express';
import * as progressController from './progress.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate                from '../../middlewares/validate.middleware.js';
import {
  startProgressSchema,
  updateProgressSchema,
  progressFilterSchema,
} from './progress.validation.js';

const router = Router();

router.use(authenticate);

// ── Static routes first ───────────────────────────────────────────────────────

// Learning dashboard stats
router.get('/stats',
  progressController.getLearningStats
);

// Admin — view any student's progress
router.get('/admin/:userId',
  authorize('ADMIN', 'INSTRUCTOR'),
  validate(progressFilterSchema, 'query'),
  progressController.getStudentProgress
);

// ── Student routes ────────────────────────────────────────────────────────────

// Get all my progress (full learning dashboard)
router.get('/',
  validate(progressFilterSchema, 'query'),
  progressController.getMyProgress
);

// Start tracking a resource
router.post('/',
  validate(startProgressSchema),
  progressController.startTracking
);

// ── Dynamic :resourceId routes ────────────────────────────────────────────────

// Get progress for one specific resource
router.get('/:resourceId',
  progressController.getProgressForResource
);

// Update progress (percentage, time spent, notes)
router.patch('/:resourceId',
  validate(updateProgressSchema),
  progressController.updateProgress
);

// Mark as completed
router.patch('/:resourceId/complete',
  progressController.markAsCompleted
);

// Stop tracking
router.delete('/:resourceId',
  progressController.stopTracking
);

export default router;