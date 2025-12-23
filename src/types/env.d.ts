declare module 'react-native-config' {
  export interface NativeConfig {
    // Firebase
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_API_KEY?: string;
    FIREBASE_AUTH_DOMAIN?: string;
    FIREBASE_STORAGE_BUCKET?: string;
    FIREBASE_MESSAGING_SENDER_ID?: string;
    FIREBASE_APP_ID?: string;

    // Gemini AI
    GEMINI_API_KEY?: string;

    // Supabase (Payment Processing)
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;

    // Payment Gateways
    MOKO_AFRIKA_API_KEY?: string;
    MOKO_AFRIKA_SECRET_KEY?: string;
    MOKO_AFRIKA_MERCHANT_ID?: string;
    MOKO_AFRIKA_ENVIRONMENT?: string;

    STRIPE_SECRET_KEY?: string;
    STRIPE_PUBLISHABLE_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
