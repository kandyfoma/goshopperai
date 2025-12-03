# Infrastructure Setup

## Overview

This document outlines the cloud infrastructure required to run Invoice Intelligence, using Firebase services with optimizations for the DRC market.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE OVERVIEW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MOBILE APP (React Native + Hermes)                             │
│  ├── WatermelonDB (local SQLite)                                │
│  ├── ML Kit (offline OCR)                                       │
│  └── Image Compressor                                           │
│          │                                                       │
│          ▼                                                       │
│  FIREBASE CLOUD FUNCTIONS (europe-west1)                        │
│  ├── parseReceipt (Gemini proxy)                                │
│  ├── handlePaymentWebhook                                       │
│  ├── checkPriceAlerts                                           │
│  └── processStoreUpload                                         │
│          │                                                       │
│          ▼                                                       │
│  FIREBASE SERVICES                                               │
│  ├── Authentication (Anonymous)                                  │
│  ├── Firestore (europe-west1)                                   │
│  ├── Cloud Storage                                               │
│  └── Firebase Analytics + Crashlytics                           │
│          │                                                       │
│          ▼                                                       │
│  EXTERNAL SERVICES                                               │
│  ├── Gemini API (AI processing)                                 │
│  └── Moko Afrika (Mobile Money - DRC)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Firebase Project Configuration

### Project Creation

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Project name: `invoice-intelligence-drc`
3. Enable Google Analytics (optional but recommended)

### Regional Configuration

| Service | Region | Reason |
|---------|--------|--------|
| Firestore | `europe-west1` (Belgium) | Closest to DRC with low latency |
| Cloud Functions | `europe-west1` | Co-located with Firestore |
| Cloud Storage | `europe-west1` | Co-located for performance |

## Service Setup

### 1. Firebase Authentication

```
Configuration:
├── Sign-in providers
│   └── Anonymous ✓ (Enabled)
│
├── Settings
│   ├── User account linking: Enabled
│   └── Email enumeration protection: Enabled
│
└── Templates (customize for French)
    ├── Email verification
    ├── Password reset
    └── Email address change
```

**Why Anonymous Auth?**
- Reduces friction for new users in DRC market
- No phone verification needed (costly/unreliable)
- Can upgrade to full account later
- Persists across app sessions

### 2. Cloud Firestore

```
Database Configuration:
├── Mode: Production
├── Location: europe-west1
│
├── Indexes (auto-created + custom)
│   ├── storePrices: itemName (ASC), price (ASC)
│   ├── storePrices: storeName (ASC), uploadDate (DESC)
│   └── invoices: userId (ASC), timestamp (DESC)
│
└── Backup Schedule
    └── Daily at 02:00 UTC
```

**Collections Structure:**
```
/artifacts/{appId}/
├── public/
│   └── data/
│       ├── storePrices/          # Public price data
│       ├── stores/               # Store information
│       └── categories/           # Item categories
│
└── users/{userId}/
    ├── invoices/                 # User's scanned invoices
    ├── settings/                 # User preferences
    └── subscription/             # Subscription status
```

### 3. Cloud Storage

```
Storage Configuration:
├── Bucket: invoice-intelligence-drc.appspot.com
│
├── Folders
│   ├── /receipts/{userId}/       # User receipt images
│   ├── /uploads/merchants/       # Merchant price uploads
│   └── /exports/                 # Report exports
│
└── Lifecycle Rules
    ├── receipts: Delete after 90 days
    └── uploads: Delete after 30 days (processed)
```

### 4. Cloud Functions

```
Functions Configuration:
├── Runtime: Node.js 18
├── Region: europe-west1
├── Memory: 256MB (default), 1GB (parseReceipt)
│
├── Functions
│   ├── parseReceipt            # Gemini API proxy (rate limited)
│   ├── processStoreUpload      # Handle merchant CSV uploads
│   ├── handlePaymentWebhook    # Process payment confirmations
│   ├── checkPriceAlerts        # Firestore trigger for alerts
│   ├── generateMonthlyReport   # Scheduled report generation
│   └── cleanupOldData          # Scheduled data cleanup
│
└── Secrets (Firebase Secret Manager)
    ├── GEMINI_API_KEY
    ├── MOKO_SECRET_KEY
    └── MOKO_WEBHOOK_SECRET
```

