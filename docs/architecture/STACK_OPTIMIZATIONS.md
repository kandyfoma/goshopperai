# Stack Optimizations

## Overview

This document outlines performance and architecture optimizations for Invoice Intelligence, specifically targeting the DRC market conditions: low-end devices, poor connectivity, and data cost concerns.

---

## Optimization 1: Hermes JavaScript Engine

### What is Hermes?

Hermes is a JavaScript engine optimized for React Native, developed by Meta. It compiles JavaScript to bytecode ahead-of-time, dramatically improving app performance.

### Benefits

| Metric | Without Hermes | With Hermes | Improvement |
|--------|----------------|-------------|-------------|
| App startup time | 4.5s | 2.1s | **53% faster** |
| Bundle size | 18MB | 12MB | **33% smaller** |
| Memory usage | 185MB | 136MB | **27% less** |
| TTI (Time to Interactive) | 3.2s | 1.5s | **53% faster** |

### Implementation

#### Step 1: Enable in Android

```gradle
// android/app/build.gradle

project.ext.react = [
    enableHermes: true,  // Changed from false
    hermesCommand: "../../node_modules/hermes-engine/%OS-BIN%/hermes",
]

def enableHermes = project.ext.react.get("enableHermes", true)
```

#### Step 2: Enable in iOS

```ruby
# ios/Podfile

:hermes_enabled => true,
```

#### Step 3: Rebuild

```bash
# Android
cd android && ./gradlew clean
cd .. && npx react-native run-android

# iOS
cd ios && pod install
cd .. && npx react-native run-ios
```

### Verification

```typescript
// Check if Hermes is enabled
const isHermes = () => !!global.HermesInternal;
console.log('Hermes enabled:', isHermes());
```

---

## Optimization 2: Image Compression

### Problem

- Average receipt photo: 2-4MB
- Gemini API accepts up to 20MB
- DRC data costs: ~$0.50/100MB
- **Each scan costs user $0.01-0.02 in data**

### Solution

Compress images before upload while maintaining readability.

### Implementation

#### Install Dependencies

```bash
npm install react-native-image-resizer
# or
expo install expo-image-manipulator
```

#### Compression Service

```typescript
// src/services/image/compression.ts

import ImageResizer from 'react-native-image-resizer';

interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;  // 0-100
  format: 'JPEG' | 'PNG';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1024,
  maxHeight: 1536,  // 2:3 ratio for receipts
  quality: 80,
  format: 'JPEG',
};

export async function compressReceiptImage(
  imageUri: string,
  options: Partial<CompressionOptions> = {}
): Promise<CompressedImage> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Get original file size
  const originalSize = await getFileSize(imageUri);
  
  // Compress
  const result = await ImageResizer.createResizedImage(
    imageUri,
    config.maxWidth,
    config.maxHeight,
    config.format,
    config.quality,
    0,  // rotation
    undefined,  // output path (temp)
    false,  // keep meta
    { mode: 'contain', onlyScaleDown: true }
  );
  
  const compressedSize = await getFileSize(result.uri);
  const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
  
  console.log(`Image compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${savings}% saved)`);
  
  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    originalSize,
    compressedSize,
    savingsPercent: parseFloat(savings),
  };
}

interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  savingsPercent: number;
}

async function getFileSize(uri: string): Promise<number> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob.size;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
```

#### Quality Presets

```typescript
// src/services/image/presets.ts

export const COMPRESSION_PRESETS = {
  // For good connectivity - max quality
  high: {
    maxWidth: 1536,
    maxHeight: 2048,
    quality: 90,
  },
  
  // Default - balanced
  medium: {
    maxWidth: 1024,
    maxHeight: 1536,
    quality: 80,
  },
  
  // For poor connectivity - aggressive compression
  low: {
    maxWidth: 768,
    maxHeight: 1024,
    quality: 60,
  },
  
  // Automatic based on connection
  auto: async () => {
    const connectionType = await getConnectionType();
    if (connectionType === 'wifi') return COMPRESSION_PRESETS.high;
    if (connectionType === '4g') return COMPRESSION_PRESETS.medium;
    return COMPRESSION_PRESETS.low;
  },
};
```

