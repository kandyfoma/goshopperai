/**
 * Database Reset Script
 * ⚠️ DANGEROUS: Deletes ALL data including users, receipts, prices, etc.
 * Use ONLY for testing/development environments
 * 
 * Run with: node functions/src/admin/reset-database.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../../../temp-logo/goshopperai-firebase-adminsdk-fbsvc-71ff750152.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    console.log('\nMake sure the service account key exists');
    process.exit(1);
  }
}

const db = admin.firestore();
const auth = admin.auth();
const APP_ID = 'goshopper';

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
}

async function deleteQueryBatch(query, resolve, reject) {
  try {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`  Deleted ${snapshot.size} documents`);

    // Recurse on the next process tick
    process.nextTick(() => {
      deleteQueryBatch(query, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

async function deleteAllUsers() {
  console.log('\n🔥 Deleting all users from Firebase Auth...');
  
  let pageToken;
  let totalDeleted = 0;

  do {
    const listUsersResult = await auth.listUsers(1000, pageToken);
    
    for (const userRecord of listUsersResult.users) {
      try {
        await auth.deleteUser(userRecord.uid);
        totalDeleted++;
        if (totalDeleted % 10 === 0) {
          console.log(`  Deleted ${totalDeleted} users...`);
        }
      } catch (error) {
        console.error(`  Failed to delete user ${userRecord.uid}:`, error.message);
      }
    }

    pageToken = listUsersResult.pageToken;
  } while (pageToken);

  console.log(`✅ Total users deleted: ${totalDeleted}`);
}

async function deleteUserData() {
  console.log('\n🗑️  Deleting all user data from Firestore...');
  
  const usersPath = `artifacts/${APP_ID}/users`;
  const usersSnapshot = await db.collection(usersPath).get();
  
  console.log(`Found ${usersSnapshot.size} user documents`);

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    console.log(`\n  Processing user: ${userId}`);

    // Delete subcollections
    const subcollections = [
      'receipts',
      'items',
      'shops',
      'shoppingLists',
      'priceAlerts',
      'notifications',
      'payments',
      'subscription'
    ];

    for (const subcol of subcollections) {
      const subcolPath = `${usersPath}/${userId}/${subcol}`;
      try {
        const subSnapshot = await db.collection(subcolPath).get();
        if (subSnapshot.size > 0) {
          console.log(`    Deleting ${subcol}: ${subSnapshot.size} docs`);
          await deleteCollection(subcolPath);
        }
      } catch (error) {
        console.error(`    Error deleting ${subcol}:`, error.message);
      }
    }

    // Delete user document itself
    await userDoc.ref.delete();
    console.log(`    ✅ User document deleted`);
  }
}

async function deleteCommunityData() {
  console.log('\n🌍 Deleting community data...');

  // Delete public prices
  try {
    const pricesPath = `artifacts/${APP_ID}/public/prices`;
    const pricesSnapshot = await db.collection(pricesPath).get();
    if (pricesSnapshot.size > 0) {
      console.log(`  Deleting public prices: ${pricesSnapshot.size} docs`);
      await deleteCollection(pricesPath);
    }
  } catch (error) {
    console.error('  Error deleting prices:', error.message);
  }

  // Delete public stores
  try {
    const storesPath = `artifacts/${APP_ID}/public/stores`;
    const storesSnapshot = await db.collection(storesPath).get();
    if (storesSnapshot.size > 0) {
      console.log(`  Deleting public stores: ${storesSnapshot.size} docs`);
      await deleteCollection(storesPath);
    }
  } catch (error) {
    console.error('  Error deleting stores:', error.message);
  }

  // Delete alternative public data structure
  try {
    const altStoresPath = `artifacts/${APP_ID}/public/data/stores`;
    const altStoresSnapshot = await db.collection(altStoresPath).get();
    if (altStoresSnapshot.size > 0) {
      console.log(`  Deleting alt stores: ${altStoresSnapshot.size} docs`);
      await deleteCollection(altStoresPath);
    }
  } catch (error) {
    console.error('  Error deleting alt stores:', error.message);
  }
}

async function deleteOtherCollections() {
  console.log('\n🧹 Checking for other collections and orphaned data...');

  // Delete orphaned collection group data
  const collectionGroups = [
    'receipts',
    'items',
    'shops',
    'shoppingLists',
    'priceAlerts',
    'notifications',
    'payments',
    'subscription'
  ];

  for (const groupName of collectionGroups) {
    try {
      const snapshot = await db.collectionGroup(groupName).get();
      if (snapshot.size > 0) {
        console.log(`  Deleting orphaned ${groupName}: ${snapshot.size} docs`);
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
    } catch (error) {
      console.error(`  Error checking ${groupName}:`, error.message);
    }
  }

  // List of additional collections that might exist
  const otherCollections = [
    'prices',
    'products',
    'masterProducts',
    'productMappings',
    'webhooks',
    'refunds'
  ];

  for (const colName of otherCollections) {
    try {
      const snapshot = await db.collection(colName).get();
      if (snapshot.size > 0) {
        console.log(`  Deleting ${colName}: ${snapshot.size} docs`);
        await deleteCollection(colName);
      }
    } catch (error) {
      console.error(`  Error checking ${colName}:`, error.message);
    }
  }
}

async function resetDatabase() {
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  DATABASE RESET SCRIPT ⚠️');
  console.log('='.repeat(60));
  console.log('\nThis will DELETE ALL DATA including:');
  console.log('  • All users from Firebase Auth');
  console.log('  • All user data (receipts, items, lists, alerts, etc.)');
  console.log('  • All community data (prices, stores)');
  console.log('  • All other collections');
  console.log('\n❗ THIS CANNOT BE UNDONE ❗');
  console.log('='.repeat(60));

  const confirm1 = await question('\nType "DELETE_EVERYTHING" to continue: ');
  
  if (confirm1 !== 'DELETE_EVERYTHING') {
    console.log('\n✅ Operation cancelled. Data is safe.');
    rl.close();
    return;
  }

  const confirm2 = await question('\nAre you absolutely sure? Type "YES" to proceed: ');
  
  if (confirm2 !== 'YES') {
    console.log('\n✅ Operation cancelled. Data is safe.');
    rl.close();
    return;
  }

  console.log('\n🚀 Starting database reset...\n');
  const startTime = Date.now();

  try {
    // Step 1: Delete all user data from Firestore
    await deleteUserData();

    // Step 2: Delete community data
    await deleteCommunityData();

    // Step 3: Delete other collections
    await deleteOtherCollections();

    // Step 4: Delete all users from Auth (do this last)
    await deleteAllUsers();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE RESET COMPLETE!');
    console.log('='.repeat(60));
    console.log(`⏱️  Total time: ${duration}s`);
    console.log('\n✨ Your database is now clean and empty!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error during reset:', error);
    console.error('\nSome data may have been partially deleted.');
  }

  rl.close();
  process.exit(0);
}

// Run the reset
resetDatabase().catch(error => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});
