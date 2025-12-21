/**
 * Quick test to verify migration worked
 * Run with: node test_migration.js
 */

const { PrismaClient } = require('./src/generated/client');

const prisma = new PrismaClient();

async function testMigration() {
  console.log('🧪 Testing migration...\n');

  try {
    // Test 1: Query with new fields
    console.log('Test 1: Querying ai_search_history with new fields...');
    const records = await prisma.aiSearchHistory.findMany({
      take: 3,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        session_id: true,
        query_category: true,
        avg_match_score: true,
        dominant_colors: true,
        created_at: true,
      }
    });

    console.log(`✅ Successfully queried ${records.length} records`);
    console.log('Sample record:', JSON.stringify(records[0], null, 2));

    // Test 2: Create test record with new fields
    console.log('\nTest 2: Creating test record with analytics fields...');
    const testRecord = await prisma.aiSearchHistory.create({
      data: {
        session_id: `test-${Date.now()}`,
        query_type: 'detect',
        query_category: 'Living Room',
        avg_match_score: 0.85,
        dominant_colors: ['#8B4513', '#D2691E'],
      }
    });

    console.log(`✅ Created test record with ID: ${testRecord.id}`);
    console.log('New record:', JSON.stringify({
      id: testRecord.id,
      query_category: testRecord.query_category,
      avg_match_score: testRecord.avg_match_score,
      dominant_colors: testRecord.dominant_colors,
    }, null, 2));

    // Test 3: Clean up test record
    console.log('\nTest 3: Cleaning up test record...');
    await prisma.aiSearchHistory.delete({
      where: { id: testRecord.id }
    });
    console.log('✅ Test record deleted');

    console.log('\n✅ All tests passed! Migration is working correctly.\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testMigration();
