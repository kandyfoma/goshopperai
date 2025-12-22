/**
 * Check City Items Script
 * Lists all users and their city items count
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
  console.log('\n🔍 City Items Checker');
  console.log('=' .repeat(60));

  try {
    // Get all users
    console.log('\n📋 Finding all users...\n');
    const usersSnapshot = await db
      .collection(`artifacts/${APP_ID}/users`)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ No users found in database');
      process.exit(1);
    }

    console.log(`✅ Found ${usersSnapshot.size} user(s)\n`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      console.log(`\n👤 User: ${userId}`);
      console.log(`   Name: ${userData.name || 'N/A'} ${userData.surname || ''}`);
      console.log(`   Email: ${userData.email || 'N/A'}`);
      console.log(`   City: ${userData.defaultCity || 'N/A'}`);

      // Check receipts count
      const receiptsSnapshot = await db
        .collection(`artifacts/${APP_ID}/users/${userId}/receipts`)
        .get();
      console.log(`   📄 Receipts: ${receiptsSnapshot.size}`);

      // Check items count
      const itemsSnapshot = await db
        .collection(`artifacts/${APP_ID}/users/${userId}/items`)
        .get();
      console.log(`   📦 Items: ${itemsSnapshot.size}`);

      if (itemsSnapshot.size > 0) {
        console.log(`   \n   Sample items:`);
        itemsSnapshot.docs.slice(0, 3).forEach(doc => {
          const item = doc.data();
          console.log(`   - ${item.name} (${item.prices?.length || 0} prices)`);
        });
      }

      // Check city aggregated items (if user has a city)
      if (userData.defaultCity) {
        console.log(`\n   🏙️  Checking city items for: ${userData.defaultCity}`);
        
        // Get all users from the same city
        const cityUsersSnapshot = await db
          .collection(`artifacts/${APP_ID}/users`)
          .where('defaultCity', '==', userData.defaultCity)
          .get();

        console.log(`   👥 Users in ${userData.defaultCity}: ${cityUsersSnapshot.size}`);

        // Count total items from all users in the city
        let totalCityItems = 0;
        for (const cityUserDoc of cityUsersSnapshot.docs) {
          const itemsSnap = await db
            .collection(`artifacts/${APP_ID}/users/${cityUserDoc.id}/items`)
            .get();
          totalCityItems += itemsSnap.size;
        }

        console.log(`   📦 Total items across ${userData.defaultCity}: ${totalCityItems}`);

        if (totalCityItems === 0) {
          console.log(`   ⚠️  WARNING: No items found for getCityItems to return!`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

main();
