import * as progressRepository from './progress.repository.js';
import * as resourceRepository from '../resources/resource.repository.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../../utils/errors.util.js';

// ─────────────────────────────────────────────
// START TRACKING
// ─────────────────────────────────────────────

export const startTracking = async (userId, data) => {
  const { resourceId, isExternal, externalUrl, externalPlatform } = data;

  // 1. Check resource exists
  const resource = await resourceRepository.findResourceById(resourceId);
  if (!resource) throw new NotFoundError('Resource not found');

  // 2. Check not already tracking
  const existing = await progressRepository.findProgressByUserAndResource(
    userId, resourceId
  );
  if (existing) {
    throw new ConflictError('You are already tracking this resource');
  }

  // 3. Create progress record
  return progressRepository.createProgress({
    userId,
    resourceId,
    status:          'NOT_STARTED',
    percentage:      0,
    isExternal:      isExternal ?? resource.isExternal,
    externalUrl:     externalUrl ?? resource.externalUrl,
    externalPlatform: externalPlatform ?? resource.externalPlatform,
  });
};

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export const getMyProgress = async (userId, filters) => {
  return progressRepository.findMyProgress(userId, filters);
};

export const getProgressForResource = async (userId, resourceId) => {
  const progress = await progressRepository.findProgressByUserAndResource(
    userId, resourceId
  );
  if (!progress) throw new NotFoundError('Progress record not found');
  return progress;
};

export const getLearningStats = async (userId) => {
  return progressRepository.findLearningStats(userId);
};

// Admin — view any student's progress
export const getStudentProgress = async (targetUserId, filters, requestingUser) => {
  if (requestingUser.role === 'STUDENT') {
    throw new ForbiddenError('Access denied');
  }
  return progressRepository.findMyProgress(targetUserId, filters);
};

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export const updateProgress = async (userId, resourceId, data) => {
  // Check exists
  const existing = await progressRepository.findProgressByUserAndResource(
    userId, resourceId
  );
  if (!existing) throw new NotFoundError('Progress record not found');

  // Cannot update a dropped or completed resource
  // unless explicitly setting a new status
  if (existing.status === 'DROPPED' && !data.status) {
    throw new ValidationError(
      'This resource was dropped. Update the status first to continue tracking.'
    );
  }

  // Build update data
  const updateData = { ...data };

  // Auto-set startedAt when first update happens
  if (existing.status === 'NOT_STARTED') {
    updateData.status    = 'IN_PROGRESS';
    updateData.startedAt = new Date();
  }

  // Auto-increment session count on every update
  updateData.sessionCount   = { increment: 1 };
  updateData.lastAccessedAt = new Date();

  // Auto-complete if percentage reaches 100
  if (data.percentage === 100) {
    updateData.status      = 'COMPLETED';
    updateData.completedAt = new Date();
  }

  return progressRepository.updateProgress(userId, resourceId, updateData);
};

export const markAsCompleted = async (userId, resourceId) => {
  const existing = await progressRepository.findProgressByUserAndResource(
    userId, resourceId
  );
  if (!existing) throw new NotFoundError('Progress record not found');

  if (existing.status === 'COMPLETED') {
    throw new ValidationError('Resource is already marked as completed');
  }

  return progressRepository.updateProgress(userId, resourceId, {
    status:        'COMPLETED',
    percentage:    100,
    completedAt:   new Date(),
    lastAccessedAt: new Date(),
  });
};

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export const stopTracking = async (userId, resourceId) => {
  const existing = await progressRepository.findProgressByUserAndResource(
    userId, resourceId
  );
  if (!existing) throw new NotFoundError('Progress record not found');

  await progressRepository.deleteProgress(userId, resourceId);
  return { message: 'Resource removed from tracking' };
};