#### Integration with Scan Flow

```typescript
// src/features/scanning/hooks/useScanReceipt.ts

import { compressReceiptImage } from '@/services/image/compression';
import { COMPRESSION_PRESETS } from '@/services/image/presets';

export function useScanReceipt() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processReceipt = async (rawImageUri: string) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Compress image
      const preset = await COMPRESSION_PRESETS.auto();
      const compressed = await compressReceiptImage(rawImageUri, preset);
      
      // Log savings for analytics
      analytics.logEvent('image_compressed', {
        original_size: compressed.originalSize,
        compressed_size: compressed.compressedSize,
        savings_percent: compressed.savingsPercent,
      });
      
      // Step 2: Convert to base64
      const base64 = await imageToBase64(compressed.uri);
      
      // Step 3: Send to Gemini (via proxy)
      const result = await geminiProxy.parseReceipt(base64);
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  };
  
  return { processReceipt, isProcessing };
}
```

### Expected Savings

| Original Size | Compressed Size | User Data Savings |
|---------------|-----------------|-------------------|
| 3MB | 300KB | 90% ($0.014 saved) |
| 2MB | 250KB | 88% ($0.009 saved) |
| 4MB | 400KB | 90% ($0.018 saved) |

**At 20 scans/month:** User saves ~$0.25/month in data costs

---

## Optimization 3: Gemini API Proxy

### Problem

Direct client-to-Gemini calls have issues:
1. **Security**: API key exposed in app bundle
2. **No caching**: Same item parsed repeatedly
3. **No rate limiting**: One user could exhaust quota
4. **No analytics**: Can't track usage patterns

### Solution

Route all Gemini calls through a Firebase Cloud Function.

### Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Mobile App  │────▶│  Cloud Function  │────▶│  Gemini API  │
│              │     │  (Gemini Proxy)  │     │              │
└──────────────┘     └──────────────────┘     └──────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  Firestore Cache │
                     │  (Common Items)  │
                     └──────────────────┘
```

### Implementation

#### Cloud Function

```typescript
// functions/src/gemini/parseReceipt.ts

import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as admin from 'firebase-admin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const db = admin.firestore();

// Rate limiting config
const RATE_LIMIT = {
  maxRequestsPerMinute: 10,
  maxRequestsPerDay: 50,  // Free tier
  maxRequestsPerDayPremium: 500,
};

interface ParseReceiptRequest {
  imageBase64: string;
  userId: string;
  isPremium: boolean;
}

