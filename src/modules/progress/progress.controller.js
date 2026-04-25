import * as progressService from './progress.service.js';
import { sendSuccess }      from '../../utils/response.util.js';

export const startTracking = async (req, res, next) => {
  try {
    const progress = await progressService.startTracking(
      req.user.id,
      req.validatedBody
    );
    return sendSuccess(res, {
      statusCode: 201,
      message:    'Started tracking resource',
      data:       progress,
    });
  } catch (err) { next(err); }
};

export const getMyProgress = async (req, res, next) => {
  try {
    const result = await progressService.getMyProgress(
      req.user.id,
      req.validatedQuery
    );
    return sendSuccess(res, {
      message: 'Progress retrieved successfully',
      data:    result,
    });
  } catch (err) { next(err); }
};

export const getLearningStats = async (req, res, next) => {
  try {
    const stats = await progressService.getLearningStats(req.user.id);
    return sendSuccess(res, {
      message: 'Learning stats retrieved',
      data:    stats,
    });
  } catch (err) { next(err); }
};

export const getProgressForResource = async (req, res, next) => {
  try {
    const progress = await progressService.getProgressForResource(
      req.user.id,
      req.params.resourceId
    );
    return sendSuccess(res, {
      message: 'Progress retrieved',
      data:    progress,
    });
  } catch (err) { next(err); }
};

export const updateProgress = async (req, res, next) => {
  try {
    const progress = await progressService.updateProgress(
      req.user.id,
      req.params.resourceId,
      req.validatedBody
    );
    return sendSuccess(res, {
      message: 'Progress updated successfully',
      data:    progress,
    });
  } catch (err) { next(err); }
};

export const markAsCompleted = async (req, res, next) => {
  try {
    const progress = await progressService.markAsCompleted(
      req.user.id,
      req.params.resourceId
    );
    return sendSuccess(res, {
      message: 'Resource marked as completed! 🎉',
      data:    progress,
    });
  } catch (err) { next(err); }
};

export const stopTracking = async (req, res, next) => {
  try {
    const result = await progressService.stopTracking(
      req.user.id,
      req.params.resourceId
    );
    return sendSuccess(res, {
      message: result.message,
    });
  } catch (err) { next(err); }
};

export const getStudentProgress = async (req, res, next) => {
  try {
    const result = await progressService.getStudentProgress(
      req.params.userId,
      req.validatedQuery,
      req.user
    );
    return sendSuccess(res, {
      message: 'Student progress retrieved',
      data:    result,
    });
  } catch (err) { next(err); }
};