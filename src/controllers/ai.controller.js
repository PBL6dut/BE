const axios = require('axios');
const FormData = require('form-data');
const { successResponse, errorResponse } = require('../utils/response');
const aiHistoryService = require('../services/aiHistory.service');
const { classifyRoomCategory } = require('../utils/roomClassifier');
const { extractDominantColors } = require('../utils/colorExtractor');
const { calculateAvgMatchScore } = require('../utils/matchScoreCalculator');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/ai/detect
 * Detect objects from image and save to Main Backend database
 */
const detectObjects = async (req, res) => {
  try {
    // Extract user context from JWT (checkLogin middleware already ran)
    const userId = req.user?.id || null;
    const anonymousId = req.headers['x-anonymous-id'] || null;
    const platform = req.headers['x-platform'] || 'web';
    const sourceFeature = req.headers['x-source-feature'] || null;

    // Validate file
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', null, 400);
    }

    // Forward file to AI Service for detection
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/recommendations/detect`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        params: {
          conf_threshold: req.query.conf_threshold || 0.5
        },
        timeout: 120000  // 2 minutes
      }
    );

    const aiData = aiResponse.data;

    // Extract metadata for analytics
    let queryCategory = null;
    let dominantColors = null;

    try {
      queryCategory = classifyRoomCategory(aiData.detected_objects);
      dominantColors = extractDominantColors(aiData.detected_objects);
      console.log(`[AI Detect] Analytics - Category: ${queryCategory}, Colors: ${JSON.stringify(dominantColors)}`);
    } catch (utilError) {
      console.error('[AI Detect] Error in analytics extraction:', utilError);
      // Continue with null values - don't block the main flow
    }

    // Save to Main Backend database
    try {
      await aiHistoryService.createSearchHistory({
        sessionId: aiData.session_id,
        userId: userId,
        anonymousId: anonymousId,
        queryType: 'detect',
        platform: platform,
        sourceFeature: sourceFeature,
        originalImageUrl: aiData.original_image_url || null,
        queryCategory: queryCategory,
        dominantColors: dominantColors,
      });

      // Update with detected objects
      if (aiData.detected_objects && aiData.detected_objects.length > 0) {
        await aiHistoryService.updateSearchHistory(aiData.session_id, {
          detected_objects: aiData.detected_objects,
        });
      }
    } catch (dbError) {
      console.error('Failed to save history to database:', dbError);
      // Continue even if DB save fails - don't block user
    }

    return successResponse(res, 'Object detection successful', aiData);

  } catch (error) {
    console.error('AI detect error:', error.message);

    if (error.response) {
      return errorResponse(
        res,
        error.response.data.detail || 'AI Service error',
        null,
        error.response.status
      );
    }

    return errorResponse(res, 'Failed to process image', error.message, 500);
  }
};

/**
 * POST /api/ai/:session_id
 * Get recommendations and update Main Backend database
 */
const getRecommendations = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { selected_bbox, top_k = 10 } = req.body;

    // Validate bbox
    if (!selected_bbox || !Array.isArray(selected_bbox) || selected_bbox.length !== 4) {
      return errorResponse(res, 'Invalid selected_bbox format', null, 400);
    }

    // Call AI Service for recommendations
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/recommendations/${session_id}`,
      {
        selected_bbox,
        top_k
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000
      }
    );

    const aiData = aiResponse.data;

    // Calculate analytics - average match score
    let avgMatchScore = 0.0;

    try {
      avgMatchScore = calculateAvgMatchScore(aiData.recommendations);
      console.log(`[AI Recommend] Average match score: ${avgMatchScore}`);
    } catch (utilError) {
      console.error('[AI Recommend] Error calculating match score:', utilError);
      // Continue with default value 0.0
    }

    // Update Main Backend database with recommendations
    try {
      await aiHistoryService.updateSearchHistory(session_id, {
        query_type: 'recommend',
        selected_bbox: selected_bbox,
        recommendations: aiData.recommendations || [],
        avg_match_score: avgMatchScore,
      });
    } catch (dbError) {
      console.error('Failed to update history in database:', dbError);
      // Continue even if DB update fails
    }

    return successResponse(res, 'Recommendations retrieved successfully', aiData);

  } catch (error) {
    console.error('AI recommend error:', error.message);

    if (error.response) {
      return errorResponse(
        res,
        error.response.data.detail || 'AI Service error',
        null,
        error.response.status
      );
    }

    return errorResponse(res, 'Failed to get recommendations', error.message, 500);
  }
};

/**
 * GET /api/ai/history/me
 * Get user's search history from Main Backend database
 * - Admin users see all history records (including user_id = null)
 * - Regular users see only their own history
 */
const getHistory = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const anonymousId = req.headers['x-anonymous-id'] || null;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.page_size) || 20;
    const isAdmin = req.user?.role === 'admin';

    // DEBUG: Log filter values
    console.log('🔍 History Query:', {
      userId,
      anonymousId,
      page,
      pageSize,
      isAdmin,
      userFromToken: req.user
    });

    // Query from Main Backend database
    const result = await aiHistoryService.getUserHistory(
      userId,
      anonymousId,
      page,
      pageSize,
      isAdmin
    );

    console.log('📊 History Result:', {
      total: result.total,
      itemCount: result.items.length
    });

    return successResponse(res, 'History retrieved successfully', result);

  } catch (error) {
    console.error('Get history error:', error.message);
    return errorResponse(res, 'Failed to get history', error.message, 500);
  }
};

/**
 * DELETE /api/ai/history/clear
 * Clear user's search history from Main Backend database
 */
const clearHistory = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const anonymousId = req.headers['x-anonymous-id'] || null;

    // Delete from Main Backend database
    const deletedCount = await aiHistoryService.clearUserHistory(
      userId,
      anonymousId
    );

    return successResponse(res, 'History cleared successfully', {
      deleted_count: deletedCount
    });

  } catch (error) {
    console.error('Clear history error:', error.message);
    return errorResponse(res, 'Failed to clear history', error.message, 500);
  }
};

/**
 * GET /api/ai/history/session/:sessionId
 * Get search history by session ID
 */
const getHistoryBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return errorResponse(res, 'Session ID is required', null, 400);
    }

    // Get history record from database
    const history = await aiHistoryService.getHistoryBySession(sessionId);

    if (!history) {
      return errorResponse(res, 'History not found', null, 404);
    }

    // Add counts for detected_objects and recommendations
    const historyWithCounts = {
      ...history,
      detected_objects_count: Array.isArray(history.detected_objects)
        ? history.detected_objects.length
        : 0,
      recommendations_count: Array.isArray(history.recommendations)
        ? history.recommendations.length
        : 0,
    };

    return successResponse(res, 'History retrieved successfully', historyWithCounts);

  } catch (error) {
    console.error('Get history by session error:', error.message);
    return errorResponse(res, 'Failed to get history', error.message, 500);
  }
};

module.exports = {
  detectObjects,
  getRecommendations,
  getHistory,
  clearHistory,
  getHistoryBySession
};