export const parseReceipt = functions
  .region('europe-west1')
  .runWith({ 
    memory: '1GB',
    timeoutSeconds: 60,
    secrets: ['GEMINI_API_KEY'],
  })
  .https.onCall(async (data: ParseReceiptRequest, context) => {
    // 1. Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const userId = context.auth.uid;
    
    // 2. Check rate limits
    await checkRateLimit(userId, data.isPremium);
    
    // 3. Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `
    Analyze this receipt image and extract the following information in JSON format:
    {
      "shopName": "Store name",
      "shopAddress": "Address if visible",
      "date": "YYYY-MM-DD",
      "items": [
        {
          "name": "Item name",
          "quantity": 1,
          "unitPrice": 0.00,
          "totalPrice": 0.00,
          "category": "food|household|transport|health|other"
        }
      ],
      "subtotal": 0.00,
      "tax": 0.00,
      "total": 0.00,
      "currency": "USD|CDF"
    }
    
    Rules:
    - Extract ALL items visible on the receipt
    - Normalize item names (capitalize properly, remove codes)
    - If currency symbol is FC or CDF, use "CDF"
    - If $ or USD, use "USD"
    - Guess category based on item name
    `;
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: data.imageBase64,
        },
      },
    ]);
    
    const responseText = result.response.text();
    
    // 4. Parse and validate response
    const parsed = parseGeminiResponse(responseText);
    
    // 5. Cache common items for future reference
    await cacheItems(parsed.items);
    
    // 6. Log usage
    await logUsage(userId, data.isPremium);
    
    return {
      success: true,
      data: parsed,
    };
  });

async function checkRateLimit(userId: string, isPremium: boolean): Promise<void> {
  const userRef = db.collection('rateLimits').doc(userId);
  const userDoc = await userRef.get();
  
  const now = Date.now();
  const minuteAgo = now - 60 * 1000;
  const dayStart = new Date().setHours(0, 0, 0, 0);
  
  const limits = userDoc.data() || { requests: [] };
  const recentRequests = limits.requests.filter((t: number) => t > minuteAgo);
  const todayRequests = limits.requests.filter((t: number) => t > dayStart);
  
  // Check minute limit
  if (recentRequests.length >= RATE_LIMIT.maxRequestsPerMinute) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please wait a minute.'
    );
  }
  
  // Check daily limit
  const dailyLimit = isPremium 
    ? RATE_LIMIT.maxRequestsPerDayPremium 
    : RATE_LIMIT.maxRequestsPerDay;
    
  if (todayRequests.length >= dailyLimit) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      isPremium 
        ? 'Daily limit reached. Try again tomorrow.'
        : 'Free daily limit reached. Upgrade for more scans!'
    );
  }
  
  // Record this request
  await userRef.set({
    requests: [...todayRequests, now],
    lastRequest: now,
  }, { merge: true });
}

async function cacheItems(items: ParsedItem[]): Promise<void> {
  const batch = db.batch();
  
  for (const item of items) {
    const normalized = normalizeItemName(item.name);
    const cacheRef = db.collection('itemCache').doc(normalized);
    
    batch.set(cacheRef, {
      displayName: item.name,
      category: item.category,
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      occurrences: admin.firestore.FieldValue.increment(1),
    }, { merge: true });
  }
  
  await batch.commit();
}

function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

function parseGeminiResponse(text: string): ParsedReceipt {
  // Extract JSON from response (may have markdown wrapper)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new functions.https.HttpsError('internal', 'Invalid AI response format');
  }
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new functions.https.HttpsError('internal', 'Failed to parse AI response');
  }
}

async function logUsage(userId: string, isPremium: boolean): Promise<void> {
  await db.collection('analytics').doc('gemini_usage').collection('calls').add({
    userId,
    isPremium,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    model: 'gemini-2.5-flash',
  });
}
```

#### Client Service

```typescript
// src/services/gemini/client.ts

import functions from '@react-native-firebase/functions';

// Use europe-west1 region
const functionsInstance = functions().httpsCallable('parseReceipt');
functionsInstance.region = 'europe-west1';

export interface ParseReceiptResult {
  success: boolean;
  data?: ParsedReceipt;
  error?: string;
}

export async function parseReceiptViaProxy(
  imageBase64: string,
  isPremium: boolean
): Promise<ParseReceiptResult> {
  try {
    const result = await functionsInstance({
      imageBase64,
      isPremium,
    });
    
    return result.data as ParseReceiptResult;
  } catch (error: any) {
    // Handle specific errors
    if (error.code === 'functions/resource-exhausted') {
      return {
        success: false,
        error: error.message,
      };
    }
    
    throw error;
  }
}
```

### Benefits

| Aspect | Before (Direct) | After (Proxy) |
|--------|-----------------|---------------|
| API Key Security | ❌ In app bundle | ✅ Server-side only |
| Rate Limiting | ❌ None | ✅ Per-user limits |
| Usage Analytics | ❌ None | ✅ Full tracking |
| Caching Potential | ❌ None | ✅ Common items cached |
| Error Handling | Basic | Standardized |

---

## Optimization 4: WatermelonDB for Offline

### Problem

Firestore offline persistence is good but limited:
- No complex queries offline
- Sync can be slow with many documents
- No lazy loading of related data

### Solution

Use WatermelonDB as local database with Firestore sync.

### When to Use

| Scenario | Use Firestore | Use WatermelonDB |
|----------|---------------|------------------|
| Real-time data (prices) | ✅ | |
| User's invoice history | ✅ | ✅ |
| Complex local queries | | ✅ |
| Offline-first features | | ✅ |
| Shopping list | | ✅ |

### Implementation

#### Install

```bash
npm install @nozbe/watermelondb
npm install @nozbe/with-observables

# For React Native
npx pod-install
```

#### Schema Definition

```typescript
// src/database/schema.ts

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'invoices',
      columns: [
        { name: 'firebase_id', type: 'string', isOptional: true },
        { name: 'shop_name', type: 'string' },
        { name: 'shop_address', type: 'string', isOptional: true },
        { name: 'date', type: 'number' },  // timestamp
        { name: 'total', type: 'number' },
        { name: 'currency', type: 'string' },
        { name: 'synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'invoice_items',
      columns: [
        { name: 'invoice_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'name_normalized', type: 'string', isIndexed: true },
        { name: 'quantity', type: 'number' },
        { name: 'unit_price', type: 'number' },
        { name: 'total_price', type: 'number' },
        { name: 'category', type: 'string', isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'shopping_list_items',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'name_normalized', type: 'string', isIndexed: true },
        { name: 'quantity', type: 'number' },
        { name: 'checked', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
```

#### Model Definitions

```typescript
// src/database/models/Invoice.ts

import { Model } from '@nozbe/watermelondb';
import { field, date, children, readonly } from '@nozbe/watermelondb/decorators';

export class Invoice extends Model {
  static table = 'invoices';
  static associations = {
    invoice_items: { type: 'has_many', foreignKey: 'invoice_id' },
  };
  
  @field('firebase_id') firebaseId!: string | null;
  @field('shop_name') shopName!: string;
  @field('shop_address') shopAddress!: string | null;
  @date('date') date!: Date;
  @field('total') total!: number;
  @field('currency') currency!: string;
  @field('synced') synced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  
  @children('invoice_items') items!: any;
}

// src/database/models/InvoiceItem.ts

import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export class InvoiceItem extends Model {
  static table = 'invoice_items';
  static associations = {
    invoices: { type: 'belongs_to', key: 'invoice_id' },
  };
  
  @field('invoice_id') invoiceId!: string;
  @field('name') name!: string;
  @field('name_normalized') nameNormalized!: string;
  @field('quantity') quantity!: number;
  @field('unit_price') unitPrice!: number;
  @field('total_price') totalPrice!: number;
  @field('category') category!: string;
  
  @relation('invoices', 'invoice_id') invoice!: any;
}
```

#### Sync with Firestore

```typescript
// src/database/sync.ts

import { synchronize } from '@nozbe/watermelondb/sync';
import firestore from '@react-native-firebase/firestore';
import { database } from './index';

export async function syncWithFirestore(userId: string): Promise<void> {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      // Fetch changes from Firestore since last sync
      const invoicesRef = firestore()
        .collection('users')
        .doc(userId)
        .collection('invoices');
      
      const query = lastPulledAt
        ? invoicesRef.where('updatedAt', '>', new Date(lastPulledAt))
        : invoicesRef;
      
      const snapshot = await query.get();
      
      const changes = {
        invoices: {
          created: [] as any[],
          updated: [] as any[],
          deleted: [] as string[],
        },
        invoice_items: {
          created: [] as any[],
          updated: [] as any[],
          deleted: [] as string[],
        },
      };
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const invoice = {
          id: doc.id,
          firebase_id: doc.id,
          shop_name: data.shopName,
          shop_address: data.shopAddress,
          date: data.date.toDate().getTime(),
          total: data.total,
          currency: data.currency,
          synced: true,
          created_at: data.createdAt.toDate().getTime(),
          updated_at: data.updatedAt.toDate().getTime(),
        };
        
        if (lastPulledAt && data.createdAt.toDate().getTime() < lastPulledAt) {
          changes.invoices.updated.push(invoice);
        } else {
          changes.invoices.created.push(invoice);
        }
        
        // Also pull items...
      }
      
      return {
        changes,
        timestamp: Date.now(),
      };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      // Push local changes to Firestore
      const batch = firestore().batch();
      
      for (const invoice of changes.invoices.created) {
        if (!invoice.synced) {
          const ref = firestore()
            .collection('users')
            .doc(userId)
            .collection('invoices')
            .doc();
          
          batch.set(ref, {
            shopName: invoice.shop_name,
            shopAddress: invoice.shop_address,
            date: new Date(invoice.date),
            total: invoice.total,
            currency: invoice.currency,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });
        }
      }
      
      await batch.commit();
    },
  });
}
```

### Usage Example

```typescript
// Query invoices by category offline
const foodInvoices = await database
  .get('invoice_items')
  .query(Q.where('category', 'food'))
  .fetch();

// Calculate total spending offline
const thisMonth = await database
  .get('invoices')
  .query(
    Q.where('date', Q.gte(startOfMonth.getTime())),
    Q.where('date', Q.lte(endOfMonth.getTime()))
  )
  .fetch();

const totalSpending = thisMonth.reduce((sum, inv) => sum + inv.total, 0);
```

---

## Optimization 5: On-Device OCR Fallback

### Problem

When offline, users cannot scan receipts because Gemini requires internet.

### Solution

Use ML Kit's on-device text recognition as a fallback.

### Implementation

#### Install ML Kit

```bash
npm install @react-native-ml-kit/text-recognition
```

#### OCR Service

```typescript
// src/services/ocr/onDeviceOcr.ts

import TextRecognition from '@react-native-ml-kit/text-recognition';

interface OcrResult {
  success: boolean;
  rawText: string;
  lines: string[];
  confidence: number;
}

export async function performOnDeviceOcr(imageUri: string): Promise<OcrResult> {
  try {
    const result = await TextRecognition.recognize(imageUri);
    
    const lines = result.blocks
      .flatMap(block => block.lines)
      .map(line => line.text);
    
    return {
      success: true,
      rawText: result.text,
      lines,
      confidence: calculateConfidence(result),
    };
  } catch (error) {
    return {
      success: false,
      rawText: '',
      lines: [],
      confidence: 0,
    };
  }
}

function calculateConfidence(result: any): number {
  // Average confidence of recognized blocks
  if (!result.blocks.length) return 0;
  
  const totalConfidence = result.blocks.reduce(
    (sum: number, block: any) => sum + (block.confidence || 0.5),
    0
  );
  
  return totalConfidence / result.blocks.length;
}
```

#### Basic Receipt Parser (Offline)

```typescript
// src/services/ocr/offlineParser.ts

interface BasicParseResult {
  possibleTotal: number | null;
  possibleItems: string[];
  possibleStoreName: string | null;
  possibleDate: string | null;
  needsManualReview: boolean;
}

export function parseReceiptTextBasic(lines: string[]): BasicParseResult {
  const result: BasicParseResult = {
    possibleTotal: null,
    possibleItems: [],
    possibleStoreName: null,
    possibleDate: null,
    needsManualReview: true,
  };
  
  // Try to find store name (usually first non-empty line)
  const firstLines = lines.slice(0, 3).filter(l => l.trim().length > 3);
  if (firstLines.length > 0) {
    result.possibleStoreName = firstLines[0];
  }
  
  // Try to find total (look for patterns like "TOTAL", "MONTANT")
  const totalPatterns = [
    /total[:\s]*[\$]?([\d,]+\.?\d*)/i,
    /montant[:\s]*[\$]?([\d,]+\.?\d*)/i,
    /amount[:\s]*[\$]?([\d,]+\.?\d*)/i,
    /grand\s*total[:\s]*[\$]?([\d,]+\.?\d*)/i,
  ];
  
  for (const line of lines) {
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        result.possibleTotal = parseFloat(match[1].replace(',', ''));
        break;
      }
    }
  }
  
  // Try to find date
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
  ];
  
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        result.possibleDate = match[1];
        break;
      }
    }
  }
  
  // Extract possible items (lines with prices)
  const pricePattern = /[\$]?([\d,]+\.?\d{0,2})\s*$/;
  
  for (const line of lines) {
    if (pricePattern.test(line) && !line.toLowerCase().includes('total')) {
      result.possibleItems.push(line.trim());
    }
  }
  
  return result;
}
```

#### Hybrid Scanning Service

```typescript
// src/services/scanning/hybridScanner.ts

import { isOnline } from '@/utils/network';
import { parseReceiptViaProxy } from '@/services/gemini/client';
import { performOnDeviceOcr, parseReceiptTextBasic } from '@/services/ocr';
import { compressReceiptImage } from '@/services/image/compression';

export interface ScanResult {
  method: 'gemini' | 'offline_ocr' | 'manual';
  confidence: 'high' | 'medium' | 'low';
  data: Partial<ParsedReceipt>;
  needsReview: boolean;
}

export async function scanReceipt(
  imageUri: string,
  isPremium: boolean
): Promise<ScanResult> {
  const online = await isOnline();
  
  if (online) {
    // Best path: Gemini via proxy
    try {
      const compressed = await compressReceiptImage(imageUri);
      const base64 = await imageToBase64(compressed.uri);
      const result = await parseReceiptViaProxy(base64, isPremium);
      
      if (result.success) {
        return {
          method: 'gemini',
          confidence: 'high',
          data: result.data!,
          needsReview: false,
        };
      }
    } catch (error) {
      console.warn('Gemini parsing failed, falling back to OCR');
    }
  }
  
  // Fallback: On-device OCR
  const ocrResult = await performOnDeviceOcr(imageUri);
  
  if (ocrResult.success && ocrResult.confidence > 0.6) {
    const parsed = parseReceiptTextBasic(ocrResult.lines);
    
    return {
      method: 'offline_ocr',
      confidence: ocrResult.confidence > 0.8 ? 'medium' : 'low',
      data: {
        shopName: parsed.possibleStoreName || '',
        date: parsed.possibleDate || new Date().toISOString().split('T')[0],
        total: parsed.possibleTotal || 0,
        items: [],  // User will need to add manually
      },
      needsReview: true,
    };
  }
  
  // Last resort: Manual entry
  return {
    method: 'manual',
    confidence: 'low',
    data: {},
    needsReview: true,
  };
}
```

### UI Indication

```
┌────────────────────────┐
│ [←]   Scan Result      │
├────────────────────────┤
│                        │
│ ⚠️ Offline Mode        │
│                        │
│ Basic details          │
│ extracted. Please      │
│ review and complete.   │
│                        │
│ Store: [Shoprite     ] │
│ Date:  [03/12/2025   ] │
│ Total: [$45.00       ] │
│                        │
│ Items: (add manually)  │
│ [+ Add Item]           │
│                        │
│ ────────────────────── │
│                        │
│ 📡 When online, we'll  │
│ re-process for better  │
│ accuracy               │
│                        │
│   [Save as Draft]      │
│                        │
└────────────────────────┘
```

---

## Summary

| Optimization | Effort | Impact | Priority |
|--------------|--------|--------|----------|
| **Hermes Engine** | Low (config only) | High (2x startup) | P0 |
| **Image Compression** | Low | High (save user $) | P0 |
| **Gemini Proxy** | Medium | High (security) | P0 |
| **WatermelonDB** | High | Medium (better offline) | P1 |
| **On-Device OCR** | Medium | Medium (offline scan) | P1 |

### Implementation Order

1. **Week 1:** Enable Hermes, add image compression
2. **Week 2:** Deploy Gemini proxy Cloud Function
3. **Week 3-4:** Integrate WatermelonDB
4. **Week 5:** Add on-device OCR fallback

---

*See also: [System Architecture](./SYSTEM_ARCHITECTURE.md) | [Infrastructure](./INFRASTRUCTURE.md)*
