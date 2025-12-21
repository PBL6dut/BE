/**
 * Room Classification Utility
 * Classifies room category based on detected object names using rule-based logic
 */

/**
 * Classifies room category from detected objects
 * @param {Array} detectedObjects - Array of objects from AI detection with 'name' field
 * @returns {String} Room category: 'Living Room', 'Bedroom', 'Kitchen', 'Dining Room', 'Office', 'Other'
 */
const classifyRoomCategory = (detectedObjects) => {
  // Validation: Check if input is valid
  if (!detectedObjects || !Array.isArray(detectedObjects)) {
    console.warn('[RoomClassifier] Invalid input - not an array:', typeof detectedObjects);
    return 'Other';
  }

  if (detectedObjects.length === 0) {
    console.warn('[RoomClassifier] Empty objects array');
    return 'Other';
  }

  // Extract object names and normalize
  const objectNames = detectedObjects
    .map(obj => {
      if (!obj.name) {
        console.debug('[RoomClassifier] Object missing name field:', obj);
        return '';
      }
      return obj.name.toLowerCase().trim();
    })
    .filter(name => name.length > 0);

  if (objectNames.length === 0) {
    console.warn('[RoomClassifier] No valid object names found');
    return 'Other';
  }

  // Log for debugging
  console.log(`[RoomClassifier] Analyzing objects: ${objectNames.join(', ')}`);

  // Priority-based classification (most specific first to avoid misclassification)

  // Living Room - sofa, couch, tv, coffee table, entertainment center
  const livingRoomKeywords = [
    'sofa', 'couch', 'sectional', 'loveseat',
    'tv', 'television', 'tv stand', 'entertainment center',
    'coffee table', 'end table', 'side table'
  ];
  if (objectNames.some(name => livingRoomKeywords.some(keyword => name.includes(keyword)))) {
    console.log('[RoomClassifier] Classified as: Living Room');
    return 'Living Room';
  }

  // Bedroom - bed, pillow, nightstand, dresser, wardrobe
  const bedroomKeywords = [
    'bed', 'pillow', 'mattress',
    'nightstand', 'night stand', 'bedside table',
    'dresser', 'wardrobe', 'closet', 'armoire'
  ];
  if (objectNames.some(name => bedroomKeywords.some(keyword => name.includes(keyword)))) {
    console.log('[RoomClassifier] Classified as: Bedroom');
    return 'Bedroom';
  }

  // Kitchen - stove, refrigerator, sink, oven, microwave
  const kitchenKeywords = [
    'stove', 'cooktop', 'range',
    'refrigerator', 'fridge', 'freezer',
    'sink', 'kitchen sink',
    'oven', 'microwave', 'dishwasher',
    'cabinet', 'kitchen cabinet', 'counter', 'countertop'
  ];
  if (objectNames.some(name => kitchenKeywords.some(keyword => name.includes(keyword)))) {
    console.log('[RoomClassifier] Classified as: Kitchen');
    return 'Kitchen';
  }

  // Dining Room - dining table, dining chair (or table + chair combo)
  const diningKeywords = ['dining table', 'dining chair', 'dining set'];
  if (objectNames.some(name => diningKeywords.some(keyword => name.includes(keyword)))) {
    console.log('[RoomClassifier] Classified as: Dining Room');
    return 'Dining Room';
  }

  // Fallback: Check for table + chair combination (but not desk)
  const hasTable = objectNames.some(name => name.includes('table') && !name.includes('coffee') && !name.includes('end') && !name.includes('side'));
  const hasChair = objectNames.some(name => name.includes('chair'));
  const hasDesk = objectNames.some(name => name.includes('desk'));

  if (hasTable && hasChair && !hasDesk) {
    console.log('[RoomClassifier] Classified as: Dining Room (table+chair combo)');
    return 'Dining Room';
  }

  // Office - desk, computer, monitor, bookshelf, office chair
  const officeKeywords = [
    'desk', 'office desk', 'writing desk',
    'computer', 'monitor', 'laptop', 'keyboard',
    'bookshelf', 'bookcase', 'shelf',
    'office chair', 'desk chair', 'swivel chair',
    'filing cabinet', 'printer'
  ];
  if (objectNames.some(name => officeKeywords.some(keyword => name.includes(keyword)))) {
    console.log('[RoomClassifier] Classified as: Office');
    return 'Office';
  }

  // Default fallback
  console.log('[RoomClassifier] No match found, classified as: Other');
  return 'Other';
};

module.exports = {
  classifyRoomCategory
};
