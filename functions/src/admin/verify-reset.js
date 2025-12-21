/**
 * Verify Database Reset
 * Check if the database is truly empty
 */

const admin = require('firebase-admin');

// Initialize Firebase
const serviceAccount = require('../../../temp-logo/goshopperai-firebase-adminsdk-fbsvc-71ff750152.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();
const APP_ID = 'goshopper';

async function verifyReset() {
  console.log('\n🔍 Verifying database reset...\n');

  // Check Auth users
  const usersList = await auth.listUsers();
  console.log(`📝 Firebase Auth Users: ${usersList.users.length}`);

  // Check Firestore users
  const usersSnapshot = await db.collection(`artifacts/${APP_ID}/users`).get();
  console.log(`📝 Firestore User Documents: ${usersSnapshot.size}`);

  // Check receipts
  const receiptsSnapshot = await db.collectionGroup('receipts').get();
  console.log(`🧾 Total Receipts: ${receiptsSnapshot.size}`);

  // Check items
  const itemsSnapshot = await db.collectionGroup('items').get();
  console.log(`📦 Total Items: ${itemsSnapshot.size}`);

  // Check shopping lists
  const listsSnapshot = await db.collectionGroup('shoppingLists').get();
  console.log(`🛒 Total Shopping Lists: ${listsSnapshot.size}`);

  // Check price alerts
  const alertsSnapshot = await db.collectionGroup('priceAlerts').get();
  console.log(`🔔 Total Price Alerts: ${alertsSnapshot.size}`);

  // Check notifications
  const notificationsSnapshot = await db.collectionGroup('notifications').get();
  console.log(`📬 Total Notifications: ${notificationsSnapshot.size}`);

  // Check prices collection
  const pricesSnapshot = await db.collection('prices').get();
  console.log(`💰 Price Documents: ${pricesSnapshot.size}`);

  // Check products
  const productsSnapshot = await db.collection('products').get();
  console.log(`🏷️  Product Documents: ${productsSnapshot.size}`);

  const totalDocs = 
    usersSnapshot.size +
    receiptsSnapshot.size +
    itemsSnapshot.size +
    listsSnapshot.size +
    alertsSnapshot.size +
    notificationsSnapshot.size +
    pricesSnapshot.size +
    productsSnapshot.size;

  console.log('\n' + '='.repeat(50));
  if (totalDocs === 0 && usersList.users.length === 0) {
    console.log('✅ DATABASE IS COMPLETELY EMPTY!');
  } else {
    console.log(`⚠️  Found ${totalDocs} documents and ${usersList.users.length} users`);
  }
  console.log('='.repeat(50) + '\n');

  process.exit(0);
}

verifyReset().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
