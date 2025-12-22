/**
 * Database Diagnostic Script
 * Checks Firestore for receipt items, city fields, and user items collection
 */

const admin = require('../functions/node_modules/firebase-admin');
const serviceAccount = require('../functions/serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const APP_ID = 'goshopper';

async function main() {
  // Get the user ID from command line argument
  const userId = process.argv[2];

  if (!userId) {
    console.error('❌ Please provide user ID as argument:');
    console.error('   node scripts/debug-database.js <USER_ID>');
    process.exit(1);
  }

  console.log('\n🔍 Database Diagnostic Tool');
  console.log('=' .repeat(60));
  console.log(`📋 User ID: ${userId}\n`);

  try {
    // 1. Check user profile (try both paths)
    console.log('1️⃣ Checking user profile...');
    
    // Try new path first
    let userDoc = await db
      .doc(`artifacts/${APP_ID}/users/${userId}`)
      .get();

    let userData = null;
    let userPath = '';

    if (userDoc.exists) {
      userData = userDoc.data();
      userPath = `artifacts/${APP_ID}/users/${userId}`;
      console.log('✅ User profile found at NEW PATH:', userPath);
    } else {
      // Try old path
      console.log('⚠️ Not found at new path, trying old path...');
      userDoc = await db
        .doc(`users/${userId}`)
        .get();
      
      if (userDoc.exists) {
        userData = userDoc.data();
        userPath = `users/${userId}`;
        console.log('✅ User profile found at OLD PATH:', userPath);
      } else {
        console.log('❌ User profile not found in either location!');
        return;
      }
    }

    console.log('   - Name:', userData.displayName || 'N/A');
    console.log('   - Email:', userData.email || 'N/A');
    console.log('   - Default City:', userData.defaultCity || '❌ NOT SET');
    console.log('   - Phone Verified:', userData.phoneVerified || false);
    console.log('   - Country:', userData.countryCode || '❌ NOT SET');
    console.log('   - Is in DRC:', userData.isInDRC || false);

    // 2. Check subscription (try both paths)
    console.log('\n2️⃣ Checking subscription...');
    
    let subscriptionDoc = await db
      .doc(`artifacts/${APP_ID}/subscriptions/${userId}`)
      .get();

    let subPath = '';
    if (subscriptionDoc.exists) {
      subPath = `artifacts/${APP_ID}/subscriptions/${userId}`;
      console.log('✅ Subscription found at NEW PATH:', subPath);
    } else {
      console.log('⚠️ Not found at new subscription path, trying old...');
      subscriptionDoc = await db
        .doc(`subscriptions/${userId}`)
        .get();
      
      if (subscriptionDoc.exists) {
        subPath = `subscriptions/${userId}`;
        console.log('✅ Subscription found at OLD PATH:', subPath);
      } else {
        console.log('❌ Subscription not found in either location!');
      }
    }

    if (subscriptionDoc.exists) {
      const sub = subscriptionDoc.data();
      console.log('✅ Subscription found');
      console.log('   - Status:', sub.status);
      console.log('   - Plan ID:', sub.planId);
      console.log('   - Trial Active:', sub.status === 'trial');
      console.log('   - Trial Scans Used:', sub.trialScansUsed || 0);
      console.log('   - Trial End Date:', sub.trialEndDate?.toDate?.().toISOString() || 'N/A');
      console.log('   - Current Billing Period:');
      console.log('     • Start:', sub.currentBillingPeriodStart?.toDate?.().toISOString() || 'N/A');
      console.log('     • End:', sub.currentBillingPeriodEnd?.toDate?.().toISOString() || 'N/A');
      
      // Check if billing period expired
      if (sub.currentBillingPeriodEnd) {
        const now = new Date();
        const billingEnd = sub.currentBillingPeriodEnd.toDate();
        const needsReset = billingEnd < now;
        console.log('     • Needs Reset:', needsReset ? '⚠️ YES' : '✅ NO');
        if (needsReset) {
          const daysExpired = Math.ceil((now - billingEnd) / (1000 * 60 * 60 * 24));
          console.log('     • Days Expired:', daysExpired);
        }
      }
    }

    // 3. Check receipts
    console.log('\n3️⃣ Checking receipts...');
    const receiptsSnapshot = await db
      .collection(`artifacts/${APP_ID}/users/${userId}/receipts`)
      .orderBy('scannedAt', 'desc')
      .limit(5)
      .get();

    console.log(`✅ Found ${receiptsSnapshot.size} receipts (showing last 5)`);
    
    receiptsSnapshot.docs.forEach((doc, index) => {
      const receipt = doc.data();
      console.log(`\n   📄 Receipt ${index + 1} (${doc.id}):`);
      console.log('      - Store:', receipt.storeName || 'N/A');
      console.log('      - City:', receipt.city || '❌ NO CITY');
      console.log('      - Date:', receipt.scannedAt?.toDate?.().toISOString() || 'N/A');
      console.log('      - Total:', receipt.totalAmount, receipt.currency || 'USD');
      console.log('      - Items:', receipt.items?.length || 0);
      
      if (receipt.items && receipt.items.length > 0) {
        console.log('      - Item details:');
        receipt.items.slice(0, 3).forEach((item, i) => {
          console.log(`        ${i + 1}. ${item.name}`);
          console.log(`           - Price: ${item.unitPrice} ${item.currency || receipt.currency}`);
          console.log(`           - City: ${item.city || '❌ NO CITY'}`);
          console.log(`           - Quantity: ${item.quantity || 1}`);
        });
        if (receipt.items.length > 3) {
          console.log(`        ... and ${receipt.items.length - 3} more items`);
        }
      }
    });

    // 4. Check items collection
    console.log('\n4️⃣ Checking items collection...');
    const itemsSnapshot = await db
      .collection(`artifacts/${APP_ID}/users/${userId}/items`)
      .get();

    console.log(`${itemsSnapshot.size > 0 ? '✅' : '❌'} Found ${itemsSnapshot.size} items in collection`);
    
    if (itemsSnapshot.size > 0) {
      itemsSnapshot.docs.forEach((doc, index) => {
        const item = doc.data();
        console.log(`\n   🛒 Item ${index + 1} (${doc.id}):`);
        console.log('      - Name:', item.name);
        console.log('      - Normalized:', item.nameNormalized);
        console.log('      - Total Purchases:', item.totalPurchases || 0);
        console.log('      - Price Range:', `${item.minPrice} - ${item.maxPrice} ${item.currency}`);
        console.log('      - Stores:', item.storeCount || 0);
        console.log('      - Last Purchase:', item.lastPurchaseDate?.toDate?.().toISOString() || 'N/A');
        console.log('      - Price History:');
        if (item.prices && Array.isArray(item.prices)) {
          item.prices.slice(0, 3).forEach((p, i) => {
            console.log(`        ${i + 1}. ${p.price} ${p.currency} at ${p.storeName} (${p.receiptId})`);
          });
        }
      });
    } else if (receiptsSnapshot.size > 0) {
      console.log('\n   ⚠️ WARNING: Receipts exist but items collection is empty!');
      console.log('   This means the Cloud Function "aggregateItemsOnReceipt" is not running.');
      console.log('   Possible causes:');
      console.log('   - Cloud Function not deployed');
      console.log('   - Cloud Function failed (check Firebase Console logs)');
      console.log('   - Items have placeholder names ("Unavailable name")');
    }

    // 5. Check community database (if defaultCity is set)
    if (userData.defaultCity) {
      console.log(`\n5️⃣ Checking community database for city: ${userData.defaultCity}...`);
      
      // Find users in same city
      const cityUsersSnapshot = await db
        .collection(`artifacts/${APP_ID}/users`)
        .where('defaultCity', '==', userData.defaultCity)
        .get();

      console.log(`✅ Found ${cityUsersSnapshot.size} users in ${userData.defaultCity}`);
      
      let totalCityItems = 0;
      for (const userDoc of cityUsersSnapshot.docs) {
        const uid = userDoc.id;
        const itemsSnap = await db
          .collection(`artifacts/${APP_ID}/users/${uid}/items`)
          .get();
        totalCityItems += itemsSnap.size;
        
        if (itemsSnap.size > 0) {
          console.log(`   - User ${uid}: ${itemsSnap.size} items`);
        }
      }
      
      console.log(`\n   Total items in ${userData.defaultCity} community: ${totalCityItems}`);
      if (totalCityItems === 0) {
        console.log('   ⚠️ No items in community database yet!');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Diagnostic complete!\n');

  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
