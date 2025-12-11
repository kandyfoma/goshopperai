# System Architecture

## Overview

Invoice Intelligence uses a **Serverless-First Mobile Stack** with a **Dual Data Pipeline**, optimized for the DRC market conditions (low-end devices, poor connectivity, data cost concerns):

- **Public Pipeline**: Store-uploaded price data for comparison
- **Private Pipeline**: User-scanned invoices for personal reports
- **Offline-First**: WatermelonDB for local data + Firestore sync
- **Optimized Client**: Hermes engine + image compression

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                        │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                React Native Application (Hermes Engine)                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────────┐ ┌──────────────┐  │  │
│  │  │  Camera  │ │   UI     │ │WatermelonDB│ │   Image    │ │   ML Kit     │  │  │
│  │  │  Module  │ │Components│ │ (Offline) │ │ Compressor │ │ (OCR Backup) │  │  │
│  │  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └──────┬─────┘ └──────┬───────┘  │  │
│  └───────┼────────────┼─────────────┼──────────────┼──────────────┼──────────┘  │
└──────────┼────────────┼─────────────┼──────────────┼──────────────┼─────────────┘
           │            │             │              │              │
           │            │             │              │              │
           ▼            ▼             ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CLOUD FUNCTIONS LAYER (Proxy)                            │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │   Gemini Proxy      │  │   Payment Webhook   │  │   Price Cache           │  │
│  │   • Rate limiting   │  │   • Moko Afrika     │  │   • Common items        │  │
│  │   • API key secure  │  │   • Subscription    │  │   • Reduce API calls    │  │
│  │   • Usage analytics │  │   • Trial tracking  │  │                         │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └─────────────┬───────────┘  │
└─────────────┼────────────────────────┼───────────────────────────┼──────────────┘
              │                        │                           │
              ▼                        ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            EXTERNAL SERVICES                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │   Gemini API    │  │  Firebase Auth  │  │    Payment Gateway              │  │
│  │ (gemini-2.5-    │  │  (Anonymous +   │  │  (Moko Afrika - DRC)            │  │
│  │    flash)       │  │   Device Link)  │  │  M-Pesa, Orange, Airtel, Afri   │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────────┘  │
└───────────┼────────────────────┼─────────────────────────┼──────────────────────┘
            │                    │                         │
            ▼                    ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                            │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                        Cloud Firestore                                     │  │
│  │                                                                            │  │
│  │  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐ │  │
│  │  │   PUBLIC DATA           │  │      PRIVATE DATA                       │ │  │
│  │  │   /storePrices          │  │   /users/{userId}/invoices              │ │  │
│  │  │   /stores               │  │   /users/{userId}/priceAlerts           │ │  │
│  │  │   /categories           │  │   /users/{userId}/shoppingLists         │ │  │
│  │  │   /itemCache            │  │   /users/{userId}/settings              │ │  │
│  │  └─────────────────────────┘  └─────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                     Cloud Storage (Firebase)                               │  │
│  │   • Compressed receipt images                                              │  │
│  │   • Merchant price uploads (CSV/Excel)                                     │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Client Layer (React Native + Hermes)

The mobile application handles all user interactions with optimizations for DRC market.

| Component        | Technology                 | Responsibility                         |
| ---------------- | -------------------------- | -------------------------------------- |
| Core Framework   | React Native + Hermes      | Cross-platform UI (53% faster startup) |
| UI Styling       | NativeWind (Tailwind)      | Consistent styling                     |
| Camera Module    | expo-camera                | Receipt capture                        |
| Image Processing | react-native-image-resizer | 90% compression before upload          |
| Offline Database | WatermelonDB               | Complex offline queries                |
| Fallback OCR     | ML Kit Text Recognition    | Basic offline scanning                 |
| State Management | Zustand                    | App state                              |
| Charts           | react-native-chart-kit     | Report visualizations                  |
| Navigation       | React Navigation           | Screen routing                         |

### 2. Cloud Functions Layer (NEW)

Proxy layer for security, caching, and rate limiting.

| Function               | Purpose                           | Trigger           |
| ---------------------- | --------------------------------- | ----------------- |
| `parseReceipt`         | Proxy Gemini API calls            | HTTPS Callable    |
| `handlePaymentWebhook` | Process Moko Afrika confirmations | HTTPS             |
| `checkPriceAlerts`     | Notify users of price drops       | Firestore trigger |
| `processStoreUpload`   | Validate merchant CSV uploads     | Storage trigger   |
| `cleanupOldData`       | Remove expired data               | Scheduled (daily) |

#### Gemini Proxy Benefits

- ✅ API key never exposed to client
- ✅ Per-user rate limiting (10/min, 50/day free, 500/day premium)
- ✅ Cache common item categories
- ✅ Usage analytics and cost tracking
- ✅ Standardized error handling

### 3. Service Layer

External services that process data and handle authentication.

#### Gemini AI Parser (via Proxy)

- **Purpose**: Convert receipt images to structured JSON
- **Method**: Cloud Function proxy (not direct client call)
- **Model**: gemini-2.5-flash
- **Input**: Compressed JPEG (max 1024x1536, ~300KB)

#### Firebase Authentication

- **Method**: Anonymous sign-in (device-linked)
- **Features**:
  - No email/password required initially
  - Can upgrade to full account later
  - Persistent across app reinstalls

#### Payment Gateway (Moko Afrika)

