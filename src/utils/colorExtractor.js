/**
 * Color Extractor Utility
 * Extracts dominant colors from detected objects
 */

/**
 * Validates if a string is a valid hex color code
 * @param {String} color - Color string to validate
 * @returns {Boolean} True if valid hex color
 */
const isValidHexColor = (color) => {
  if (typeof color !== 'string') return false;

  // Match #RRGGBB or #RGB format
  const hexRegex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
  return hexRegex.test(color);
};

/**
 * Normalizes hex color to uppercase 6-digit format
 * @param {String} color - Hex color (#RGB or #RRGGBB)
 * @returns {String} Normalized color (#RRGGBB)
 */
const normalizeHexColor = (color) => {
  const cleaned = color.trim().toUpperCase();

  // Convert #RGB to #RRGGBB format
  if (cleaned.length === 4) {
    const r = cleaned[1];
    const g = cleaned[2];
    const b = cleaned[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return cleaned;
};

/**
 * Extracts dominant colors from detected objects
 * @param {Array} detectedObjects - Array of objects with visual_features.dominant_color
 * @param {Number} topN - Number of top colors to return (default: 2)
 * @returns {Array} Array of hex color strings (e.g., ["#8B4513", "#D2691E"])
 */
const extractDominantColors = (detectedObjects, topN = 2) => {
  // Validation: Check if input is valid
  if (!detectedObjects || !Array.isArray(detectedObjects)) {
    console.warn('[ColorExtractor] Invalid input - not an array:', typeof detectedObjects);
    return [];
  }

  if (detectedObjects.length === 0) {
    console.debug('[ColorExtractor] Empty objects array');
    return [];
  }

  // Extract colors from visual_features with validation
  const colors = [];

  detectedObjects.forEach((obj, index) => {
    // Check if object has visual_features
    if (!obj || typeof obj !== 'object') {
      console.debug(`[ColorExtractor] Object at index ${index} is not valid:`, obj);
      return;
    }

    if (!obj.visual_features) {
      console.debug(`[ColorExtractor] Object at index ${index} missing visual_features:`, obj.name || 'unknown');
      return;
    }

    if (!obj.visual_features.dominant_color) {
      console.debug(`[ColorExtractor] Object at index ${index} missing dominant_color:`, obj.name || 'unknown');
      return;
    }

    const color = obj.visual_features.dominant_color;

    // Validate color format
    if (!isValidHexColor(color)) {
      console.warn(`[ColorExtractor] Invalid color format at index ${index}:`, color);
      return;
    }

    // Normalize and add to colors array
    const normalized = normalizeHexColor(color);
    colors.push(normalized);
  });

  if (colors.length === 0) {
    console.warn('[ColorExtractor] No valid colors found in detected objects');
    return [];
  }

  console.log(`[ColorExtractor] Found ${colors.length} valid colors:`, colors);

  // Count color frequency
  const colorCounts = {};
  colors.forEach(color => {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });

  // Sort by frequency (descending) and take top N
  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .slice(0, topN)
    .map(entry => entry[0]); // Extract color strings

  console.log(`[ColorExtractor] Top ${topN} dominant colors:`, sortedColors);

  return sortedColors;
};

module.exports = {
  extractDominantColors,
  isValidHexColor,
  normalizeHexColor
};
