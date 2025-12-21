/**
 * Test script for data retention functionality
 * Run this to verify cleanup functions work correctly
 */

import * as admin from 'firebase-admin';
import {config} from '../config';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
}

/**
 * Create test data (receipts older than 3 months)
 */
async function createTestData(userId: string): Promise<TestResult> {
  try {
    const receiptsPath = `artifacts/${config.app.id}/users/${userId}/receipts`;
    const batch = db.batch();

    // Create 5 test receipts (4 months old)
    const fourMonthsAgo = new Date();
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    const testReceiptIds: string[] = [];

    for (let i = 0; i < 5; i++) {
      const receiptId = `test_receipt_${Date.now()}_${i}`;
      testReceiptIds.push(receiptId);

      const receiptRef = db.collection(receiptsPath).doc(receiptId);
      batch.set(receiptRef, {
        id: receiptId,
        userId,
        storeName: 'Test Store',
        storeNameNormalized: 'test_store',
        date: admin.firestore.Timestamp.fromDate(fourMonthsAgo),
        currency: 'USD',
        total: 50.0,
        items: [
          {
            id: `item_1`,
            name: 'Test Product',
            nameNormalized: 'test_product',
            quantity: 1,
            unitPrice: 50.0,
            totalPrice: 50.0,
            confidence: 1.0,
          },
        ],
        processingStatus: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        scannedAt: admin.firestore.Timestamp.fromDate(fourMonthsAgo),
      });
    }

    await batch.commit();

    return {
      passed: true,
      message: `Created ${testReceiptIds.length} test receipts`,
      details: {receiptIds: testReceiptIds},
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `Failed to create test data: ${error.message}`,
    };
  }
}

/**
 * Verify test receipts exist
 */
async function verifyTestDataExists(userId: string): Promise<TestResult> {
  try {
    const receiptsPath = `artifacts/${config.app.id}/users/${userId}/receipts`;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const snapshot = await db
      .collection(receiptsPath)
      .where('date', '<', admin.firestore.Timestamp.fromDate(threeMonthsAgo))
      .get();

    return {
      passed: snapshot.size > 0,
      message: `Found ${snapshot.size} old receipts`,
      details: {count: snapshot.size},
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `Failed to verify test data: ${error.message}`,
    };
  }
}

/**
 * Test manual cleanup function
 */
async function testManualCleanup(userId: string): Promise<TestResult> {
  try {
    // Import the cleanup function
    const {cleanupUserData} = require('../cleanup/dataRetention');

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(threeMonthsAgo);

    const result = await cleanupUserData(userId, cutoffTimestamp);

    return {
      passed: result.receiptsDeleted > 0,
      message: `Cleanup completed: ${result.receiptsDeleted} receipts deleted, ${result.itemsUpdated} items updated`,
      details: result,
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `Cleanup failed: ${error.message}`,
    };
  }
}

/**
 * Verify cleanup was successful
 */
async function verifyCleanup(userId: string): Promise<TestResult> {
  try {
    const receiptsPath = `artifacts/${config.app.id}/users/${userId}/receipts`;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const snapshot = await db
      .collection(receiptsPath)
      .where('date', '<', admin.firestore.Timestamp.fromDate(threeMonthsAgo))
      .get();

    return {
      passed: snapshot.size === 0,
      message: `Cleanup verified: ${snapshot.size} old receipts remaining`,
      details: {remainingCount: snapshot.size},
    };
  } catch (error: any) {
    return {
      passed: false,
      message: `Failed to verify cleanup: ${error.message}`,
    };
  }
}

/**
 * Run all tests
 */
async function runTests(userId: string) {
  console.log('🧪 Starting Data Retention Tests...\n');

  const results: {[key: string]: TestResult} = {};

  // Test 1: Create test data
  console.log('Test 1: Creating test data...');
  results.createData = await createTestData(userId);
  console.log(
    results.createData.passed ? '✅' : '❌',
    results.createData.message,
  );
  if (results.createData.details) {
    console.log('  Details:', results.createData.details);
  }
  console.log();

  if (!results.createData.passed) {
    console.error('❌ Cannot proceed without test data');
    return;
  }

  // Wait for Firestore to propagate
  console.log('⏳ Waiting for data propagation (5 seconds)...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 2: Verify test data exists
  console.log('Test 2: Verifying test data exists...');
  results.verifyData = await verifyTestDataExists(userId);
  console.log(
    results.verifyData.passed ? '✅' : '❌',
    results.verifyData.message,
  );
  console.log();

  // Test 3: Run manual cleanup
  console.log('Test 3: Running manual cleanup...');
  results.cleanup = await testManualCleanup(userId);
  console.log(
    results.cleanup.passed ? '✅' : '❌',
    results.cleanup.message,
  );
  if (results.cleanup.details) {
    console.log('  Details:', results.cleanup.details);
  }
  console.log();

  // Test 4: Verify cleanup
  console.log('Test 4: Verifying cleanup...');
  results.verifyCleanup = await verifyCleanup(userId);
  console.log(
    results.verifyCleanup.passed ? '✅' : '❌',
    results.verifyCleanup.message,
  );
  console.log();

  // Summary
  const passed = Object.values(results).every(r => r.passed);
  console.log('═══════════════════════════════════════');
  console.log(passed ? '✅ All tests passed!' : '❌ Some tests failed');
  console.log('═══════════════════════════════════════\n');

  // Detailed results
  console.log('Detailed Results:');
  Object.entries(results).forEach(([test, result]) => {
    console.log(`  ${result.passed ? '✅' : '❌'} ${test}: ${result.message}`);
  });

  return results;
}

/**
 * Main execution
 */
async function main() {
  // Get test user ID from command line or use default
  const testUserId = process.argv[2] || 'test_user_cleanup';

  console.log('╔═══════════════════════════════════════╗');
  console.log('║  Data Retention Test Suite           ║');
  console.log('╚═══════════════════════════════════════╝\n');
  console.log(`Test User ID: ${testUserId}\n`);

  try {
    const results = await runTests(testUserId);

    // Exit with appropriate code
    const allPassed = Object.values(results || {}).every(r => r.passed);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export {runTests, createTestData, verifyCleanup};
