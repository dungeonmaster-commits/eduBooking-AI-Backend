import prisma from '../../database/prisma.client.js';

/**
 * User Repository — raw database operations only.
 *
 * Spring Boot equivalent: @Repository UserRepository (extends JpaRepository)
 * Key difference: No interface/implementation split needed in Node.js.
 * We export plain functions instead of a class.
 */

// ─────────────────────────────────────────────
// READ OPERATIONS
// ─────────────────────────────────────────────

/**
 * Find a user by their ID, including their profile.
 */
export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id:          true,
      email:       true,
      role:        true,
      isVerified:  true,
      isActive:    true,
      createdAt:   true,
      profile:     true,       // joins the Profile table
      passwordHash: false,     // NEVER return this
    },
  });
};

/**
 * Find a user's profile only (for public profile view).
 * Returns limited fields — no email, no role, no sensitive data.
 */
export const findPublicProfile = async (userId) => {
  return prisma.profile.findUnique({
    where: { userId },
    select: {
      firstName:   true,
      lastName:    true,
      bio:         true,
      avatarUrl:   true,
      branch:      true,
      semester:    true,
      university:  true,
      linkedinUrl: true,
      githubUrl:   true,
      skills:      true,
      // resumeUrl and personal info NOT included in public view
      user: {
        select: {
          id:        true,
          createdAt: true,   // "member since"
        },
      },
    },
  });
};

/**
 * Get all users — for admin panel.
 * Supports pagination.
 */
export const findAllUsers = async ({ page = 1, limit = 20, role, isActive }) => {
  const skip = (page - 1) * limit;

  // Build filter dynamically — only add filters that were provided
  // Spring Boot equivalent: Specification<User> or @Query with optional params
  const where = {};
  if (role)             where.role     = role;
  if (isActive !== undefined) where.isActive = isActive;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id:        true,
        email:     true,
        role:      true,
        isActive:  true,
        isVerified: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName:  true,
            avatarUrl: true,
            branch:    true,
          },
        },
      },
    }),
    // Count query runs in parallel in the same transaction
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

// ─────────────────────────────────────────────
// WRITE OPERATIONS
// ─────────────────────────────────────────────

/**
 * Update a user's profile.
 * Uses upsert: creates profile if it doesn't exist, updates if it does.
 *
 * Spring Boot: profileRepository.save(profile) — same idea
 */
export const updateProfile = async (userId, data) => {
  return prisma.profile.upsert({
    where:  { userId },
    update: data,          // if profile exists → update these fields
    create: {              // if profile doesn't exist → create it
      userId,
      firstName: data.firstName ?? '',
      lastName:  data.lastName  ?? '',
      ...data,
    },
  });
};

/**
 * Deactivate a user account (soft delete).
 * We never hard-delete users — just mark them inactive.
 *
 * Spring Boot equivalent: user.setActive(false); userRepository.save(user);
 */
export const deactivateUser = async (id) => {
  return prisma.user.update({
    where: { id },
    data:  { isActive: false },
    select: { id: true, email: true, isActive: true },
  });
};

/**
 * Reactivate a user account.
 */
export const reactivateUser = async (id) => {
  return prisma.user.update({
    where: { id },
    data:  { isActive: true },
    select: { id: true, email: true, isActive: true },
  });
};