# Dual Data Source Architecture

## Overview

Invoice Intelligence has **two distinct data sources** with different purposes, visibility, and insertion methods:

| Source | Who Inserts | Data Type | Purpose | Visibility |
|--------|-------------|-----------|---------|------------|
| **User Scan** | Consumer (app user) | Private Invoice | Personal tracking, budgeting, reports | Only the user who scanned |
| **Shop Upload** | Merchant/Store | Public Prices | Price comparison database | All authenticated users |

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCE ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   USER DATA (Private)                    SHOP DATA (Public)                  │
│   ─────────────────────                  ─────────────────────               │
│                                                                              │
│   ┌─────────────────┐                    ┌─────────────────┐                │
│   │  Consumer App   │                    │  Merchant Portal│                │
│   │   (React Native)│                    │   (Web App)     │                │
│   └────────┬────────┘                    └────────┬────────┘                │
│            │                                      │                          │
│            ▼                                      ▼                          │
│   ┌─────────────────┐                    ┌─────────────────┐                │
│   │  Scan Receipt   │                    │  Upload CSV/    │                │
│   │  (Camera/AI)    │                    │  Enter Prices   │                │
│   └────────┬────────┘                    └────────┬────────┘                │
│            │                                      │                          │
│            ▼                                      ▼                          │
│   ┌─────────────────┐                    ┌─────────────────┐                │
│   │  /users/{uid}/  │                    │  /public/data/  │                │
│   │  invoices/      │                    │  storePrices/   │                │
│   │  (PRIVATE)      │                    │  (PUBLIC)       │                │
│   └─────────────────┘                    └─────────────────┘                │
│            │                                      │                          │
│            ▼                                      ▼                          │
│   ┌─────────────────┐                    ┌─────────────────┐                │
│   │ • Spending track│                    │ • Price compare │                │
│   │ • Personal rpts │                    │ • Best deals    │                │
│   │ • Budget alerts │                    │ • Store search  │                │
│   └─────────────────┘                    └─────────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 1: User Data Flow (Private)

### Purpose
- **Personal spending tracking**
- **Monthly/weekly reports**
- **Price history for individual user**
- **Budget management**
- **Receipt archival** (no more lost receipts!)

### Who Inserts
- End consumers via the mobile app
- Data is scanned from physical receipts using AI

### Data Model

```typescript
// Collection: /artifacts/{appId}/users/{userId}/invoices/{invoiceId}
interface UserInvoice {
  id: string;
  userId: string;              // Owner of this data
  
  // Invoice Details
  shopName: string;            // Where they shopped
  shopAddress?: string;
  date: string;                // Date of purchase
  total: number;
  currency: 'USD' | 'CDF';
  
  // Line Items
  items: UserInvoiceItem[];
  
  // Metadata
  timestamp: Timestamp;        // When scanned
  imageUrl?: string;           // Receipt photo backup
  scanMethod: 'camera' | 'gallery' | 'manual';
  
  // Privacy: This data is NEVER shared with other users
}

interface UserInvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
}
```

### Security Rules (Private Data)

```javascript
// Only the owner can read/write their invoices
match /users/{userId}/invoices/{invoiceId} {
  allow read, write: if request.auth.uid == userId;
}
```

---

## Part 2: Shop Data Flow (Public)

### Purpose
- **Public price comparison database**
- **Help consumers find best prices**
- **Store discovery**
- **Market price intelligence**

### Who Inserts
- **Merchants/Store owners** via dedicated portal
- **System admin** for data quality control
- **NOT inserted by regular users**

### Insertion Methods

#### Method A: Merchant Web Portal
```
┌─────────────────────────────────────────────────────────────────┐
│                    MERCHANT PORTAL                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Store: [Shoprite Gombe          ▼]                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CURRENT PRICES                                          │   │
│  ├──────────────────┬─────────┬──────────┬─────────────────┤   │
│  │ Item             │ Price   │ Unit     │ Action          │   │
│  ├──────────────────┼─────────┼──────────┼─────────────────┤   │
│  │ Cooking Oil (5L) │ $11.50  │ 5L       │ [Edit] [Delete] │   │
│  │ Rice (25kg)      │ $42.00  │ 25kg     │ [Edit] [Delete] │   │
│  │ Sugar (5kg)      │ $8.50   │ 5kg      │ [Edit] [Delete] │   │
│  └──────────────────┴─────────┴──────────┴─────────────────┘   │
│                                                                  │
│  [+ Add New Item]    [📤 Upload CSV]    [Save All Changes]      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Method B: Bulk CSV Upload
```csv
item_name,price,currency,unit,category
Cooking Oil (5L),11.50,USD,5L,Groceries
Rice (25kg),42.00,USD,25kg,Groceries
Sugar (5kg),8.50,USD,5kg,Groceries
Bottled Water (1.5L),1.50,USD,1.5L,Beverages
Bread (loaf),2.00,USD,piece,Groceries
```

#### Method C: API Integration (Future)
- Stores with POS systems can auto-sync prices
- Real-time price updates via webhook

### Data Model (Public Prices)

```typescript
// Collection: /artifacts/{appId}/public/data/storePrices/{priceId}
interface PublicStorePrice {
  id: string;
  