#### parseReceipt Function (Gemini Proxy)

This is the most critical function - proxies all AI calls with security and rate limiting.

```typescript
// functions/src/parseReceipt.ts

import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as admin from 'firebase-admin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const db = admin.firestore();

// Rate limits
const LIMITS = {
  FREE: { perMinute: 10, perDay: 50 },
  PREMIUM: { perMinute: 20, perDay: 500 },
};

export const parseReceipt = functions
  .region('europe-west1')
  .runWith({ 
    memory: '1GB',
    timeoutSeconds: 60,
    secrets: ['GEMINI_API_KEY'],
  })
  .https.onCall(async (data, context) => {
    // 1. Auth check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Login required');
    }
    
    const userId = context.auth.uid;
    
    // 2. Rate limit check
    const isPremium = await checkPremiumStatus(userId);
    await enforceRateLimit(userId, isPremium);
    
    // 3. Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent([
      RECEIPT_PARSE_PROMPT,
      { inlineData: { mimeType: 'image/jpeg', data: data.imageBase64 } },
    ]);
    
    // 4. Parse and return
    const parsed = extractJSON(result.response.text());
    
    // 5. Log for analytics
    await logUsage(userId, isPremium);
    
    return { success: true, data: parsed };
  });
```

See [STACK_OPTIMIZATIONS.md](./STACK_OPTIMIZATIONS.md) for full implementation.

## Environment Configuration

### Development Environment

```bash
# .env.development
FIREBASE_PROJECT_ID=invoice-intelligence-dev
FIREBASE_API_KEY=AIza...dev
GEMINI_API_KEY=your_dev_key
MOKO_API_KEY=test_xxx
MOKO_SECRET_KEY=test_sk_xxx
MOKO_API_URL=https://sandbox.mokoafrika.com/v1
PAYMENT_MODE=test
```

### Production Environment

```bash
# .env.production
FIREBASE_PROJECT_ID=invoice-intelligence-drc
FIREBASE_API_KEY=AIza...prod
GEMINI_API_KEY=your_prod_key
MOKO_API_KEY=live_xxx
MOKO_SECRET_KEY=live_sk_xxx
MOKO_API_URL=https://api.mokoafrika.com/v1
PAYMENT_MODE=live
```

### Firebase Configuration File

```typescript
// src/shared/services/firebase/config.ts

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "invoice-intelligence-drc.firebaseapp.com",
  projectId: "invoice-intelligence-drc",
  storageBucket: "invoice-intelligence-drc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX"
};

export default firebaseConfig;
```

## Third-Party Service Setup

### Gemini API (Google AI)

1. Enable Gemini API in Google Cloud Console
2. Create API key with restrictions:
   - Application restrictions: None (mobile apps)
   - API restrictions: Generative Language API only
3. Set usage quotas to prevent abuse

```
Gemini Configuration:
├── Model: gemini-2.5-flash
├── Rate Limits
│   ├── Requests per minute: 60
│   └── Requests per day: 1000 (adjust based on users)
│
└── Safety Settings
    └── Block: NONE (receipt text is safe content)
```

### Moko Afrika Payment Gateway

Moko Afrika is a DRC-based fintech company with direct integration to local Mobile Money operators.

**Why Moko Afrika:**
- DRC-based company with local support (+243 898 900 066)
- 47M+ connected mobile money wallets
- 50M+ processed transactions
- 24-48 hour merchant onboarding
- Native CDF and USD support

