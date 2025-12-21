const { PrismaClient } = require('../generated/client');
const prisma = new PrismaClient();

/**
 * AI Search History Service
 * Manages AI search history records in Main Backend database
 */

/**
 * Create initial search history record
 * @param {Object} data - Search history data
 * @returns {Promise<Object>} Created record
 */
const createSearchHistory = async (data) => {
  const {
    sessionId,
    userId,
    anonymousId,
    queryType,
    platform,
    sourceFeature,
    originalImageUrl,
    queryCategory,
    dominantColors,
  } = data;

  return await prisma.aiSearchHistory.create({
    data: {
      session_id: sessionId,
      user_id: userId || null,
      anonymous_id: anonymousId || null,
      query_type: queryType,
      platform: platform || null,
      source_feature: sourceFeature || null,
      original_image_url: originalImageUrl || null,
      query_category: queryCategory || null,
      dominant_colors: dominantColors || null,
    },
  });
};

/**
 * Update search history with detected objects
 * @param {String} sessionId - Session ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated record
 */
const updateSearchHistory = async (sessionId, updateData) => {
  return await prisma.aiSearchHistory.update({
    where: { session_id: sessionId },
    data: updateData,
  });
};

/**
 * Get user's search history with pagination
 * @param {Number|null} userId - User ID
 * @param {String|null} anonymousId - Anonymous ID
 * @param {Number} page - Page number (1-indexed)
 * @param {Number} pageSize - Items per page
 * @param {Boolean} isAdmin - If true, show all records regardless of user_id
 * @returns {Promise<Object>} Paginated history
 */
const getUserHistory = async (userId, anonymousId, page = 1, pageSize = 20, isAdmin = false) => {
  // Build where clause
  const where = {};

  // Admin can see all records
  if (isAdmin) {
    // No filter - show all records including user_id = null
  } else if (userId) {
    where.user_id = userId;
  } else if (anonymousId) {
    where.anonymous_id = anonymousId;
  } else {
    return {
      total: 0,
      page,
      page_size: pageSize,
      items: [],
    };
  }

  // Get total count
  const total = await prisma.aiSearchHistory.count({ where });

  // Get paginated items
  const skip = (page - 1) * pageSize;
  const items = await prisma.aiSearchHistory.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      session_id: true,
      query_type: true,
      platform: true,
      source_feature: true,
      original_image_url: true,
      created_at: true,
      detected_objects: true,
      recommendations: true,
      query_category: true,
      avg_match_score: true,
      dominant_colors: true,
    },
  });

  // Calculate counts from JSON arrays
  const itemsWithCounts = items.map((item) => ({
    ...item,
    detected_objects_count: Array.isArray(item.detected_objects)
      ? item.detected_objects.length
      : 0,
    recommendations_count: Array.isArray(item.recommendations)
      ? item.recommendations.length
      : 0,
    // Include analytics fields
    query_category: item.query_category,
    avg_match_score: item.avg_match_score,
    dominant_colors: item.dominant_colors,
    // Remove full arrays to reduce response size
    detected_objects: undefined,
    recommendations: undefined,
  }));

  return {
    total,
    page,
    page_size: pageSize,
    items: itemsWithCounts,
  };
};

/**
 * Clear user's search history
 * @param {Number|null} userId - User ID
 * @param {String|null} anonymousId - Anonymous ID
 * @returns {Promise<Number>} Number of deleted records
 */
const clearUserHistory = async (userId, anonymousId) => {
  const where = {};
  if (userId) {
    where.user_id = userId;
  } else if (anonymousId) {
    where.anonymous_id = anonymousId;
  } else {
    return 0;
  }

  const result = await prisma.aiSearchHistory.deleteMany({ where });
  return result.count;
};

/**
 * Get history record by session ID
 * @param {String} sessionId - Session ID
 * @returns {Promise<Object|null>} History record
 */
const getHistoryBySession = async (sessionId) => {
  return await prisma.aiSearchHistory.findUnique({
    where: { session_id: sessionId },
  });
};

module.exports = {
  createSearchHistory,
  updateSearchHistory,
  getUserHistory,
  clearUserHistory,
  getHistoryBySession,
};
