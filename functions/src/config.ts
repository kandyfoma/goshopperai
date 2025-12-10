/**
 * Configuration and environment variables
 */

export const config = {
  // Gemini AI
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.0-flash',
    maxTokens: 4096,
  },
  
  // Moko Afrika
  moko: {
    apiKey: process.env.MOKO_AFRIKA_API_KEY || '',
    secretKey: process.env.MOKO_AFRIKA_SECRET_KEY || '',
    merchantId: process.env.MOKO_AFRIKA_MERCHANT_ID || '',
    baseUrl: process.env.MOKO_AFRIKA_ENVIRONMENT === 'production' 
      ? 'https://api.mokoafrika.com/v1'
      : 'https://sandbox.mokoafrika.com/v1',
    callbackUrl: process.env.MOKO_CALLBACK_URL || '',
  },
  
  // App settings
  app: {
    id: 'goshopperai',
    region: 'europe-west1',
    trialScanLimit: 5,
  },
  
  // Pricing (USD)
  pricing: {
    free: { price: 0, scansPerMonth: 5 },
    basic: { price: 1.99, scansPerMonth: 30 },
    premium: { price: 2.99, scansPerMonth: -1 }, // -1 = unlimited
  },
};

// Firestore collection paths
export const collections = {
  users: (userId: string) => `artifacts/${config.app.id}/users/${userId}`,
  userDoc: (userId: string) => `artifacts/${config.app.id}/users/${userId}/profile/data`,
  receipts: (userId: string) => `artifacts/${config.app.id}/users/${userId}/receipts`,
  subscription: (userId: string) => `artifacts/${config.app.id}/users/${userId}/subscription/status`,
  prices: `artifacts/${config.app.id}/public/prices/data`,
  stores: `artifacts/${config.app.id}/public/stores/data`,
  payments: (userId: string) => `artifacts/${config.app.id}/users/${userId}/payments`,
};
