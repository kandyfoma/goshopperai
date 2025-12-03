# API Contracts

## Overview

This document defines all API contracts for Invoice Intelligence, including the Gemini AI integration, payment gateway, and internal service interfaces.

## 1. Gemini API Integration

### Invoice Parsing Request

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
x-goog-api-key: {GEMINI_API_KEY}
```

**Request Body:**
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "Extract invoice data from this receipt image. Return a valid JSON object with the following structure:\n\n{\n  \"shopName\": \"string - store name\",\n  \"shopAddress\": \"string or null - store address if visible\",\n  \"date\": \"string - date in YYYY-MM-DD format\",\n  \"invoiceNumber\": \"string or null - receipt/invoice number if visible\",\n  \"subtotal\": \"number or null - subtotal before tax\",\n  \"tax\": \"number or null - tax amount\",\n  \"total\": \"number - final total\",\n  \"currency\": \"string - USD or CDF\",\n  \"items\": [\n    {\n      \"name\": \"string - item name\",\n      \"quantity\": \"number - quantity purchased\",\n      \"unitPrice\": \"number - price per unit\",\n      \"totalPrice\": \"number - line total\"\n    }\n  ]\n}\n\nImportant:\n- If any field is not visible, use null\n- Normalize item names (capitalize properly)\n- Parse numbers without currency symbols\n- Default to USD if currency unclear\n- Return ONLY valid JSON, no markdown"
        },
        {
          "inlineData": {
            "mimeType": "image/jpeg",
            "data": "{BASE64_ENCODED_IMAGE}"
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.1,
    "topK": 1,
    "topP": 0.8,
    "maxOutputTokens": 2048,
    "responseMimeType": "application/json"
  },
  "safetySettings": [
    {
      "category": "HARM_CATEGORY_HARASSMENT",
      "threshold": "BLOCK_NONE"
    },
    {
      "category": "HARM_CATEGORY_HATE_SPEECH",
      "threshold": "BLOCK_NONE"
    },
    {
      "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "threshold": "BLOCK_NONE"
    },
    {
      "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
      "threshold": "BLOCK_NONE"
    }
  ]
}
```

**Success Response (200):**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\"shopName\":\"Shoprite\",\"shopAddress\":\"Avenue du Commerce, Gombe\",\"date\":\"2025-11-28\",\"invoiceNumber\":\"INV-001234\",\"subtotal\":33.00,\"tax\":2.75,\"total\":35.75,\"currency\":\"USD\",\"items\":[{\"name\":\"Banana (kg)\",\"quantity\":2.0,\"unitPrice\":1.50,\"totalPrice\":3.00},{\"name\":\"Cooking Oil (5L)\",\"quantity\":1.0,\"unitPrice\":12.50,\"totalPrice\":12.50}]}"
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 1250,
    "candidatesTokenCount": 180,
    "totalTokenCount": 1430
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | INVALID_ARGUMENT | Malformed request or invalid image |
| 403 | PERMISSION_DENIED | Invalid API key |
| 429 | RESOURCE_EXHAUSTED | Rate limit exceeded |
| 500 | INTERNAL | Gemini service error |

### Client Implementation

```typescript
// src/shared/services/gemini/client.ts

interface GeminiParseResult {
  success: boolean;
  data?: ParsedInvoice;
  error?: string;
  confidence?: number;
}

interface ParsedInvoice {
  shopName: string;
  shopAddress: string | null;
  date: string;
  invoiceNumber: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number;
  currency: 'USD' | 'CDF';
  items: ParsedItem[];
}

interface ParsedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export const parseInvoiceImage = async (imageBase64: string): Promise<GeminiParseResult> => {
  const API_KEY = Config.GEMINI_API_KEY;
  const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
  
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: INVOICE_PARSE_PROMPT },
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 }}
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const result = await response.json();
    const text = result.candidates[0]?.content?.parts[0]?.text;
    
    if (!text) {
      throw new Error('No response from AI');
    }
    
    const parsed = JSON.parse(text) as ParsedInvoice;
    
    return {
      success: true,
      data: parsed,
      confidence: calculateConfidence(parsed)
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

const calculateConfidence = (data: ParsedInvoice): number => {
  let score = 1.0;
  
  // Reduce confidence for missing fields
  if (!data.shopName) score -= 0.2;
  if (!data.date) score -= 0.2;
  if (!data.total) score -= 0.3;
  if (!data.items || data.items.length === 0) score -= 0.3;
  
  // Check item totals match
  const itemsTotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
  if (Math.abs(itemsTotal - (data.subtotal || data.total)) > 0.5) {
    score -= 0.2;
  }
  
  return Math.max(0, score);
};
```

---

## 2. Payment Gateway Integration (Moko Afrika)

Moko Afrika is a DRC-based payment provider with direct integration to local Mobile Money operators.
Contact: info@mokoafrika.com | +243 898 900 066

### Initialize Payment

**Endpoint:** `{MOKO_API_URL}/payments/initialize`

