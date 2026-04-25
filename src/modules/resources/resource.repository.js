import prisma from '../../database/prisma.client.js';

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export const findResourceById = async (id) => {
  return prisma.resource.findUnique({
    where: { id },
    include: {
      instructor: {
        select: {
          id:      true,
          email:   true,
          profile: {
            select: { firstName: true, lastName: true, avatarUrl: true },
          },
        },
      },
      ratings: {
        take:    5,              // latest 5 ratings
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              profile: {
                select: { firstName: true, lastName: true, avatarUrl: true },
              },
            },
          },
        },
      },
      _count: {
        select: { bookings: true, progress: true },
      },
    },
  });
};

export const findAllResources = async (filters) => {
  console.log('filters received in repo:', filters);
  const {
    type, difficultyLevel, branch, semester,
    minPrice, maxPrice, isExternal, platform,
    search, tags, page, limit, sortBy, sortOrder,
  } = filters;

  const skip = (page - 1) * limit;

  // Build dynamic where clause
  // Think of this like building a JPA Specification dynamically
  const where = { isAvailable: true };

  if (type)            where.type            = type;
  if (difficultyLevel) where.difficultyLevel = difficultyLevel;
  if (platform)        where.externalPlatform = platform;

  if (isExternal !== undefined) {
    where.isExternal = isExternal === 'true';
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  // Branch filter — check if array contains the value
  if (branch) {
    where.branch = { has: branch };
  }

  // Semester filter
  if (semester) {
    where.semester = { has: semester };
  }

  // Tags filter
  if (tags) {
    where.tags = { hasSome: tags.split(',').map((t) => t.trim()) };
  }

  // Full-text search on title and description
  if (search) {
    where.OR = [
      { title:       { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { tags:        { hasSome:  [search] } },
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
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { bookings: true },
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

export const findResourcesByType = async () => {
  // Returns count of resources per type — for dashboard stats
  return prisma.resource.groupBy({
    by:      ['type'],
    _count:  { id: true },
    where:   { isAvailable: true },
  });
};

// ─────────────────────────────────────────────
// WRITE
// ─────────────────────────────────────────────

export const createResource = async (data) => {
  return prisma.resource.create({
    data,
    include: { instructor: { select: { profile: true } } },
  });
};

export const updateResource = async (id, data) => {
  return prisma.resource.update({
    where: { id },
    data,
    include: { instructor: { select: { profile: true } } },
  });
};

export const deleteResource = async (id) => {
  // Soft delete — just mark as unavailable
  return prisma.resource.update({
    where: { id },
    data:  { isAvailable: false },
  });
};

// ─────────────────────────────────────────────
// RATINGS
// ─────────────────────────────────────────────

export const upsertRating = async (resourceId, userId, data) => {
  return prisma.resourceRating.upsert({
    where:  { resourceId_userId: { resourceId, userId } },
    update: data,
    create: { resourceId, userId, ...data },
  });
};

export const recalculateRating = async (resourceId) => {
  // Recalculate average rating after every new rating
  const result = await prisma.resourceRating.aggregate({
    where:   { resourceId },
    _avg:    { rating: true },
    _count:  { rating: true },
  });

  return prisma.resource.update({
    where: { id: resourceId },
    data:  {
      rating:       result._avg.rating ?? 0,
      totalRatings: result._count.rating,
    },
  });
};

// Check if external resource already imported
export const findByExternalId = async (externalId, externalPlatform) => {
  return prisma.resource.findFirst({
    where: { externalId, externalPlatform },
  });
};