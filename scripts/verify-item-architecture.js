/**
 * Test script to verify the item data architecture
 * 
 * This script:
 * 1. Checks if city items exist in the master table
 * 2. Verifies the data structure is correct
 * 3. Shows summary of data in each city
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
  console.log('\n📊 ITEM DATA ARCHITECTURE VERIFICATION');
  console.log('='.repeat(60));

  try {
    // 1. Check Master City Items Table
    console.log('\n🏙️  MASTER CITY ITEMS TABLE');
    console.log('-'.repeat(40));
    
    // List all cities with items
    const cityItemsRef = db.collection(`artifacts/${APP_ID}/cityItems`);
    const cities = await cityItemsRef.listDocuments();
    
    if (cities.length === 0) {
      console.log('⚠️  No cities found in master table yet');
      console.log('   (Items will appear after users scan receipts)');
    } else {
      console.log(`Found ${cities.length} city/cities:\n`);
      
      for (const cityDoc of cities) {
        const cityName = cityDoc.id;
        const itemsSnapshot = await db
          .collection(`artifacts/${APP_ID}/cityItems/${cityName}/items`)
          .get();
        
        console.log(`📍 ${cityName}:`);
        console.log(`   Total items: ${itemsSnapshot.size}`);
        
        if (itemsSnapshot.size > 0) {
          // Show sample items
          const sampleItems = itemsSnapshot.docs.slice(0, 5);
          console.log('   Sample items:');
          for (const doc of sampleItems) {
            const data = doc.data();
            console.log(`   - ${data.name} (${data.currency} ${data.minPrice}-${data.maxPrice})`);
            console.log(`     Stores: ${data.storeCount}, Users: ${data.userCount || 'N/A'}`);
          }
          if (itemsSnapshot.size > 5) {
            console.log(`   ... and ${itemsSnapshot.size - 5} more items`);
          }
        }
        console.log();
      }
    }

    // 2. Check User Personal Items
    console.log('\n👤 USER PERSONAL ITEMS');
    console.log('-'.repeat(40));
    
    const usersSnapshot = await db.collection(`artifacts/${APP_ID}/users`).get();
    console.log(`Found ${usersSnapshot.size} users\n`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      const userItemsSnapshot = await db
        .collection(`artifacts/${APP_ID}/users/${userId}/items`)
        .get();
      
      const receiptsSnapshot = await db
        .collection(`artifacts/${APP_ID}/users/${userId}/receipts`)
        .get();
      
      console.log(`👤 User: ${userId.substring(0, 10)}...`);
      console.log(`   City: ${userData.defaultCity || 'Not set'}`);
      console.log(`   Receipts: ${receiptsSnapshot.size}`);
      console.log(`   Personal Items: ${userItemsSnapshot.size}`);
      console.log();
    }

    // 3. Architecture Summary
    console.log('\n📋 ARCHITECTURE SUMMARY');
    console.log('-'.repeat(40));
    console.log(`
Data Paths:
├── User Personal Data (deletable by user)
│   └── artifacts/${APP_ID}/users/{userId}/
│       ├── receipts/{receiptId}
│       └── items/{itemId}
│
└── Master City Items (community data - NEVER deleted by users)
    └── artifacts/${APP_ID}/cityItems/{city}/items/{itemId}

Flow:
• Scan Receipt → Updates BOTH user items AND city items
• Delete Receipt → Cleans ONLY user items (city items preserved)
`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