  // Item Info
  itemName: string;
  itemNameNormalized: string;  // For search
  category: string;
  unit: string;
  
  // Price Info
  price: number;
  currency: 'USD' | 'CDF';
  
  // Store Info
  storeId: string;
  storeName: string;
  storeLocation?: string;
  
  // Metadata
  uploadDate: Timestamp;
  validUntil?: Timestamp;
  sourceType: 'merchant_portal' | 'csv_upload' | 'api_sync' | 'admin_entry';
  uploadedBy: string;          // Merchant user ID
  isVerified: boolean;         // Admin verified
  isActive: boolean;
  
  // This data is visible to ALL authenticated users
}
```

### Security Rules (Public Data)

```javascript
// Anyone can READ public prices
// Only merchants/admins can WRITE
match /public/data/storePrices/{priceId} {
  allow read: if request.auth != null;
  allow write: if isMerchant() || isAdmin();
}

function isMerchant() {
  return get(/databases/$(database)/documents/merchants/$(request.auth.uid)).data.isActive == true;
}

function isAdmin() {
  return get(/databases/$(database)/documents/admins/$(request.auth.uid)).exists;
}
```

---

## Part 3: How Data Connects

### Price Comparison View

When a user views price comparison, data comes from **BOTH sources**:

```
┌──────────────────────────────────────────────────────────────┐
│                    PRICE COMPARISON VIEW                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Cooking Oil (5L)                                            │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PUBLIC PRICES (from shops)                             │ │
│  │  ════════════════════════════════════════════════════  │ │
│  │  🏆 Shoprite Gombe    $11.50  (Updated Dec 1)          │ │
│  │     Carrefour         $12.00  (Updated Nov 28)         │ │
│  │     Peloustore        $12.50  (Updated Nov 25)         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  YOUR HISTORY (from your scans - private)               │ │
│  │  ════════════════════════════════════════════════════  │ │
│  │  Nov 28 - You paid $12.50 @ Shoprite                   │ │
│  │  Nov 15 - You paid $13.00 @ Local Market               │ │
│  │  Oct 30 - You paid $12.00 @ Carrefour                  │ │
│  │                                                         │ │
│  │  💡 You could save $1.00 by shopping at Shoprite!      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
                    USER SCANS RECEIPT
                           │
                           ▼
              ┌────────────────────────┐
              │  AI extracts items     │
              │  & prices              │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │  Saved to PRIVATE      │
              │  /users/{uid}/invoices │
              └───────────┬────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌───────────────────┐            ┌───────────────────┐
│  USER REPORTS     │            │  PRICE LOOKUP     │
│  ─────────────    │            │  ─────────────    │
│  • Monthly spend  │            │  Match items to   │
│  • Categories     │            │  PUBLIC prices    │
│  • Trends         │            │  for comparison   │
└───────────────────┘            └───────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │  PUBLIC STORE PRICES   │
                              │  /public/storePrices   │
                              │  (from MERCHANTS)      │
                              └────────────────────────┘
```

---

## Part 4: Merchant Portal (Shop Data Entry)

### Merchant Registration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Register   │────▶│  Verify     │────▶│   Admin     │────▶│  Access     │
│  Store      │     │  Business   │     │   Approves  │     │  Portal     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### Merchant Data Model

```typescript
// Collection: /artifacts/{appId}/merchants/{merchantId}
interface Merchant {
  id: string;
  userId: string;              // Firebase Auth UID
  
  // Business Info
  businessName: string;
  businessType: 'supermarket' | 'market' | 'pharmacy' | 'electronics' | 'other';
  registrationNumber?: string;
  
  // Store Locations
  stores: MerchantStore[];
  
