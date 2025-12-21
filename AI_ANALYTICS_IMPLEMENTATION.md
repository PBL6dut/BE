# AI Analytics Implementation - Deployment Guide

## ✅ Implementation Completed

Đã implement thành công 3 fields mới cho AI Search History Business Analytics:
- `query_category`: Phân loại loại phòng (Living Room, Bedroom, Kitchen, Office, Other)
- `avg_match_score`: Điểm phù hợp trung bình (0.0-1.0)
- `dominant_colors`: Top 2 màu sắc chủ đạo

---

## 📁 Files Changed/Created

### Database Schema
- ✅ [schema.prisma](schema.prisma) - Added 3 new fields to AiSearchHistory model
- ✅ [migrations/20251221_add_analytics_fields_to_ai_search_history.sql](migrations/20251221_add_analytics_fields_to_ai_search_history.sql) - Migration SQL

### Utility Functions (NEW)
- ✅ [src/utils/roomClassifier.js](src/utils/roomClassifier.js) - Room classification logic
- ✅ [src/utils/matchScoreCalculator.js](src/utils/matchScoreCalculator.js) - Average score calculator
- ✅ [src/utils/colorExtractor.js](src/utils/colorExtractor.js) - Dominant colors extractor

### API Layer Updates
- ✅ [src/controllers/ai.controller.js](src/controllers/ai.controller.js) - Updated detectObjects & getRecommendations
- ✅ [src/services/aiHistory.service.js](src/services/aiHistory.service.js) - Updated createSearchHistory & getUserHistory

### Scripts
- ✅ [scripts/backfill_analytics_fields.js](scripts/backfill_analytics_fields.js) - Backfill script for historical data

---

## 🚀 Deployment Steps

### Step 1: Apply Database Migration

**Option A: Using MySQL CLI (Recommended)**
```bash
mysql -u root -p pbl666 < migrations/20251221_add_analytics_fields_to_ai_search_history.sql
```

**Option B: Using Prisma (if MySQL upgrade issue is fixed)**
```bash
npx prisma migrate deploy
```

**Verify migration:**
```bash
mysql -u root -p pbl666 -e "DESCRIBE ai_search_history;"
```

Expected to see:
- `query_category` VARCHAR(50) NULL
- `avg_match_score` FLOAT NULL DEFAULT 0.0
- `dominant_colors` JSON NULL
- Index `ai_search_history_query_category_idx`

---

### Step 2: Restart Application

```bash
# If using npm
npm run start

# If using PM2
pm2 restart pbl6_be

# If using Docker
docker-compose restart backend
```

---

### Step 3: Test API Endpoints

**Test 1: POST /api/ai/detect**
```bash
curl -X POST http://localhost:3000/api/ai/detect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test_image.jpg"
```

Expected: Log should show `[AI Detect] Analytics - Category: Living Room, Colors: ["#8B4513"]`

**Test 2: POST /api/ai/:sessionId**
```bash
curl -X POST http://localhost:3000/api/ai/SESSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"selected_bbox": [100,100,200,200], "top_k": 5}'
```

Expected: Log should show `[AI Recommend] Average match score: 0.85`

**Test 3: GET /api/ai/history/me**
```bash
curl -X GET "http://localhost:3000/api/ai/history/me?page=1&page_size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "message": "History retrieved successfully",
  "data": {
    "total": 10,
    "page": 1,
    "page_size": 10,
    "items": [
      {
        "id": 1,
        "session_id": "uuid-here",
        "query_type": "recommend",
        "query_category": "Living Room",
        "avg_match_score": 0.85,
        "dominant_colors": ["#8B4513", "#D2691E"],
        "detected_objects_count": 5,
        "recommendations_count": 10,
        "created_at": "2025-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### Step 4: Backfill Historical Data (Optional)

Run the backfill script to update existing records:

```bash
node scripts/backfill_analytics_fields.js
```

This will:
- Find all records with NULL analytics fields
- Calculate query_category from detected_objects
- Calculate avg_match_score from recommendations
- Extract dominant_colors from detected_objects
- Update records in database

**Expected output:**
```
🚀 Starting backfill of analytics fields...

📊 Found 150 records to backfill

[1/150] Processing record ID: 1 (Session: abc-123)
  ✓ Category: Living Room
  ✓ Colors: ["#8B4513","#D2691E"]
  ✓ Avg Score: 0.85
  ✅ Updated successfully

