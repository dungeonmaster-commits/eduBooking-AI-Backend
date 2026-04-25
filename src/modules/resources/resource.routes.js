import { Router }              from 'express';
import * as resourceController from './resource.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import validate                from '../../middlewares/validate.middleware.js';
import {
  createResourceSchema,
  updateResourceSchema,
  rateResourceSchema,
  importExternalSchema,
  resourceFilterSchema,
  externalSearchSchema,   // ✅ was missing from your imports
} from './resource.validation.js';

const router = Router();

// All resource routes require authentication
router.use(authenticate);

// ─── IMPORTANT: Static/specific routes MUST come before /:id ─────────────────
// Express matches routes top to bottom — /:id would swallow everything below it

// ── Static GET routes ─────────────────────────────────────────────────────────
router.get('/types',
  resourceController.getResourceTypes
);

router.get('/external/search',
  validate(externalSearchSchema, 'query'),   // ✅ 'query' — reads req.query
  resourceController.searchExternalResources
);

// ── Root GET — list all resources with filters ────────────────────────────────
router.get('/',
  validate(resourceFilterSchema, 'query'),   // ✅ 'query' — reads req.query
  resourceController.getAllResources
);

// ── POST routes ───────────────────────────────────────────────────────────────
router.post('/',
  authorize('ADMIN', 'INSTRUCTOR'),
  validate(createResourceSchema),            // default 'body'
  resourceController.createResource
);

router.post('/external/import',
  authorize('ADMIN', 'INSTRUCTOR'),
  validate(importExternalSchema),            // default 'body'
  resourceController.importExternalResource
);

// ── Dynamic :id routes — ALWAYS after static routes ──────────────────────────
router.get('/:id',
  resourceController.getResourceById
);

router.post('/:id/rate',
  validate(rateResourceSchema),              // default 'body'
  resourceController.rateResource
);

router.put('/:id',
  authorize('ADMIN', 'INSTRUCTOR'),
  validate(updateResourceSchema),            // default 'body'
  resourceController.updateResource
);

router.delete('/:id',
  authorize('ADMIN'),
  resourceController.deleteResource
);

export default router;