  // Status
  isActive: boolean;
  isVerified: boolean;
  verifiedDate?: Timestamp;
  
  // Contact
  email: string;
  phone: string;
  
  // Metadata
  createdAt: Timestamp;
  lastPriceUpdate?: Timestamp;
  totalProducts: number;
}

interface MerchantStore {
  storeId: string;
  name: string;
  address: string;
  city: string;
  neighborhood: string;
  coordinates?: { lat: number; lng: number };
  isActive: boolean;
}
```

### Merchant Portal Screens

#### Dashboard
```
┌────────────────────────────────────────────────────────────────┐
│  🏪 Shoprite Merchant Portal                      [Logout]     │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Welcome, Store Manager!                                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    125       │  │    3         │  │  Dec 1, 2025 │         │
│  │   Products   │  │   Stores     │  │  Last Update │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  QUICK ACTIONS                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [📤 Upload Price List]    [✏️ Edit Prices]    [📊 Analytics]  │
│                                                                 │
│  RECENT UPDATES                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  • 15 prices updated - Dec 1, 2025                             │
│  • New store added: Shoprite Limete - Nov 28, 2025             │
│  • 50 products uploaded via CSV - Nov 25, 2025                 │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

#### Price Management
```
┌────────────────────────────────────────────────────────────────┐
│  Price Management                    Store: [Shoprite Gombe ▼] │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [🔍 Search products...]              [+ Add Product]          │
│                                                                 │
│  Category: [All ▼]    Sort: [Name A-Z ▼]                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ☐  Product              Category     Price    Updated    │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ ☐  Cooking Oil (5L)     Groceries    $11.50   Dec 1      │ │
│  │ ☐  Rice (25kg)          Groceries    $42.00   Dec 1      │ │
│  │ ☐  Sugar (5kg)          Groceries    $8.50    Nov 28     │ │
│  │ ☐  Bottled Water 1.5L   Beverages    $1.50    Nov 28     │ │
│  │ ☐  Bread (loaf)         Groceries    $2.00    Nov 25     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Selected: 0    [Bulk Edit]  [Delete Selected]                 │
│                                                                 │
│  Page 1 of 5    [< Prev]  [Next >]                             │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

#### CSV Upload
```
┌────────────────────────────────────────────────────────────────┐
│  Upload Price List                                              │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Upload a CSV file with your current prices.                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │           📄 Drop CSV file here                          │ │
│  │              or click to browse                          │ │
│  │                                                           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [📥 Download Template]                                        │
│                                                                 │
│  REQUIRED COLUMNS:                                              │
│  • item_name - Product name (e.g., "Cooking Oil 5L")           │
│  • price - Current price (number)                               │
│  • currency - USD or CDF                                        │
│  • unit - Size/unit (e.g., "5L", "kg", "piece")                │
│  • category - Product category                                  │
│                                                                 │
│  PREVIEW (after upload)                                         │
│  ─────────────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ✓ 48 valid rows                                          │ │
│  │ ⚠ 2 rows with warnings (missing category)                │ │
│  │ ✗ 0 invalid rows                                         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Cancel]                              [Upload 48 Products →]   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Key Differences Summary

| Aspect | User Scan (Private) | Shop Upload (Public) |
|--------|---------------------|----------------------|
| **Who inserts** | Consumer via app | Merchant via portal |
| **Method** | Camera scan + AI | Web form / CSV upload |
| **Data stored** | Full invoice + items | Item prices only |
| **Visibility** | Only owner | All users |
| **Purpose** | Personal tracking | Price comparison |
| **Update frequency** | Per shopping trip | Periodic (weekly/monthly) |
| **Verification** | None needed | Admin can verify |
| **Collection path** | `/users/{uid}/invoices` | `/public/data/storePrices` |

---

## Part 6: Benefits of Dual Model

### For Consumers
- ✅ Track their own spending accurately
- ✅ Compare their prices to current market prices
- ✅ Find best deals before shopping
- ✅ Privacy - their purchase history stays private

### For Merchants
- ✅ Attract price-conscious shoppers
- ✅ Showcase competitive prices
- ✅ Free advertising in the app
- ✅ Market intelligence (see competitor prices)

### For the Platform
- ✅ Clean, verified public price data
- ✅ Rich private usage data (engagement)
- ✅ Two-sided marketplace potential
- ✅ Data quality from dedicated sources

---

*Next: [Long Receipt Handling](./LONG_RECEIPTS.md)*