...

============================================================
📈 Backfill Summary:
============================================================
Total records processed: 150
✅ Successfully updated: 145
❌ Errors: 0
⏭️  Skipped: 5
============================================================

✅ Backfill complete!
```

---

## 🧪 Testing Checklist

- [ ] Database migration applied successfully
- [ ] New columns exist in `ai_search_history` table
- [ ] Index created on `query_category`
- [ ] POST /api/ai/detect saves query_category and dominant_colors
- [ ] POST /api/ai/:sessionId calculates and saves avg_match_score
- [ ] GET /api/ai/history/me returns all 3 new fields
- [ ] Backfill script runs without errors
- [ ] Frontend Business Analytics tab displays data correctly
- [ ] No errors in application logs

---

## 📊 Verify Data in Database

```sql
-- Check if new columns exist
DESCRIBE ai_search_history;

-- Check sample data
SELECT
  id,
  session_id,
  query_category,
  avg_match_score,
  dominant_colors,
  created_at
FROM ai_search_history
ORDER BY created_at DESC
LIMIT 10;

-- Analytics query (for Business Analytics tab)
SELECT
  query_category,
  COUNT(*) as search_count,
  AVG(avg_match_score) as avg_score
FROM ai_search_history
WHERE query_category IS NOT NULL
GROUP BY query_category
ORDER BY search_count DESC;

-- Color preferences
SELECT
  dominant_colors,
  COUNT(*) as frequency
FROM ai_search_history
WHERE dominant_colors IS NOT NULL
GROUP BY dominant_colors
ORDER BY frequency DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Issue: Migration fails with "Column already exists"

**Solution:**
```sql
-- Check if columns already exist
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'ai_search_history'
  AND COLUMN_NAME IN ('query_category', 'avg_match_score', 'dominant_colors');
```

If columns exist, skip migration and regenerate Prisma client:
```bash
npx prisma generate
```

### Issue: Backfill script fails

**Solution:**
- Check if database connection works: `mysql -u root -p pbl666`
- Verify Prisma client is generated: `npx prisma generate`
- Run script with debug: `node scripts/backfill_analytics_fields.js 2>&1 | tee backfill.log`

### Issue: API returns NULL for new fields

**Possible causes:**
1. Prisma client not regenerated → Run `npx prisma generate`
2. Application not restarted → Restart Node.js server
3. Migration not applied → Check database schema

### Issue: Room classification always returns "Other"

**Debug:**
Check detected_objects format from AI service:
```javascript
console.log(JSON.stringify(aiData.detected_objects, null, 2));
```

Expected format:
```json
[
  {
    "name": "sofa",
    "confidence": 0.95,
    "bbox": [100, 100, 200, 200],
    "visual_features": {
      "dominant_color": "#8B4513"
    }
  }
]
```

---

## 🎯 Success Metrics

After deployment, verify:

1. **Data Coverage**: 95%+ of new searches have query_category
2. **Score Range**: avg_match_score values are between 0.0-1.0
3. **Color Format**: dominant_colors arrays contain valid hex codes
4. **Performance**: GET /api/ai/history/me responds within 200ms
5. **Frontend**: Business Analytics tab displays charts correctly

---

## 📝 Notes

- All new fields are **nullable** - existing data not affected
- Default value for avg_match_score is **0.0**
- Room classification uses **rule-based logic** (can be improved with ML later)
- Dominant colors limited to **top 2** for efficiency
- All functions handle **missing/invalid data gracefully**

---

## 🔄 Rollback Plan

If issues occur, rollback with:

```sql
-- Remove new columns
ALTER TABLE ai_search_history
DROP COLUMN query_category,
DROP COLUMN avg_match_score,
DROP COLUMN dominant_colors;

-- Remove index
DROP INDEX ai_search_history_query_category_idx ON ai_search_history;
```

Then revert code changes:
```bash
git revert HEAD
npm run start
```

---

## ✅ Deployment Complete!

Chúc mừng! Implementation đã hoàn thành. Business Analytics tab giờ đã có đủ dữ liệu để hiển thị:
- 📊 Phân tích theo danh mục phòng
- 🎨 Sở thích màu sắc
- 📈 Điểm phù hợp trung bình

Nếu có vấn đề, kiểm tra logs tại application console hoặc chạy troubleshooting steps ở trên.
