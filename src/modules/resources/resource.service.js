import * as resourceRepository from './resource.repository.js';
import * as externalApis       from '../../utils/external-apis.util.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../utils/errors.util.js';

// ─────────────────────────────────────────────
// INTERNAL RESOURCES
// ─────────────────────────────────────────────

export const createResource = async (data, requestingUser) => {
  // Attach instructor ID if the creator is an instructor
  if (requestingUser.role === 'INSTRUCTOR') {
    data.instructorId = requestingUser.id;
  }
  return resourceRepository.createResource(data);
};

export const getAllResources = async (filters) => {
  // filters already has correct types + defaults from Zod validation
  // No need to parse page/limit manually anymore5
  console.log('filters received in service:', filters);
  return resourceRepository.findAllResources(filters);
};

export const getResourceById = async (id) => {
  const resource = await resourceRepository.findResourceById(id);
  if (!resource || !resource.isAvailable) {
    throw new NotFoundError('Resource not found');
  }
  return resource;
};

export const updateResource = async (id, data, requestingUser) => {
  const resource = await resourceRepository.findResourceById(id);
  if (!resource) throw new NotFoundError('Resource not found');

  // Instructors can only update their own resources
  if (
    requestingUser.role === 'INSTRUCTOR' &&
    resource.instructorId !== requestingUser.id
  ) {
    throw new ForbiddenError('You can only update your own resources');
  }

  return resourceRepository.updateResource(id, data);
};

export const deleteResource = async (id, requestingUser) => {
  const resource = await resourceRepository.findResourceById(id);
  if (!resource) throw new NotFoundError('Resource not found');

  // Only admins can delete — instructors cannot
  if (requestingUser.role !== 'ADMIN') {
    throw new ForbiddenError('Only admins can delete resources');
  }

  return resourceRepository.deleteResource(id);
};

export const getResourceTypes = async () => {
  return resourceRepository.findResourcesByType();
};

// ─────────────────────────────────────────────
// RATINGS
// ─────────────────────────────────────────────

export const rateResource = async (resourceId, userId, data) => {
  const resource = await resourceRepository.findResourceById(resourceId);
  if (!resource) throw new NotFoundError('Resource not found');

  // Save/update the rating
  const rating = await resourceRepository.upsertRating(resourceId, userId, data);

  // Recalculate average
  await resourceRepository.recalculateRating(resourceId);

  return rating;
};

// ─────────────────────────────────────────────
// EXTERNAL RESOURCES
// ─────────────────────────────────────────────

/**
 * Search external platforms and return results WITHOUT saving to DB.
 * Student can browse, then choose to import what they want.
 */
export const searchExternalResources = async ({ query, platform, type, limit }) => {
  const results = {};

  // Run all searches in parallel using Promise.allSettled
  // allSettled = even if YouTube fails, Udemy results still return
  // Spring Boot equivalent: CompletableFuture.allOf()
  if (platform === 'all' || platform === 'youtube') {
    const [videos, playlists] = await Promise.allSettled([
      externalApis.searchYoutube(query, 'video',    limit),
      externalApis.searchYoutube(query, 'playlist', Math.ceil(limit / 2)),
    ]);
    results.youtube = {
      videos:    videos.status    === 'fulfilled' ? videos.value    : [],
      playlists: playlists.status === 'fulfilled' ? playlists.value : [],
    };
  }

  if (platform === 'all' || platform === 'udemy') {
    const udemy = await Promise.allSettled([externalApis.searchUdemy(query, limit)]);
    results.udemy = udemy[0].status === 'fulfilled' ? udemy[0].value : [];
  }

  if (platform === 'all' || platform === 'coursera') {
    const coursera = await Promise.allSettled([externalApis.searchCoursera(query, limit)]);
    results.coursera = coursera[0].status === 'fulfilled' ? coursera[0].value : [];
  }

  return results;
};

/**
 * Import an external resource into EduBooking's DB.
 * Fetches fresh metadata from the platform and saves it.
 */
export const importExternalResource = async (data) => {
  const { externalId, externalPlatform, type, tags, branch, semester, difficultyLevel } = data;

  // Check if already imported
  const existing = await resourceRepository.findByExternalId(externalId, externalPlatform);
  if (existing) {
    throw new ConflictError('This resource has already been imported');
  }

  // Fetch fresh metadata from the platform
  let metadata = {};

  if (externalPlatform === 'youtube') {
    metadata = await externalApis.getYoutubeVideoDetails(externalId);
  } else if (externalPlatform === 'udemy') {
    const results = await externalApis.searchUdemy(externalId, 1);
    metadata = results[0] || {};
  } else if (externalPlatform === 'coursera') {
    const results = await externalApis.searchCoursera(externalId, 1);
    metadata = results[0] || {};
  }

  if (!metadata.title) {
    throw new NotFoundError('Could not fetch resource details from platform');
  }

  // Save to our database
  return resourceRepository.createResource({
    ...metadata,
    type,
    tags,
    branch,
    semester,
    difficultyLevel,
    isExternal:      true,
    externalId,
    externalPlatform,
  });
};