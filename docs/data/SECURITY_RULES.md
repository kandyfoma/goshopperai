# Firebase Security Rules

## Overview

Security rules enforce the **Dual Data Pipeline** architecture:

- **Public Data**: Readable by all authenticated users, writable only by admin/backend
- **Private Data**: Readable and writable only by the owning user

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Check if request has valid data
    function hasValidTimestamp() {
      return request.resource.data.timestamp == request.time;
    }

    // Validate invoice data structure
    function isValidInvoice() {
      let data = request.resource.data;
      return data.keys().hasAll(['shopName', 'date', 'total', 'currency', 'items', 'userId'])
        && data.shopName is string
        && data.shopName.size() > 0
        && data.shopName.size() <= 100
        && data.total is number
        && data.total >= 0
        && data.currency in ['USD', 'CDF']
        && data.items is list
        && data.items.size() > 0
        && data.userId == request.auth.uid;
    }

    // Validate invoice item
    function isValidInvoiceItem(item) {
      return item.keys().hasAll(['name', 'quantity', 'unitPrice', 'totalPrice'])
        && item.name is string
        && item.quantity is number
        && item.quantity > 0
        && item.unitPrice is number
        && item.totalPrice is number;
    }

    // Check subscription status (for premium features)
    function hasActiveSubscription() {
      return isAuthenticated()
        && exists(/databases/$(database)/documents/artifacts/$(appId)/users/$(request.auth.uid)/subscription/status)
        && get(/databases/$(database)/documents/artifacts/$(appId)/users/$(request.auth.uid)/subscription/status).data.isSubscribed == true;
    }

    // Check trial scans remaining
    function hasTrialScansRemaining() {
      let subDoc = get(/databases/$(database)/documents/artifacts/$(appId)/users/$(request.auth.uid)/subscription/status);
      return !exists(/databases/$(database)/documents/artifacts/$(appId)/users/$(request.auth.uid)/subscription/status)
        || subDoc.data.trialScansUsed < subDoc.data.trialScansLimit;
    }

    // ============================================
    // APP DATA - Main artifact container
    // ============================================

    match /artifacts/{appId} {
      // No direct access to artifact root
      allow read, write: if false;

      // ==========================================
      // PUBLIC DATA - Store Prices
      // ==========================================

      match /public/data/storePrices/{priceId} {
        // Anyone authenticated can read public prices
        allow read: if isAuthenticated();

        // Only backend/admin can write (via Admin SDK)
        // This blocks all client writes
        allow write: if false;
      }

      // ==========================================
      // PUBLIC DATA - Stores Directory
      // ==========================================

      match /public/data/stores/{storeId} {
        // Anyone authenticated can read store info
        allow read: if isAuthenticated();

        // Only backend/admin can write
        allow write: if false;
      }

      // ==========================================
      // PUBLIC DATA - Categories
      // ==========================================

      match /public/data/categories/{categoryId} {
        // Anyone authenticated can read categories
        allow read: if isAuthenticated();

        // Only backend/admin can write
        allow write: if false;
      }

      // ==========================================
      // PRIVATE DATA - User Invoices
      // ==========================================

      match /users/{userId}/invoices/{invoiceId} {
        // User can only read their own invoices
        allow read: if isOwner(userId);

        // User can create invoices for themselves
        allow create: if isOwner(userId)
          && isValidInvoice()
          && (hasActiveSubscription() || hasTrialScansRemaining());

        // User can update their own invoices
        allow update: if isOwner(userId)
          && isValidInvoice()
          && request.resource.data.userId == resource.data.userId; // Can't change ownership

        // User can delete their own invoices
        allow delete: if isOwner(userId);
      }

      // ==========================================
      // PRIVATE DATA - User Profile
      // ==========================================

      match /users/{userId}/profile/{docId} {
        // User can only read their own profile
        allow read: if isOwner(userId);

        // User can create/update their own profile
        allow create, update: if isOwner(userId)
          && request.resource.data.userId == userId;

        // User can delete their profile
        allow delete: if isOwner(userId);
      }

      // ==========================================
      // PRIVATE DATA - Subscription Status
      // ==========================================

      match /users/{userId}/subscription/{docId} {
        // User can read their own subscription status
        allow read: if isOwner(userId);

        // User can create initial subscription doc
        allow create: if isOwner(userId)
          && request.resource.data.userId == userId
          && request.resource.data.trialScansUsed == 0;

        // User can update trial count only (increment by 1)
        // Subscription status updates come from backend
        allow update: if isOwner(userId)
          && request.resource.data.userId == resource.data.userId
          && (
            // Allow incrementing trial scans
            (request.resource.data.trialScansUsed == resource.data.trialScansUsed + 1
              && request.resource.data.trialScansUsed <= resource.data.trialScansLimit)
            // Or no change to trial (backend updates subscription)
            || request.resource.data.trialScansUsed == resource.data.trialScansUsed
          );

        // Subscription docs cannot be deleted by users
        allow delete: if false;
      }
    }

    // ============================================
    // DENY ALL OTHER ACCESS
    // ============================================

    // Catch-all deny rule
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Cloud Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }

    function isUnder5MB() {
      return request.resource.size < 5 * 1024 * 1024;
    }

    // ============================================
    // USER RECEIPT IMAGES
    // ============================================

    match /receipts/{userId}/{imageId} {
      // User can read their own receipts
      allow read: if isOwner(userId);

      // User can upload receipts (images under 5MB)
      allow create: if isOwner(userId)
        && isImage()
        && isUnder5MB();

      // User can delete their own receipts
      allow delete: if isOwner(userId);

      // No updates (upload new instead)
      allow update: if false;
    }

    // ============================================
    // MERCHANT UPLOADS (Backend only)
    // ============================================

    match /uploads/merchants/{fileName} {
      // No client access - handled by Cloud Functions
      allow read, write: if false;
    }

    // ============================================
    // EXPORTS (Backend only)
    // ============================================

    match /exports/{userId}/{exportId} {
      // User can download their own exports
      allow read: if isOwner(userId);

      // Only backend can create exports
      allow write: if false;
    }

    // ============================================
    // DENY ALL OTHER ACCESS
    // ============================================

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Security Rules Testing

