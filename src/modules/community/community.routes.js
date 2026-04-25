import { Router }               from 'express';
import * as communityController from './community.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate                 from '../../middlewares/validate.middleware.js';
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  updateCommentSchema,
  postFilterSchema,
} from './community.validation.js';

const router = Router();

router.use(authenticate);

// ── Static routes first ───────────────────────────────────────────────────────
router.get('/posts/my',
  validate(postFilterSchema, 'query'),
  communityController.getMyPosts
);

// ── Post routes ───────────────────────────────────────────────────────────────
router.get('/posts',
  validate(postFilterSchema, 'query'),
  communityController.getAllPosts
);

router.post('/posts',
  validate(createPostSchema),
  communityController.createPost
);

// ── Dynamic post :id routes ───────────────────────────────────────────────────
router.get('/posts/:id',        communityController.getPostById);
router.put('/posts/:id',        validate(updatePostSchema), communityController.updatePost);
router.delete('/posts/:id',     communityController.deletePost);
router.post('/posts/:id/like',  communityController.togglePostLike);

// ── Comment routes ────────────────────────────────────────────────────────────
router.post('/posts/:id/comments',
  validate(createCommentSchema),
  communityController.addComment
);

router.put('/posts/:id/comments/:cid',
  validate(updateCommentSchema),
  communityController.updateComment
);

router.delete('/posts/:id/comments/:cid', communityController.deleteComment);

router.post('/posts/:id/comments/:cid/like', communityController.toggleCommentLike);

export default router;