1. Apply for merchant account at [mokoafrika.com/become-merchant](https://www.mokoafrika.com/en/become-merchant)
2. Complete business verification (24-48 hours)
3. Receive API credentials after approval
4. Configure Mobile Money providers:
   - M-Pesa
   - Orange Money
   - Airtel Money
   - AfriMoney

```
Moko Afrika Configuration:
├── Business Type: Mobile App
├── Contact: info@mokoafrika.com | +243 898 900 066
├── Webhook URL: https://europe-west1-invoice-intelligence-drc.cloudfunctions.net/handlePaymentWebhook
│
├── Payment Methods (DRC)
│   ├── M-Pesa: Enabled
│   ├── Orange Money: Enabled
│   ├── Airtel Money: Enabled
│   └── AfriMoney: Enabled
│
├── Currencies
│   ├── Primary: USD
│   └── Local: CDF (Congolese Franc)
│
└── API Endpoints
    ├── Sandbox: https://sandbox.mokoafrika.com/v1
    └── Production: https://api.mokoafrika.com/v1
```

## Deployment Pipeline

### CI/CD with GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy-functions:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}

  build-app:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
      - run: npm ci
      - name: Build App
        run: npm run build
      # EAS Build or manual APK generation
```

### Mobile App Distribution

```
Distribution Channels:
├── Android
│   ├── Google Play Store (primary)
│   └── Direct APK download (fallback for DRC)
│
├── iOS
│   └── App Store
│
└── Web (PWA)
    └── Firebase Hosting
```

## Monitoring & Analytics

### Firebase Analytics Events

```typescript
// Key events to track
const analyticsEvents = {
  // User journey
  'app_open': {},
  'sign_up_complete': {},
  
  // Core features
  'scan_started': {},
  'scan_completed': { item_count: number },
  'scan_failed': { error_type: string },
  
  // Comparison
  'price_comparison_viewed': { item_id: string },
  'best_price_clicked': { store_id: string },
  
  // Monetization
  'paywall_shown': { trigger: string },
  'subscription_started': { plan: string },
  'payment_completed': { amount: number, method: string },
  'payment_failed': { error: string },
  
  // Engagement
  'report_viewed': { report_type: string },
};
```

### Error Monitoring (Crashlytics)

```
Crashlytics Configuration:
├── Enabled: true
├── NDK crashes: true
│
└── Custom Keys
    ├── user_subscription_status
    ├── scan_count
    └── last_payment_date
```

### Performance Monitoring

```
Performance Traces:
├── scan_to_save_flow
├── gemini_api_call
├── firestore_query
└── payment_flow
```

## Cost Estimation (Monthly)

| Service | Free Tier | Estimated Usage | Cost |
|---------|-----------|-----------------|------|
| Firebase Auth | 10K/month | 5K users | $0 |
| Firestore | 1GB storage, 50K reads/day | 2GB, 100K reads | ~$5 |
| Cloud Storage | 5GB | 10GB (compressed images) | ~$2 |
| Cloud Functions | 2M invocations | 500K | $0 |
| Gemini API | 60 req/min | 30K scans | ~$15 |
| **Total** | | | **~$22/month** |

*Costs scale with user growth. Image compression saves significant bandwidth costs for users.*

### Cost Optimization Notes

| Optimization | Savings |
|--------------|---------|
| Image compression (90%) | Reduces storage costs by 90% |
| Gemini proxy caching | Reduces API calls by ~20% for common items |
| WatermelonDB local queries | Reduces Firestore reads by ~50% |
| Rate limiting | Prevents abuse, controls API costs |

## Backup & Recovery

### Automated Backups

```
Firestore Backup:
├── Schedule: Daily at 02:00 UTC
├── Retention: 30 days
└── Storage: Cloud Storage bucket

Recovery Process:
1. Identify backup timestamp
2. Create new Firestore instance
3. Import from backup
4. Update app configuration
5. Verify data integrity
```

### Disaster Recovery Plan

| Scenario | RTO | RPO | Action |
|----------|-----|-----|--------|
| Data corruption | 4 hours | 24 hours | Restore from backup |
| Region outage | 24 hours | 24 hours | Deploy to new region |
| Service compromise | 2 hours | 0 | Rotate credentials, audit |

---

*Next: [Data Models](../data/DATA_MODELS.md)*
