import axios from 'axios';
import config from '../config/app.config.js';

/**
 * External API Utility
 * Handles all communication with YouTube, Udemy, Coursera APIs.
 *
 * Spring Boot equivalent: A @Component RestTemplateService or WebClient wrapper
 */

// ─────────────────────────────────────────────
// YOUTUBE API
// ─────────────────────────────────────────────

/**
 * Search YouTube for videos or playlists.
 *
 * @param {string} query      - Search term
 * @param {string} type       - 'video' or 'playlist'
 * @param {number} maxResults - Number of results (max 50)
 */
export const searchYoutube = async (query, type = 'video', maxResults = 10) => {
  try {
    const response = await axios.get(`${config.youtube.baseUrl}/search`, {
      params: {
        key:        config.youtube.apiKey,
        q:          query,
        type,
        part:       'snippet',
        maxResults,
        relevanceLanguage: 'en',
        safeSearch: 'strict',
      },
    });

    // Transform YouTube response into our standard format
    return response.data.items.map((item) => ({
      externalId:       item.id.videoId || item.id.playlistId,
      externalPlatform: 'youtube',
      type:             type === 'video' ? 'YOUTUBE_VIDEO' : 'YOUTUBE_PLAYLIST',
      title:            item.snippet.title,
      description:      item.snippet.description,
      thumbnailUrl:     item.snippet.thumbnails?.high?.url,
      externalUrl:      type === 'video'
        ? `https://www.youtube.com/watch?v=${item.id.videoId}`
        : `https://www.youtube.com/playlist?list=${item.id.playlistId}`,
      channel:          item.snippet.channelTitle,
      publishedAt:      item.snippet.publishedAt,
      isExternal:       true,
      price:            0,  // YouTube is free
    }));

  } catch (error) {
    console.error('YouTube API error:', error.response?.data || error.message);
    throw new Error('Failed to fetch YouTube results');
  }
};

/**
 * Get details of a specific YouTube video.
 */
export const getYoutubeVideoDetails = async (videoId) => {
  try {
    const response = await axios.get(`${config.youtube.baseUrl}/videos`, {
      params: {
        key:  config.youtube.apiKey,
        id:   videoId,
        part: 'snippet,contentDetails,statistics',
      },
    });

    const video = response.data.items[0];
    if (!video) return null;

    // Parse ISO 8601 duration (PT1H30M → 90 minutes)
    const duration = parseYoutubeDuration(video.contentDetails.duration);

    return {
      externalId:       videoId,
      externalPlatform: 'youtube',
      type:             'YOUTUBE_VIDEO',
      title:            video.snippet.title,
      description:      video.snippet.description,
      thumbnailUrl:     video.snippet.thumbnails?.high?.url,
      externalUrl:      `https://www.youtube.com/watch?v=${videoId}`,
      channel:          video.snippet.channelTitle,
      duration,
      viewCount:        parseInt(video.statistics.viewCount),
      likeCount:        parseInt(video.statistics.likeCount),
      isExternal:       true,
      price:            0,
      externalData:     video,  // store raw response
    };

  } catch (error) {
    console.error('YouTube video details error:', error.message);
    throw new Error('Failed to fetch YouTube video details');
  }
};

/**
 * Parse YouTube duration from ISO 8601 to minutes.
 * PT1H30M15S → 90 minutes
 */
const parseYoutubeDuration = (duration) => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours   = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 60 + minutes + Math.ceil(seconds / 60);
};

// ─────────────────────────────────────────────
// UDEMY API
// ─────────────────────────────────────────────

/**
 * Search Udemy courses.
 */
// export const searchUdemy = async (query, maxResults = 10) => {
//   try {
//     // Udemy uses Basic Auth with clientId:clientSecret
//     const auth = Buffer.from(
//       `${config.udemy.clientId}:${config.udemy.clientSecret}`
//     ).toString('base64');

//     const response = await axios.get(`${config.udemy.baseUrl}/courses/`, {
//       headers: { Authorization: `Basic ${auth}` },
//       params: {
//         search:           query,
//         page_size:        maxResults,
//         ordering:         'relevance',
//         language:         'en',
//         fields: {
//           course: [
//             'title', 'headline', 'url', 'price',
//             'image_480x270', 'rating', 'num_reviews',
//             'num_lectures', 'content_length_video',
//             'instructors', 'primary_category',
//           ].join(','),
//         },
//       },
//     });

//     return response.data.results.map((course) => ({
//       externalId:       String(course.id),
//       externalPlatform: 'udemy',
//       type:             'UDEMY_COURSE',
//       title:            course.title,
//       description:      course.headline,
//       thumbnailUrl:     course.image_480x270,
//       externalUrl:      `https://www.udemy.com${course.url}`,
//       price:            parseFloat(course.price) || 0,
//       rating:           course.rating,
//       totalRatings:     course.num_reviews,
//       duration:         Math.round(course.content_length_video / 60), // seconds to minutes
//       isExternal:       true,
//       externalData:     course,
//     }));

//   } catch (error) {
//     console.error('Udemy API error:', error.response?.data || error.message);
//     throw new Error('Failed to fetch Udemy results');
//   }
// };
export const searchUdemy = async (query, maxResults = 10) => {
    // 🚧 Udemy credentials not configured yet — skipping
    console.warn('Udemy API is not configured. Skipping...');
    return [];
  };

// ─────────────────────────────────────────────
// COURSERA (Public catalog - no auth needed)
// ─────────────────────────────────────────────

/**
 * Search Coursera courses via their public catalog API.
 */
export const searchCoursera = async (query, maxResults = 10) => {
  try {
    const response = await axios.get(
      'https://api.coursera.org/api/courses.v1',
      {
        params: {
          q:           'search',
          query,
          limit:       maxResults,
          fields:      'name,slug,photoUrl,shortDescription,workload',
          includes:    'partnerIds',
        },
      }
    );

    return response.data.elements.map((course) => ({
      externalId:       course.id,
      externalPlatform: 'coursera',
      type:             'COURSERA_COURSE',
      title:            course.name,
      description:      course.shortDescription,
      thumbnailUrl:     course.photoUrl,
      externalUrl:      `https://www.coursera.org/learn/${course.slug}`,
      price:            0,   // Coursera shows audit as free
      isExternal:       true,
      externalData:     course,
    }));

  } catch (error) {
    console.error('Coursera API error:', error.message);
    throw new Error('Failed to fetch Coursera results');
  }
};