**Method:** `POST`

**Headers:**
```
Authorization: Bearer {MOKO_SECRET_KEY}
X-API-Key: {MOKO_API_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "reference": "INV-{timestamp}-{userId}-{random}",
  "amount": 2.99,
  "currency": "USD",
  "description": "Invoice Intelligence Monthly Subscription",
  "callback_url": "https://europe-west1-invoice-intelligence-drc.cloudfunctions.net/handlePaymentWebhook",
  "metadata": {
    "user_id": "firebase_uid_12345",
    "plan": "monthly",
    "app_id": "invoice-intelligence"
  },
  "customer": {
    "email": "user@example.com",
    "phone": "+243812345678"
  },
  "payment_method": {
    "type": "mobile_money",
    "provider": "mpesa",
    "phone": "+243812345678"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reference": "INV-1701234567890-uid12345-abc123",
    "payment_url": "https://pay.mokoafrika.com/checkout/xyz123",
    "ussd_code": "*150*00*123456#",
    "status": "pending"
  }
}
```

### Payment Webhook

**Endpoint:** `https://europe-west1-invoice-intelligence-drc.cloudfunctions.net/handlePaymentWebhook`

**Method:** `POST`

**Headers:**
```
X-Moko-Signature: {HMAC_SHA256_SIGNATURE}
Content-Type: application/json
```

**Webhook Payload:**
```json
{
  "event": "payment.completed",
  "data": {
    "reference": "INV-1701234567890-uid12345-abc123",
    "transaction_id": "MOKO-TXN-123456789",
    "amount": 2.99,
    "currency": "USD",
    "status": "successful",
    "payment_method": {
      "type": "mobile_money",
      "provider": "mpesa",
      "phone": "+243812345678"
    },
    "created_at": "2025-12-01T10:00:00.000Z",
    "metadata": {
      "user_id": "firebase_uid_12345",
      "plan": "monthly",
      "app_id": "invoice-intelligence"
    },
    "customer": {
      "email": "user@example.com",
      "phone": "+243812345678"
    }
  },
  "signature": "hmac_sha256_signature_here"
}
```

### Webhook Handler (Cloud Function)

```typescript
// functions/src/payments/handlePaymentWebhook.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const WEBHOOK_SECRET = functions.config().moko.webhook_secret;

// Verify HMAC signature
function verifySignature(payload: any, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export const handlePaymentWebhook = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    // Verify webhook signature
    const signature = req.headers['x-moko-signature'] as string;
    if (!signature || !verifySignature(req.body.data, signature)) {
      res.status(401).send('Invalid signature');
      return;
    }
    
    const { event, data } = req.body;
    
    if (event !== 'payment.completed' || data.status !== 'successful') {
      res.status(200).send('Ignored');
      return;
    }
    
    const { user_id, plan, app_id } = data.metadata;
    
    // Calculate subscription end date
    const now = new Date();
    const endDate = new Date(now);
    if (plan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    
    // Update user subscription
    await admin.firestore()
      .doc(`artifacts/${app_id}/users/${user_id}/subscription/status`)
      .set({
        isSubscribed: true,
        plan: plan,
        amount: data.amount,
        currency: data.currency,
        subscriptionStartDate: admin.firestore.FieldValue.serverTimestamp(),
        subscriptionEndDate: admin.firestore.Timestamp.fromDate(endDate),
        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
        lastPaymentAmount: data.amount,
        paymentMethod: 'mobile_money',
        paymentProvider: 'moko_afrika',
        mobileMoneyProvider: data.payment_method.provider,
        transactionId: data.transaction_id,
        customerPhone: data.customer.phone,
        status: 'active',
        autoRenew: true,
      }, { merge: true });
    
    res.status(200).send('OK');
  });
```

---

## 3. Internal Service Interfaces

### Authentication Service

```typescript
// src/shared/services/firebase/auth.ts

interface AuthService {
  // Sign in anonymously (default for new users)
  signInAnonymously(): Promise<AuthResult>;
  
  // Link anonymous account to email/password
  linkWithEmail(email: string, password: string): Promise<AuthResult>;
  
  // Sign in with existing email
  signInWithEmail(email: string, password: string): Promise<AuthResult>;
  
  // Sign out
  signOut(): Promise<void>;
  
  // Get current user
  getCurrentUser(): User | null;
  
  // Listen for auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe;
}

interface AuthResult {
  success: boolean;
  user?: User;
  error?: AuthError;
}

interface User {
  uid: string;
  isAnonymous: boolean;
  email?: string;
  displayName?: string;
}
```

### Invoice Service

