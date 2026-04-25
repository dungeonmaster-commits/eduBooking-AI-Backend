import prisma from '../../database/prisma.client.js';

// ── Shared select shapes ───────────────────────────────────────────────────────
const authorSelect = {
  id:    true,
  profile: {
    select: {
      firstName: true,
      lastName:  true,
      avatarUrl: true,
      branch:    true,
    },
  },
};

const commentSelect = {
  id:         true,
  content:    true,
  isEdited:   true,
  likesCount: true,
  createdAt:  true,
  updatedAt:  true,
  user:       { select: authorSelect },
};

const postSelect = {
  id:            true,
  title:         true,
  content:       true,
  tags:          true,
  imageUrl:      true,
  likesCount:    true,
  commentsCount: true,
  viewsCount:    true,
  isEdited:      true,
  createdAt:     true,
  updatedAt:     true,
  user:          { select: authorSelect },
};

// ─────────────────────────────────────────────
// POSTS — READ
// ─────────────────────────────────────────────

export const findPostById = async (id, includeComments = false) => {
  return prisma.post.findUnique({
    where:  { id },
    select: {
      ...postSelect,
      // Only include comments when viewing single post
      ...(includeComments && {
        comments: {
          orderBy: { createdAt: 'asc' },
          select:  commentSelect,
        },
      }),
    },
  });
};

export const findAllPosts = async (filters) => {
  const { tags, search, userId, page, limit, sortBy, sortOrder } = filters;
  const skip = (page - 1) * limit;

  const where = {};

  if (userId) where.userId = userId;

  if (tags) {
    where.tags = { hasSome: tags.split(',').map((t) => t.trim()) };
  }

  if (search) {
    where.OR = [
      { title:   { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { [sortBy]: sortOrder },
      select:  postSelect,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
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

// ─────────────────────────────────────────────
// POSTS — WRITE
// ─────────────────────────────────────────────

export const createPost = async (data) => {
  return prisma.post.create({
    data,
    select: postSelect,
  });
};

export const updatePost = async (id, data) => {
  return prisma.post.update({
    where:  { id },
    data:   { ...data, isEdited: true },
    select: postSelect,
  });
};

export const deletePost = async (id) => {
  return prisma.post.delete({ where: { id } });
};

export const incrementViewCount = async (id) => {
  return prisma.post.update({
    where: { id },
    data:  { viewsCount: { increment: 1 } },
  });
};

// ─────────────────────────────────────────────
// LIKES — TOGGLE (like if not liked, unlike if liked)
// ─────────────────────────────────────────────

export const togglePostLike = async (postId, userId) => {
  // Check if already liked
  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    // Unlike — delete the like record and decrement counter
    await prisma.$transaction([
      prisma.postLike.delete({
        where: { postId_userId: { postId, userId } },
      }),
      prisma.post.update({
        where: { id: postId },
        data:  { likesCount: { decrement: 1 } },
      }),
    ]);
    return { liked: false, message: 'Post unliked' };

  } else {
    // Like — create like record and increment counter
    await prisma.$transaction([
      prisma.postLike.create({
        data: { postId, userId },
      }),
      prisma.post.update({
        where: { id: postId },
        data:  { likesCount: { increment: 1 } },
      }),
    ]);
    return { liked: true, message: 'Post liked' };
  }
};

// Check if a user has liked a post
export const hasUserLikedPost = async (postId, userId) => {
  const like = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  return !!like;
};

// ─────────────────────────────────────────────
// COMMENTS — READ
// ─────────────────────────────────────────────

export const findCommentById = async (id) => {
  return prisma.comment.findUnique({
    where:  { id },
    select: commentSelect,
  });
};

export const findCommentsByPost = async (postId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where:   { postId },
      skip,
      take:    limit,
      orderBy: { createdAt: 'asc' },
      select:  commentSelect,
    }),
    prisma.comment.count({ where: { postId } }),
  ]);

  return {
    comments,
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

// ─────────────────────────────────────────────
// COMMENTS — WRITE
// ─────────────────────────────────────────────

export const createComment = async (data) => {
  // Create comment and increment post comment counter in one transaction
  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data,
      select: commentSelect,
    }),
    prisma.post.update({
      where: { id: data.postId },
      data:  { commentsCount: { increment: 1 } },
    }),
  ]);
  return comment;
};

export const updateComment = async (id, content) => {
  return prisma.comment.update({
    where:  { id },
    data:   { content, isEdited: true },
    select: commentSelect,
  });
};

export const deleteComment = async (id, postId) => {
  // Delete comment and decrement post comment counter in one transaction
  await prisma.$transaction([
    prisma.comment.delete({ where: { id } }),
    prisma.post.update({
      where: { id: postId },
      data:  { commentsCount: { decrement: 1 } },
    }),
  ]);
};

export const toggleCommentLike = async (commentId, userId) => {
  const existing = await prisma.commentLike.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.commentLike.delete({
        where: { commentId_userId: { commentId, userId } },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data:  { likesCount: { decrement: 1 } },
      }),
    ]);
    return { liked: false, message: 'Comment unliked' };

  } else {
    await prisma.$transaction([
      prisma.commentLike.create({ data: { commentId, userId } }),
      prisma.comment.update({
        where: { id: commentId },
        data:  { likesCount: { increment: 1 } },
      }),
    ]);
    return { liked: true, message: 'Comment liked' };
  }
};