- **Purpose**: Process Mobile Money subscriptions
- **Provider**: Moko Afrika (DRC-based, 47M+ wallets)
- **Supported**: M-Pesa, Orange Money, Airtel Money, AfriMoney
- **Flow**: API integration with webhook confirmation
- **Contact**: info@mokoafrika.com | +243 898 900 066

### 4. Data Layer

#### Cloud Firestore

- Real-time database with offline support
- Separate collections for public vs private data
- Security rules enforce data isolation

#### WatermelonDB (NEW - Local)

- SQLite-based local database
- Complex offline queries (aggregations, joins)
- Sync with Firestore when online
- Used for: invoices, shopping lists, reports

#### Cloud Storage

- Compressed receipt images only
- Merchant bulk upload processing
- 90-day retention policy

## Data Flow Diagrams

### Flow 1: Invoice Scanning (Optimized)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │  Camera  │    │ Compress │    │  Cloud   │    │ Validate │    │ Save to  │
│  Taps    │───▶│  Capture │───▶│  Image   │───▶│ Function │───▶│  Screen  │───▶│ Local +  │
│  Scan    │    │  Photo   │    │ (90%)    │    │ (Gemini) │    │  (Edit)  │    │ Firestore│
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                     │                               │
                                     │         OFFLINE?              │
                                     │              │                │
                                     ▼              ▼                ▼
                              ┌──────────┐    ┌──────────┐    ┌──────────┐
                              │  ML Kit  │───▶│  Basic   │───▶│ Queue    │
                              │   OCR    │    │  Parse   │    │ for Sync │
                              └──────────┘    └──────────┘    └──────────┘
```

**Detailed Steps:**

1. User opens camera and captures receipt photo
2. Image compressed to ~300KB (saves user data costs)
3. **If online**: Cloud Function proxies to Gemini API
4. **If offline**: ML Kit extracts text, basic parser runs locally
5. User reviews and corrects any errors
6. Data saved to WatermelonDB (local) + Firestore (cloud)

### Flow 2: Price Comparison (Public)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │ Firestore│    │  Compare │    │  Display │
│  Views   │───▶│  Query   │───▶│  Logic   │───▶│  Best    │
│  Prices  │    │ (Public) │    │          │    │  Prices  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**Detailed Steps:**

1. User navigates to comparison view
2. App queries public storePrices collection
3. Groups prices by item, sorts by price
4. Displays best price with store name and date

### Flow 3: Store Price Upload (Merchant Portal)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Merchant │    │  Upload  │    │ Firebase │    │Firestore │
│  Portal  │───▶│ CSV/Excel│───▶│ Function │───▶│ (Public) │
│          │    │          │    │ Sanitize │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

**Detailed Steps:**

1. Merchant accesses secure upload portal
2. Uploads price list (CSV/Excel format)
3. Firebase Function validates and sanitizes data
4. Clean data written to public collection

### Flow 4: Subscription Payment

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Paywall  │    │ Payment  │    │  Mobile  │    │ Webhook  │    │  Update  │
│ Appears  │───▶│  SDK     │───▶│  Money   │───▶│ Confirm  │───▶│  Status  │
│          │    │          │    │  (User)  │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

## Infrastructure Requirements

### Firebase Project Setup

```
Firebase Project: invoice-intelligence-drc
├── Authentication
│   └── Sign-in providers: Anonymous
├── Firestore Database
│   ├── Location: europe-west1 (closest to DRC)
│   └── Mode: Production
├── Cloud Storage
│   └── Bucket: invoice-intelligence-drc.appspot.com
└── Cloud Functions
    └── Runtime: Node.js 18
```

### Environment Configuration

```
# Required Environment Variables
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=invoice-intelligence-drc
MOKO_API_KEY=your_moko_api_key
MOKO_SECRET_KEY=your_moko_secret_key
MOKO_API_URL=https://api.mokoafrika.com/v1
```

## Scalability Considerations

### Current Design (MVP) - Optimized

- Gemini calls routed through Cloud Functions (secure + rate limited)
- Image compression reduces bandwidth 90%
- WatermelonDB handles offline-first with sync
- Hermes engine for 2x faster startup

### Future Scaling Options

1. **CDN**: Cache public price data at edge locations
2. **Sharding**: Partition data by region if expanding beyond DRC
3. **Price Alert Workers**: Separate function for high-volume alert checking
4. **Read Replicas**: For high-traffic price comparison queries

## Security Architecture

See [SECURITY_RULES.md](../data/SECURITY_RULES.md) for detailed Firestore rules.

### Key Security Principles

1. **Data Isolation**: Private user data never exposed to other users
2. **Authentication Required**: All data access requires Firebase Auth
3. **Write Restrictions**: Public data only writeable via secure backend
4. **API Key Protection**: Gemini key stored in Cloud Functions secrets only
5. **Rate Limiting**: Per-user limits prevent abuse (10/min, 50/day free)

## Performance Optimizations

| Optimization          | Implementation                       | Impact                  |
| --------------------- | ------------------------------------ | ----------------------- |
| **Hermes Engine**     | `enableHermes: true` in build.gradle | 53% faster startup      |
| **Image Compression** | react-native-image-resizer           | 90% smaller uploads     |
| **Gemini Proxy**      | Cloud Functions                      | Secure + cached         |
| **WatermelonDB**      | Local SQLite                         | Instant offline queries |
| **ML Kit Fallback**   | On-device OCR                        | Works without internet  |

See [STACK_OPTIMIZATIONS.md](./STACK_OPTIMIZATIONS.md) for detailed implementation guides.

---

_Next: [Component Architecture](./COMPONENT_ARCHITECTURE.md)_
