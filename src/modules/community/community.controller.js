import * as communityService from './community.service.js';
import { sendSuccess }       from '../../utils/response.util.js';

// ── Posts ─────────────────────────────────────────────────────────────────────

export const createPost = async (req, res, next) => {
  try {
    const post = await communityService.createPost(req.user.id, req.validatedBody);
    return sendSuccess(res, { statusCode: 201, message: 'Post created', data: post });
  } catch (err) { next(err); }
};

export const getAllPosts = async (req, res, next) => {
  try {
    const result = await communityService.getAllPosts(req.validatedQuery);
    return sendSuccess(res, { message: 'Posts retrieved', data: result });
  } catch (err) { next(err); }
};

export const getPostById = async (req, res, next) => {
  try {
    const post = await communityService.getPostById(req.params.id, req.user.id);
    return sendSuccess(res, { message: 'Post retrieved', data: post });
  } catch (err) { next(err); }
};

export const getMyPosts = async (req, res, next) => {
  try {
    const result = await communityService.getMyPosts(req.user.id, req.validatedQuery);
    return sendSuccess(res, { message: 'My posts retrieved', data: result });
  } catch (err) { next(err); }
};

export const updatePost = async (req, res, next) => {
  try {
    const post = await communityService.updatePost(
      req.params.id, req.user.id, req.validatedBody
    );
    return sendSuccess(res, { message: 'Post updated', data: post });
  } catch (err) { next(err); }
};

export const deletePost = async (req, res, next) => {
  try {
    const result = await communityService.deletePost(req.params.id, req.user);
    return sendSuccess(res, { message: result.message });
  } catch (err) { next(err); }
};

export const togglePostLike = async (req, res, next) => {
  try {
    const result = await communityService.togglePostLike(req.params.id, req.user.id);
    return sendSuccess(res, { message: result.message, data: { liked: result.liked } });
  } catch (err) { next(err); }
};

// ── Comments ──────────────────────────────────────────────────────────────────

export const addComment = async (req, res, next) => {
  try {
    const comment = await communityService.addComment(
      req.params.id, req.user.id, req.validatedBody
    );
    return sendSuccess(res, { statusCode: 201, message: 'Comment added', data: comment });
  } catch (err) { next(err); }
};

export const updateComment = async (req, res, next) => {
  try {
    const comment = await communityService.updateComment(
      req.params.id, req.params.cid, req.user.id, req.validatedBody
    );
    return sendSuccess(res, { message: 'Comment updated', data: comment });
  } catch (err) { next(err); }
};

export const deleteComment = async (req, res, next) => {
  try {
    const result = await communityService.deleteComment(
      req.params.id, req.params.cid, req.user
    );
    return sendSuccess(res, { message: result.message });
  } catch (err) { next(err); }
};

export const toggleCommentLike = async (req, res, next) => {
  try {
    const result = await communityService.toggleCommentLike(
      req.params.cid, req.user.id
    );
    return sendSuccess(res, { message: result.message, data: { liked: result.liked } });
  } catch (err) { next(err); }
};