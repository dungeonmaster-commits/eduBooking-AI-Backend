import * as communityRepository from './community.repository.js';
import {
  NotFoundError,
  ForbiddenError,
} from '../../utils/errors.util.js';

// ─────────────────────────────────────────────
// POSTS
// ─────────────────────────────────────────────

export const createPost = async (userId, data) => {
  return communityRepository.createPost({ ...data, userId });
};

export const getAllPosts = async (filters) => {
  return communityRepository.findAllPosts(filters);
};

export const getPostById = async (postId, requestingUserId) => {
  const post = await communityRepository.findPostById(postId, true);
  if (!post) throw new NotFoundError('Post not found');

  // Increment view count asynchronously — don't await, don't block response
  // Spring Boot equivalent: @Async method
  communityRepository.incrementViewCount(postId).catch(() => {});

  // Attach whether the requesting user has liked this post
  const isLiked = await communityRepository.hasUserLikedPost(
    postId,
    requestingUserId
  );

  return { ...post, isLiked };
};

export const getMyPosts = async (userId, filters) => {
  return communityRepository.findAllPosts({ ...filters, userId });
};

export const updatePost = async (postId, userId, data) => {
  const post = await communityRepository.findPostById(postId);
  if (!post) throw new NotFoundError('Post not found');

  // Only the post owner can update
  if (post.user.id !== userId) {
    throw new ForbiddenError('You can only edit your own posts');
  }

  return communityRepository.updatePost(postId, data);
};

export const deletePost = async (postId, requestingUser) => {
  const post = await communityRepository.findPostById(postId);
  if (!post) throw new NotFoundError('Post not found');

  // Owner or admin can delete
  if (
    post.user.id !== requestingUser.id &&
    requestingUser.role !== 'ADMIN'
  ) {
    throw new ForbiddenError('You can only delete your own posts');
  }

  await communityRepository.deletePost(postId);
  return { message: 'Post deleted successfully' };
};

export const togglePostLike = async (postId, userId) => {
  const post = await communityRepository.findPostById(postId);
  if (!post) throw new NotFoundError('Post not found');

  return communityRepository.togglePostLike(postId, userId);
};

// ─────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────

export const addComment = async (postId, userId, data) => {
  const post = await communityRepository.findPostById(postId);
  if (!post) throw new NotFoundError('Post not found');

  return communityRepository.createComment({
    postId,
    userId,
    content: data.content,
  });
};

export const updateComment = async (postId, commentId, userId, data) => {
  const comment = await communityRepository.findCommentById(commentId);
  if (!comment) throw new NotFoundError('Comment not found');

  if (comment.user.id !== userId) {
    throw new ForbiddenError('You can only edit your own comments');
  }

  return communityRepository.updateComment(commentId, data.content);
};

export const deleteComment = async (postId, commentId, requestingUser) => {
  const comment = await communityRepository.findCommentById(commentId);
  if (!comment) throw new NotFoundError('Comment not found');

  if (
    comment.user.id !== requestingUser.id &&
    requestingUser.role !== 'ADMIN'
  ) {
    throw new ForbiddenError('You can only delete your own comments');
  }

  await communityRepository.deleteComment(commentId, postId);
  return { message: 'Comment deleted successfully' };
};

export const toggleCommentLike = async (commentId, userId) => {
  const comment = await communityRepository.findCommentById(commentId);
  if (!comment) throw new NotFoundError('Comment not found');

  return communityRepository.toggleCommentLike(commentId, userId);
};