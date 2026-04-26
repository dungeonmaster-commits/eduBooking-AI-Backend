import prisma from '../../database/prisma.client.js';

// ─────────────────────────────────────────────
// PLATFORM STATS
// ─────────────────────────────────────────────

/**
 * Fetches all platform statistics in parallel.
 * This powers the admin dashboard overview.
 */
export const getPlatformStats = async () => {
  const [
    // User stats
    totalUsers,
    activeUsers,
    usersByRole,
    newUsersThisMonth,

    // Resource stats
    totalResources,
    availableResources,
    resourcesByType,

    // Booking stats
    totalBookings,
    bookingsByStatus,
    newBookingsThisMonth,

    // Community stats
    totalPosts,
    totalComments,

    // Progress stats
    totalProgressRecords,
    completedCourses,

  ] = await Promise.all([

    // ── Users ──────────────────────────────────
    prisma.user.count(),

    prisma.user.count({ where: { isActive: true } }),

    prisma.user.groupBy({
      by:     ['role'],
      _count: { id: true },
    }),

    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(1)), // first day of current month
        },
      },
    }),

    // ── Resources ──────────────────────────────
    prisma.resource.count(),

    prisma.resource.count({ where: { isAvailable: true } }),

    prisma.resource.groupBy({
      by:     ['type'],
      _count: { id: true },
    }),

    // ── Bookings ───────────────────────────────
    prisma.booking.count(),

    prisma.booking.groupBy({
      by:     ['status'],
      _count: { id: true },
    }),

    prisma.booking.count({
      where: {
        createdAt: { gte: new Date(new Date().setDate(1)) },
      },
    }),

    // ── Community ──────────────────────────────
    prisma.post.count(),
    prisma.comment.count(),

    // ── Progress ───────────────────────────────
    prisma.progress.count(),

    prisma.progress.count({ where: { status: 'COMPLETED' } }),

  ]);

  return {
    users: {
      total:          totalUsers,
      active:         activeUsers,
      inactive:       totalUsers - activeUsers,
      newThisMonth:   newUsersThisMonth,
      byRole:         usersByRole.reduce((acc, r) => {
        acc[r.role] = r._count.id;
        return acc;
      }, {}),
    },
    resources: {
      total:      totalResources,
      available:  availableResources,
      unavailable: totalResources - availableResources,
      byType:     resourcesByType.reduce((acc, r) => {
        acc[r.type] = r._count.id;
        return acc;
      }, {}),
    },
    bookings: {
      total:        totalBookings,
      newThisMonth: newBookingsThisMonth,
      byStatus:     bookingsByStatus.reduce((acc, b) => {
        acc[b.status] = b._count.id;
        return acc;
      }, {}),
    },
    community: {
      totalPosts,
      totalComments,
    },
    progress: {
      totalTracking: totalProgressRecords,
      completed:     completedCourses,
      completionRate: totalProgressRecords > 0
        ? Math.round((completedCourses / totalProgressRecords) * 100)
        : 0,
    },
  };
};

// ─────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────

