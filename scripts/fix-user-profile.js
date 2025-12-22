/**
 * Fix User Profile Script
 * Manually sets up user profile and subscription if they're missing
 */

const admin = require('../functions/node_modules/firebase-admin');
const serviceAccount = require('../functions/serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const APP_ID = 'goshopper';

async function main() {
  // Get the user ID from command line argument
  const userId = process.argv[2];
  const defaultCity = process.argv[3] || 'Lubumbashi';

  if (!userId) {
    console.error('❌ Please provide user ID as argument:');
    console.error('   node scripts/fix-user-profile.js <USER_ID> [CITY]');
    console.error('   Example: node scripts/fix-user-profile.js D7q15AKABWVUmpt7pTFh4VRc3Oc2 Lubumbashi');
    process.exit(1);
  }

  console.log('\n🔧 Fix User Profile & Subscription');
  console.log('=' .repeat(60));
  console.log(`📋 User ID: ${userId}`);
  console.log(`📍 Default City: ${defaultCity}\n`);

  try {
    const userPath = `artifacts/${APP_ID}/users/${userId}`;
    const subscriptionPath = `artifacts/${APP_ID}/subscriptions/${userId}`;

    // 1. Fix user profile
    console.log('1️⃣ Fixing user profile...');
    await db.doc(userPath).set(
      {
        defaultCity,
        countryCode: 'CD',
        isInDRC: true,
        phoneVerified: true,
        verifiedAt: admin.firestore.Timestamp.now(),
        profileCompleted: true,
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );
    console.log('✅ User profile updated with:');
    console.log('   - defaultCity:', defaultCity);
    console.log('   - countryCode: CD');
    console.log('   - isInDRC: true');
    console.log('   - phoneVerified: true');

    // 2. Create subscription if missing
    console.log('\n2️⃣ Creating/fixing subscription...');
    
    // Calculate trial dates
    const now = new Date();
    const trialStart = now;
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 60); // 60 days trial

    // Calculate monthly billing period
    const billingPeriodStart = now;
    const billingPeriodEnd = new Date(now);
    billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);

    await db.doc(subscriptionPath).set({
      userId,
      status: 'trial',
      planId: 'free',
      isSubscribed: false,
      trialStartDate: admin.firestore.Timestamp.fromDate(trialStart),
      trialEndDate: admin.firestore.Timestamp.fromDate(trialEnd),
      trialScansUsed: 0,
      monthlyScansUsed: 0,
      currentBillingPeriodStart: admin.firestore.Timestamp.fromDate(billingPeriodStart),
      currentBillingPeriodEnd: admin.firestore.Timestamp.fromDate(billingPeriodEnd),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    }, { merge: true });

    console.log('✅ Subscription created/updated:');
    console.log('   - Status: trial');
    console.log('   - Plan: free');
    console.log('   - Trial End:', trialEnd.toISOString());
    console.log('   - Trial Scans Used: 0');
    console.log('   - Billing Period Start:', billingPeriodStart.toISOString());
    console.log('   - Billing Period End:', billingPeriodEnd.toISOString());

    // 3. Update existing receipts with city
    console.log('\n3️⃣ Updating existing receipts with city...');
    const receiptsSnapshot = await db
      .collection(`artifacts/${APP_ID}/users/${userId}/receipts`)
      .get();

    if (receiptsSnapshot.size > 0) {
      const batch = db.batch();
      let updatedCount = 0;

      for (const doc of receiptsSnapshot.docs) {
        const receipt = doc.data();
        
        // Update receipt city
        batch.update(doc.ref, {
          city: defaultCity,
        });

        // Update items cities
        if (receipt.items && Array.isArray(receipt.items)) {
          const updatedItems = receipt.items.map(item => ({
            ...item,
            city: defaultCity,
          }));
          batch.update(doc.ref, {
            items: updatedItems,
          });
        }

        updatedCount++;
      }

      await batch.commit();
      console.log(`✅ Updated ${updatedCount} receipts with city: ${defaultCity}`);
    } else {
      console.log('⚠️ No receipts found to update');
    }

    // 4. Rebuild items collection
    console.log('\n4️⃣ Rebuilding items collection...');
    const itemsSnapshot = await db
      .collection(`artifacts/${APP_ID}/users/${userId}/items`)
      .get();

    if (itemsSnapshot.size > 0) {
      const batch = db.batch();
      itemsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${itemsSnapshot.size} old items`);
    }

    // Trigger rebuild by touching each receipt
    console.log('   Triggering item aggregation...');
    const receipts = await db
      .collection(`artifacts/${APP_ID}/users/${userId}/receipts`)
      .get();

    if (receipts.size > 0) {
      const batch = db.batch();
      receipts.docs.forEach(doc => {
        batch.update(doc.ref, {
          updatedAt: admin.firestore.Timestamp.now(),
        });
      });
      await batch.commit();
      console.log(`✅ Triggered aggregation for ${receipts.size} receipts`);
      console.log('   ⏳ Wait 10-30 seconds for Cloud Functions to process...');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Profile and subscription fixed!');
    console.log('\n📱 Next steps:');
    console.log('   1. Close and reopen the app');
    console.log('   2. Check if dashboard shows correct data');
    console.log('   3. Try scanning a new receipt');
    console.log('   4. Check if items appear in community database\n');

  } catch (error) {
    console.error('❌ Error fixing profile:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