### Unit Tests

```javascript
// firestore-rules.test.js
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'invoice-intelligence-test';
const APP_ID = 'test-app';

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  // ==========================================
  // PUBLIC DATA TESTS
  // ==========================================

  describe('Public Store Prices', () => {
    it('allows authenticated users to read prices', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      const priceRef = db.doc(
        `artifacts/${APP_ID}/public/data/storePrices/price1`,
      );
      await assertSucceeds(priceRef.get());
    });

    it('denies unauthenticated users from reading prices', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      const priceRef = db.doc(
        `artifacts/${APP_ID}/public/data/storePrices/price1`,
      );
      await assertFails(priceRef.get());
    });

    it('denies client writes to prices', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      const priceRef = db.doc(
        `artifacts/${APP_ID}/public/data/storePrices/price1`,
      );
      await assertFails(priceRef.set({itemName: 'Test', price: 10}));
    });
  });

  // ==========================================
  // PRIVATE DATA TESTS
  // ==========================================

  describe('User Invoices', () => {
    it('allows users to read their own invoices', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      const invoiceRef = db.doc(
        `artifacts/${APP_ID}/users/user1/invoices/inv1`,
      );
      await assertSucceeds(invoiceRef.get());
    });

    it('denies users from reading other users invoices', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      const invoiceRef = db.doc(
        `artifacts/${APP_ID}/users/user2/invoices/inv1`,
      );
      await assertFails(invoiceRef.get());
    });

    it('allows users to create valid invoices', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      const invoiceRef = db.doc(
        `artifacts/${APP_ID}/users/user1/invoices/new-inv`,
      );

      await assertSucceeds(
        invoiceRef.set({
          userId: 'user1',
          shopName: 'Test Shop',
          date: '2025-01-01',
          total: 50.0,
          currency: 'USD',
          items: [{name: 'Item 1', quantity: 1, unitPrice: 50, totalPrice: 50}],
          timestamp: new Date(),
        }),
      );
    });

    it('denies creating invoices with wrong userId', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      const invoiceRef = db.doc(
        `artifacts/${APP_ID}/users/user1/invoices/bad-inv`,
      );

      await assertFails(
        invoiceRef.set({
          userId: 'user2', // Wrong user ID!
          shopName: 'Test Shop',
          date: '2025-01-01',
          total: 50.0,
          currency: 'USD',
          items: [{name: 'Item 1', quantity: 1, unitPrice: 50, totalPrice: 50}],
        }),
      );
    });
  });

  // ==========================================
  // SUBSCRIPTION TESTS
  // ==========================================

  describe('Subscription Status', () => {
    it('allows users to read their subscription', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      const subRef = db.doc(
        `artifacts/${APP_ID}/users/user1/subscription/status`,
      );
      await assertSucceeds(subRef.get());
    });

    it('allows incrementing trial scans by 1', async () => {
      // First, set up initial data
      await testEnv.withSecurityRulesDisabled(async context => {
        const db = context.firestore();
        await db
          .doc(`artifacts/${APP_ID}/users/user1/subscription/status`)
          .set({
            userId: 'user1',
            trialScansUsed: 2,
            trialScansLimit: 5,
          });
      });

      const db = testEnv.authenticatedContext('user1').firestore();
      const subRef = db.doc(
        `artifacts/${APP_ID}/users/user1/subscription/status`,
      );

      await assertSucceeds(
        subRef.update({
          trialScansUsed: 3, // Increment by 1
        }),
      );
    });

    it('denies incrementing trial scans by more than 1', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      const subRef = db.doc(
        `artifacts/${APP_ID}/users/user1/subscription/status`,
      );

      await assertFails(
        subRef.update({
          trialScansUsed: 5, // Jump from 2 to 5
        }),
      );
    });
  });
});
```

## Security Checklist

### Before Launch

- [ ] All security rules deployed to Firebase
- [ ] Unit tests pass for all rule scenarios
- [ ] No `allow write: if true` rules exist
- [ ] Public data is read-only for clients
- [ ] Private data enforces ownership
- [ ] File uploads validate type and size
- [ ] API keys are restricted and rotated

### Regular Audits

- [ ] Review Firebase Auth usage patterns
- [ ] Check for unusual data access patterns
- [ ] Verify no rules have been inadvertently changed
- [ ] Test rules after any schema changes

---

_Next: [Data Flow](./DATA_FLOW.md)_
