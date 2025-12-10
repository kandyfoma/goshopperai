/**
 * Shared TypeScript types for Cloud Functions
 */

// Use Date for types, will be converted to Timestamp by Firestore
export interface ReceiptItem {
  id: string;
  name: string;
  nameNormalized: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
  category?: string;
  confidence: number;
}

export interface ParsedReceipt {
  storeName: string;
  storeNameNormalized: string;
  storeAddress?: string;
  storePhone?: string;
  receiptNumber?: string;
  date: string;
  currency: 'USD' | 'CDF';
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  rawText?: string;
}

export interface Receipt extends ParsedReceipt {
  id: string;
  userId: string;
  imageUrl?: string;
  imageUrls?: string[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  scannedAt: Date;
}

export interface Subscription {
  userId: string;
  trialScansUsed: number;
  trialScansLimit: number;
  trialStartDate?: Date;
  isSubscribed: boolean;
  planId?: 'free' | 'basic' | 'premium';
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  lastPaymentDate?: Date;
  lastPaymentAmount?: number;
  currency?: 'USD' | 'CDF';
  paymentMethod?: 'mobile_money';
  paymentProvider?: 'moko_afrika';
  mobileMoneyProvider?: 'mpesa' | 'orange' | 'airtel' | 'afrimoney';
  transactionId?: string;
  customerPhone?: string;
  autoRenew: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PricePoint {
  productName: string;
  productNameNormalized: string;
  storeName: string;
  storeNameNormalized: string;
  price: number;
  currency: 'USD' | 'CDF';
  unit?: string;
  quantity?: number;
  pricePerUnit?: number;
  recordedAt: Date;
  receiptId: string;
  userId: string;
}

export interface PriceComparison {
  productName: string;
  currentPrice: number;
  currentStore: string;
  bestPrice: number;
  bestStore: string;
  averagePrice: number;
  potentialSavings: number;
  savingsPercentage: number;
  priceCount: number;
}

export interface MokoPaymentRequest {
  amount: number;
  currency: 'USD' | 'CDF';
  phoneNumber: string;
  provider: 'mpesa' | 'orange' | 'airtel' | 'afrimoney';
  planId: 'basic' | 'premium';
  description?: string;
}

export interface MokoPaymentResponse {
  success: boolean;
  transactionId?: string;
  status?: string;
  message?: string;
  error?: string;
}

export interface PaymentRecord {
  userId: string;
  transactionId: string;
  amount: number;
  currency: 'USD' | 'CDF';
  provider: string;
  phoneNumber: string;
  planId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  mokoReference?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