```typescript
// src/features/scanner/services/invoiceService.ts

interface InvoiceService {
  // Create new invoice
  createInvoice(invoice: CreateInvoiceDTO): Promise<ServiceResult<Invoice>>;
  
  // Get user's invoices
  getInvoices(options?: GetInvoicesOptions): Promise<ServiceResult<Invoice[]>>;
  
  // Get single invoice
  getInvoice(invoiceId: string): Promise<ServiceResult<Invoice>>;
  
  // Update invoice
  updateInvoice(invoiceId: string, updates: UpdateInvoiceDTO): Promise<ServiceResult<Invoice>>;
  
  // Delete invoice
  deleteInvoice(invoiceId: string): Promise<ServiceResult<void>>;
  
  // Subscribe to real-time updates
  subscribeToInvoices(callback: (invoices: Invoice[]) => void): Unsubscribe;
}

interface CreateInvoiceDTO {
  shopName: string;
  shopAddress?: string;
  date: string;
  invoiceNumber?: string;
  total: number;
  subtotal?: number;
  tax?: number;
  currency: 'USD' | 'CDF';
  items: InvoiceItemDTO[];
  imageUrl?: string;
}

interface GetInvoicesOptions {
  limit?: number;
  startAfter?: string;
  startDate?: Date;
  endDate?: Date;
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}
```

### Price Comparison Service

```typescript
// src/features/comparison/services/priceService.ts

interface PriceService {
  // Search prices by item name
  searchPrices(query: string): Promise<ServiceResult<PriceItem[]>>;
  
  // Get prices for specific item
  getPricesForItem(itemName: string): Promise<ServiceResult<StorePrice[]>>;
  
  // Get prices by category
  getPricesByCategory(category: string): Promise<ServiceResult<PriceItem[]>>;
  
  // Get all stores
  getStores(): Promise<ServiceResult<Store[]>>;
  
  // Get user's price history for item
  getUserPriceHistory(itemName: string): Promise<ServiceResult<UserPriceHistory[]>>;
  
  // Get best price for item
  getBestPrice(itemName: string): Promise<ServiceResult<StorePrice>>;
}

interface PriceItem {
  itemName: string;
  category: string;
  prices: StorePrice[];
  bestPrice: StorePrice;
  priceRange: { min: number; max: number };
}

interface StorePrice {
  price: number;
  currency: string;
  storeName: string;
  storeId: string;
  uploadDate: string;
}

interface UserPriceHistory {
  price: number;
  date: string;
  store: string;
}
```

### Subscription Service

```typescript
// src/features/subscription/services/subscriptionService.ts

interface SubscriptionService {
  // Get current subscription status
  getStatus(): Promise<ServiceResult<SubscriptionStatus>>;
  
  // Check if user can perform scan
  canScan(): Promise<boolean>;
  
  // Record scan usage (decrements trial or validates subscription)
  recordScanUsage(): Promise<ServiceResult<void>>;
  
  // Initialize payment
  initiatePayment(plan: 'monthly' | 'yearly'): Promise<ServiceResult<PaymentInitResult>>;
  
  // Subscribe to status changes
  subscribeToStatus(callback: (status: SubscriptionStatus) => void): Unsubscribe;
}

interface PaymentInitResult {
  paymentUrl: string;
  transactionRef: string;
}

interface SubscriptionStatus {
  trialScansRemaining: number;
  isSubscribed: boolean;
  plan?: 'monthly' | 'yearly';
  subscriptionEndDate?: Date;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
}
```

---

## 4. Error Codes

### Application Error Codes

| Code | Name | Description |
|------|------|-------------|
| E001 | AUTH_REQUIRED | User must be authenticated |
| E002 | AUTH_FAILED | Authentication failed |
| E003 | SUBSCRIPTION_REQUIRED | Active subscription required |
| E004 | TRIAL_EXHAUSTED | Free trial scans used up |
| E005 | PARSE_FAILED | Invoice parsing failed |
| E006 | INVALID_IMAGE | Image is invalid or unreadable |
| E007 | NETWORK_ERROR | Network connection error |
| E008 | RATE_LIMITED | Too many requests |
| E009 | PERMISSION_DENIED | Access denied |
| E010 | NOT_FOUND | Resource not found |
| E011 | VALIDATION_ERROR | Data validation failed |
| E012 | PAYMENT_FAILED | Payment processing failed |
| E013 | STORAGE_ERROR | File storage error |
| E014 | UNKNOWN_ERROR | Unexpected error |

### Error Response Format

```typescript
interface AppError {
  code: string;      // E001, E002, etc.
  message: string;   // Human-readable message
  details?: any;     // Additional context
  timestamp: string; // ISO timestamp
}

// Example error response
{
  "code": "E005",
  "message": "Failed to parse invoice. Please try with a clearer image.",
  "details": {
    "confidence": 0.3,
    "missingFields": ["total", "items"]
  },
  "timestamp": "2025-12-01T10:00:00.000Z"
}
```

---

## 5. Rate Limits

| Service | Limit | Window |
|---------|-------|--------|
| Gemini API | 60 requests | per minute |
| Firestore reads | 50,000 | per day (free tier) |
| Firestore writes | 20,000 | per day (free tier) |
| Cloud Functions | 2 million | per month (free tier) |
| Payment API | 100 requests | per minute |

---

*Next: [Gemini Integration](./GEMINI_INTEGRATION.md)*