export const findAllUsersAdmin = async (filters) => {
  const { role, isActive, search, page, limit, sortBy, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  // Search by name or email
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      {
        profile: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName:  { contains: search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id:         true,
        email:      true,
        role:       true,
        isActive:   true,
        isVerified: true,
        createdAt:  true,
        profile: {
          select: {
            firstName:  true,
            lastName:   true,
            avatarUrl:  true,
            branch:     true,
            university: true,
          },
        },
        _count: {
          select: {
            bookings:  true,
            posts:     true,
            progress:  true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
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

export const findUserDetailsAdmin = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:         true,
      email:      true,
      role:       true,
      isActive:   true,
      isVerified: true,
      createdAt:  true,
      updatedAt:  true,
      profile:    true,
      _count: {
        select: {
          bookings:  true,
          posts:     true,
          comments:  true,
          progress:  true,
        },
      },
      bookings: {
        take:    5,
        orderBy: { createdAt: 'desc' },
        select: {
          id:        true,
          status:    true,
          createdAt: true,
          resource: {
            select: { title: true, type: true },
          },
        },
      },
      progress: {
        take:    5,
        orderBy: { lastAccessedAt: 'desc' },
        select: {
          status:     true,
          percentage: true,
          resource: {
            select: { title: true, type: true },
          },
        },
      },
    },
  });
};

export const updateUserRole = async (userId, role) => {
  return prisma.user.update({
    where: { id: userId },
    data:  { role },
    select: { id: true, email: true, role: true },
  });
};

export const setUserActiveStatus = async (userId, isActive) => {
  return prisma.user.update({
    where: { id: userId },
    data:  { isActive },
    select: { id: true, email: true, isActive: true },
  });
};

// ─────────────────────────────────────────────
// RESOURCE MANAGEMENT
// ─────────────────────────────────────────────

export const findAllResourcesAdmin = async (filters) => {
  const { type, isAvailable, isExternal, search, page, limit, sortBy, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (type)        where.type        = type;
  if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
  if (isExternal  !== undefined) where.isExternal  = isExternal  === 'true';

  if (search) {
    where.OR = [
      { title:       { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [resources, total] = await prisma.$transaction([
    prisma.resource.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        instructor: {
          select: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        _count: {
          select: { bookings: true, progress: true },
        },
      },
    }),
    prisma.resource.count({ where }),
  ]);

  return {
    resources,
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

export const toggleResourceAvailability = async (resourceId) => {
  const resource = await prisma.resource.findUnique({
    where:  { id: resourceId },
    select: { isAvailable: true },
  });

  return prisma.resource.update({
    where: { id: resourceId },
    data:  { isAvailable: !resource.isAvailable },
    select: { id: true, title: true, isAvailable: true },
  });
};

// ─────────────────────────────────────────────
// BOOKING MANAGEMENT
// ─────────────────────────────────────────────

export const findAllBookingsAdmin = async (filters) => {
  const { status, userId, resourceId, page, limit, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (status)     where.status     = status;
  if (userId)     where.userId     = userId;
  if (resourceId) where.resourceId = resourceId;

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: sortOrder },
      include: {
        user: {
          select: {
            id:    true,
            email: true,
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        resource: {
          select: {
            id:       true,
            title:    true,
            type:     true,
            location: true,
          },
        },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
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

export const updateBookingStatusAdmin = async (bookingId, data) => {
  return prisma.booking.update({
    where: { id: bookingId },
    data,
    select: {
      id:     true,
      status: true,
      user: {
        select: {
          email:   true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
      resource: { select: { title: true } },
    },
  });
};

// ─────────────────────────────────────────────
// ACTIVITY REPORT
// ─────────────────────────────────────────────

export const getActivityReport = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    recentUsers,
    recentBookings,
    recentPosts,
    topResources,
    mostActiveUsers,
  ] = await Promise.all([

    // New users in last 30 days
    prisma.user.findMany({
      where:   { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take:    10,
      select: {
        id:        true,
        email:     true,
        role:      true,
        createdAt: true,
        profile: {
          select: { firstName: true, lastName: true },
        },
      },
    }),

    // Recent bookings
    prisma.booking.findMany({
      where:   { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take:    10,
      select: {
        id:        true,
        status:    true,
        createdAt: true,
        user: {
          select: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        resource: { select: { title: true, type: true } },
      },
    }),

    // Recent posts
    prisma.post.findMany({
      where:   { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take:    10,
      select: {
        id:            true,
        title:         true,
        likesCount:    true,
        commentsCount: true,
        createdAt:     true,
        user: {
          select: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),

    // Most booked/enrolled resources
    prisma.resource.findMany({
      orderBy: { enrolledCount: 'desc' },
      take:    5,
      select: {
        id:            true,
        title:         true,
        type:          true,
        enrolledCount: true,
        rating:        true,
        _count: {
          select: { bookings: true },
        },
      },
    }),

    // Most active users (by booking + post count)
    prisma.user.findMany({
      where: { isActive: true },
      take:  10,
      select: {
        id:      true,
        email:   true,
        profile: { select: { firstName: true, lastName: true } },
        _count: {
          select: {
            bookings: true,
            posts:    true,
            progress: true,
          },
        },
      },
      orderBy: { bookings: { _count: 'desc' } },
    }),

  ]);

  return {
    recentUsers,
    recentBookings,
    recentPosts,
    topResources,
    mostActiveUsers,
  };
};