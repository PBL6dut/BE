/**
 * Match Score Calculator Utility
 * Calculates average similarity score from product recommendations
 */

/**
 * Calculates average match score from recommendations
 * @param {Array} recommendations - Array of product recommendations with similarity_score field
 * @returns {Number} Average score (0.0-1.0), rounded to 2 decimal places
 */
const calculateAvgMatchScore = (recommendations) => {
  // Validation: Check if input is valid
  if (!recommendations || !Array.isArray(recommendations)) {
    console.warn('[MatchScoreCalculator] Invalid input - not an array:', typeof recommendations);
    return 0.0;
  }

  if (recommendations.length === 0) {
    console.debug('[MatchScoreCalculator] Empty recommendations array');
    return 0.0;
  }

  // Extract and filter valid scores
  const validScores = recommendations
    .map((rec, index) => {
      if (!rec || typeof rec !== 'object') {
        console.warn(`[MatchScoreCalculator] Recommendation at index ${index} is not an object:`, rec);
        return null;
      }

      const score = rec.similarity_score;

      // Validate score
      if (score === null || score === undefined) {
        console.debug(`[MatchScoreCalculator] Recommendation at index ${index} missing similarity_score`);
        return null;
      }

      if (typeof score !== 'number' || isNaN(score)) {
        console.warn(`[MatchScoreCalculator] Invalid score type at index ${index}:`, score, typeof score);
        return null;
      }

      if (score < 0 || score > 1) {
        console.warn(`[MatchScoreCalculator] Score out of range [0,1] at index ${index}:`, score);
        return null;
      }

      return score;
    })
    .filter(score => score !== null);

  // No valid scores found
  if (validScores.length === 0) {
    console.warn('[MatchScoreCalculator] No valid scores found in recommendations');
    return 0.0;
  }

  // Calculate average
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  const average = sum / validScores.length;

  // Round to 2 decimal places for cleaner storage
  const rounded = Math.round(average * 100) / 100;

  console.log(`[MatchScoreCalculator] Calculated average: ${rounded} (from ${validScores.length} valid scores)`);

  return rounded;
};

module.exports = {
  calculateAvgMatchScore
};
