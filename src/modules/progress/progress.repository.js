import prisma from '../../database/prisma.client.js';

// ── Shared select shape ────────────────────────────────────────────────────────
const progressSelect = {
  id:              true,
  status:          true,
  percentage:      true,
  timeSpentMins:   true,
  sessionCount:    true,
  notes:           true,
  personalRating:  true,
  isExternal:      true,
  externalUrl:     true,
  externalPlatform: true,
  startedAt:       true,
  lastAccessedAt:  true,
  completedAt:     true,
  createdAt:       true,
  updatedAt:       true,
  resource: {
    select: {
      id:             true,
      title:          true,
      type:           true,
      difficultyLevel: true,
      thumbnailUrl:   true,
      duration:       true,
      externalUrl:    true,
      tags:           true,
      instructor: {
        select: {
          profile: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  },
};

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export const findProgressByUserAndResource = async (userId, resourceId) => {
  return prisma.progress.findUnique({
    where:  { userId_resourceId: { userId, resourceId } },
    select: progressSelect,
  });
};

export const findMyProgress = async (userId, filters) => {
  const { status, page, limit, sortBy, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where = { userId };
  if (status) where.status = status;

  const [progress, total] = await prisma.$transaction([
    prisma.progress.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { [sortBy]: sortOrder },
      select:  progressSelect,
    }),
    prisma.progress.count({ where }),
  ]);

  return {
    progress,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext:    page < Math.ceil(total / limit),
      hasPrev:    page > 1,
    },
  };
};

/**
 * Get learning stats for dashboard.
 * Aggregates progress data into meaningful metrics.
 */
export const findLearningStats = async (userId) => {
  // Run all stat queries in parallel
  const [
    totalResources,
    completed,
    inProgress,
    dropped,
    timeStats,
    recentActivity,
    byType,
  ] = await Promise.all([

    // Total resources being tracked
    prisma.progress.count({ where: { userId } }),

    // Completed count
    prisma.progress.count({ where: { userId, status: 'COMPLETED' } }),

    // In progress count
    prisma.progress.count({ where: { userId, status: 'IN_PROGRESS' } }),

    // Dropped count
    prisma.progress.count({ where: { userId, status: 'DROPPED' } }),

    // Total time spent + average percentage
    prisma.progress.aggregate({
      where:  { userId },
      _sum:   { timeSpentMins: true },
      _avg:   { percentage: true },
      _count: { id: true },
    }),

    // Last 5 accessed resources
    prisma.progress.findMany({
      where:   { userId, status: { not: 'NOT_STARTED' } },
      orderBy: { lastAccessedAt: 'desc' },
      take:    5,
      select: {
        status:        true,
        percentage:    true,
        lastAccessedAt: true,
        resource: {
          select: {
            id:          true,
            title:       true,
            type:        true,
            thumbnailUrl: true,
          },
        },
      },
    }),

    // Progress grouped by resource type
    prisma.progress.groupBy({
      by:    ['status'],
      where: { userId },
      _count: { id: true },
    }),

  ]);

  return {
    overview: {
      totalTracked:      totalResources,
      completed,
      inProgress,
      dropped,
      notStarted:        totalResources - completed - inProgress - dropped,
      completionRate:    totalResources > 0
        ? Math.round((completed / totalResources) * 100)
        : 0,
    },
    time: {
      totalMinutes:      timeStats._sum.timeSpentMins ?? 0,
      totalHours:        Math.round((timeStats._sum.timeSpentMins ?? 0) / 60 * 10) / 10,
      averagePercentage: Math.round(timeStats._avg.percentage ?? 0),
    },
    recentActivity,
    statusBreakdown: byType,
  };
};

// ─────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────

export const createProgress = async (data) => {
  return prisma.progress.create({
    data,
    select: progressSelect,
  });
};

export const updateProgress = async (userId, resourceId, data) => {
  return prisma.progress.update({
    where:  { userId_resourceId: { userId, resourceId } },
    data,
    select: progressSelect,
  });
};

export const deleteProgress = async (userId, resourceId) => {
  return prisma.progress.delete({
    where: { userId_resourceId: { userId, resourceId } },
  });
};