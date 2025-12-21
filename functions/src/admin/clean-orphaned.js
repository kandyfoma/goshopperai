/**
 * Clean Orphaned Data
 * Remove orphaned receipts and items from collection groups
 */

const admin = require('firebase-admin');

const serviceAccount = require('../../../temp-logo/goshopperai-firebase-adminsdk-fbsvc-71ff750152.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanOrphanedData() {
  console.log('\n🧹 Cleaning orphaned data...\n');

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
        console.log(`Deleting ${groupName}: ${snapshot.size} documents`);
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`✅ Deleted ${groupName}`);
      }
    } catch (error) {
      console.error(`Error with ${groupName}:`, error.message);
    }
  }

  console.log('\n✅ Orphaned data cleaned!\n');
  process.exit(0);
}

cleanOrphanedData().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
