/**
 * Backfill Script for AI Search History Analytics Fields
 *
 * This script updates existing records in ai_search_history table with:
 * - query_category (Living Room, Bedroom, etc.)
 * - avg_match_score (average similarity score)
 * - dominant_colors (top 2 colors)
 *
 * Run with: node scripts/backfill_analytics_fields.js
 */

const { PrismaClient } = require('../src/generated/client');
const { classifyRoomCategory } = require('../src/utils/roomClassifier');
const { extractDominantColors } = require('../src/utils/colorExtractor');
const { calculateAvgMatchScore } = require('../src/utils/matchScoreCalculator');

const prisma = new PrismaClient();

async function backfillAnalyticsFields() {
  console.log('🚀 Starting backfill of analytics fields...\n');

  try {
    // Find all records that need backfilling
    const records = await prisma.aiSearchHistory.findMany({
      where: {
        OR: [
          { query_category: null },
          { avg_match_score: null },
          { dominant_colors: null }
        ]
      },
      orderBy: { created_at: 'desc' }
    });

    console.log(`📊 Found ${records.length} records to backfill\n`);

    if (records.length === 0) {
      console.log('✅ No records need backfilling. All done!');
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const updates = {};

      console.log(`\n[${i + 1}/${records.length}] Processing record ID: ${record.id} (Session: ${record.session_id})`);

      try {
        // Backfill query_category
        if (!record.query_category && record.detected_objects) {
          const category = classifyRoomCategory(record.detected_objects);
          updates.query_category = category;
          console.log(`  ✓ Category: ${category}`);
        }

        // Backfill dominant_colors
        if (!record.dominant_colors && record.detected_objects) {
          const colors = extractDominantColors(record.detected_objects);
          updates.dominant_colors = colors;
          console.log(`  ✓ Colors: ${JSON.stringify(colors)}`);
        }

        // Backfill avg_match_score
        if ((!record.avg_match_score || record.avg_match_score === 0) && record.recommendations) {
          const score = calculateAvgMatchScore(record.recommendations);
          if (score > 0) {
            updates.avg_match_score = score;
            console.log(`  ✓ Avg Score: ${score}`);
          }
        }

        // Update database if there are changes
        if (Object.keys(updates).length > 0) {
          await prisma.aiSearchHistory.update({
            where: { id: record.id },
            data: updates
          });
          updatedCount++;
          console.log(`  ✅ Updated successfully`);
        } else {
          console.log(`  ⏭️  No updates needed`);
        }

      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error processing record ${record.id}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Backfill Summary:');
    console.log('='.repeat(60));
    console.log(`Total records processed: ${records.length}`);
    console.log(`✅ Successfully updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏭️  Skipped: ${records.length - updatedCount - errorCount}`);
    console.log('='.repeat(60));

    console.log('\n✅ Backfill complete!\n');

  } catch (error) {
    console.error('\n❌ Fatal error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillAnalyticsFields()
  .then(() => {
    console.log('👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Backfill failed:', error);
    process.exit(1);
  });
