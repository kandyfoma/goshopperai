/**
 * Check ALL receipts in database
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
  console.log('\n🔍 Searching ALL receipts in database...\n');

  try {
    // Search in new path
    const usersSnapshot = await db
      .collection(`artifacts/${APP_ID}/users`)
      .get();

    let totalReceipts = 0;
    let totalItems = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      const receiptsSnapshot = await db
        .collection(`artifacts/${APP_ID}/users/${userId}/receipts`)
        .get();

      const itemsSnapshot = await db
        .collection(`artifacts/${APP_ID}/users/${userId}/items`)
        .get();

      if (receiptsSnapshot.size > 0 || itemsSnapshot.size > 0) {
        console.log(`\n👤 User: ${userId}`);
        console.log(`   Name: ${userData.name || 'N/A'}`);
        console.log(`   Email: ${userData.email || 'N/A'}`);
        console.log(`   City: ${userData.defaultCity || 'N/A'}`);
        console.log(`   📄 Receipts: ${receiptsSnapshot.size}`);
        console.log(`   📦 Items: ${itemsSnapshot.size}`);
        
        totalReceipts += receiptsSnapshot.size;
        totalItems += itemsSnapshot.size;

        if (receiptsSnapshot.size > 0) {
          console.log('\n   Recent receipts:');
          receiptsSnapshot.docs.slice(0, 5).forEach((doc, i) => {
            const receipt = doc.data();
            const date = receipt.scannedAt?.toDate() || receipt.date;
            console.log(`   ${i+1}. ${receipt.storeName || 'Unknown'} - $${receipt.total || 0} - ${date}`);
            console.log(`      Items: ${receipt.items?.length || 0}`);
          });
        }
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 TOTAL: ${totalReceipts} receipts, ${totalItems} items`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
