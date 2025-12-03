# Gemini AI Integration

## Overview

Invoice Intelligence uses Google's Gemini 2.5 Flash model to extract structured data from receipt/invoice images. This document covers the complete integration specification.

## Why Gemini 2.5 Flash?

| Feature | Benefit |
|---------|---------|
| **Multimodal** | Native image + text understanding |
| **Speed** | Fast inference (~1-3 seconds) |
| **Cost** | Lower cost than larger models |
| **JSON Mode** | Native structured output support |
| **Accuracy** | Excellent OCR + interpretation |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Mobile    │────▶│   Gemini    │────▶│   Client    │
│   Camera    │     │   API       │     │   Parser    │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    Structured JSON
```

**Direct Client Call:** The mobile app calls Gemini API directly (not through a backend) for simplicity and reduced latency. The API key is protected by application restrictions.

## Prompt Engineering

### Primary Invoice Parsing Prompt

```typescript
const INVOICE_PARSE_PROMPT = `
You are an expert receipt/invoice parser. Extract all visible information from this receipt image and return it as a structured JSON object.

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no markdown, no explanations, no code blocks
2. Parse ALL visible line items, even if partially obscured
3. Use null for fields that are not visible or unclear
4. Normalize currency: use "USD" for US dollars, "CDF" for Congolese francs
5. Format dates as "YYYY-MM-DD"
6. Clean item names: proper capitalization, remove extra spaces
7. If quantity is not shown, assume 1
8. Calculate totalPrice as quantity × unitPrice if not shown

REQUIRED JSON STRUCTURE:
{
  "shopName": "string - store/merchant name",
  "shopAddress": "string or null - full address if visible",
  "date": "string - date in YYYY-MM-DD format",
  "invoiceNumber": "string or null - receipt/invoice number",
  "subtotal": "number or null - amount before tax",
  "tax": "number or null - tax amount",
  "total": "number - final amount paid",
  "currency": "string - USD or CDF",
  "items": [
    {
      "name": "string - item description",
      "quantity": "number - quantity purchased",
      "unitPrice": "number - price per unit",
      "totalPrice": "number - line item total"
    }
  ]
}

PARSING RULES:
- For items showing only total price, set unitPrice = totalPrice, quantity = 1
- Ignore promotional text, barcodes, and footer disclaimers
- If multiple totals shown, use the final/largest one
- For unclear handwriting, make your best interpretation
- Include unit information in item name (e.g., "Rice (25kg)", "Oil (5L)")

Return the JSON object now:
`;
```

### Prompt for French Receipts (DRC)

```typescript
const INVOICE_PARSE_PROMPT_FR = `
Vous êtes un expert en analyse de reçus/factures. Extrayez toutes les informations visibles de cette image de reçu et retournez-les sous forme d'objet JSON structuré.

INSTRUCTIONS CRITIQUES:
1. Retournez UNIQUEMENT du JSON valide - pas de markdown, pas d'explications
2. Analysez TOUS les articles visibles, même partiellement obscurcis
3. Utilisez null pour les champs non visibles ou peu clairs
4. Normalisez la devise: "USD" pour les dollars américains, "CDF" pour les francs congolais
5. Formatez les dates comme "YYYY-MM-DD" ou "JJ/MM/AAAA" → "YYYY-MM-DD"
6. Nettoyez les noms d'articles: majuscules appropriées, supprimez les espaces supplémentaires
7. Si la quantité n'est pas indiquée, supposez 1

STRUCTURE JSON REQUISE:
{
  "shopName": "string - nom du magasin/commerçant",
  "shopAddress": "string ou null - adresse complète si visible",
  "date": "string - date au format YYYY-MM-DD",
  "invoiceNumber": "string ou null - numéro de reçu/facture",
  "subtotal": "number ou null - montant avant taxe",
  "tax": "number ou null - montant de la taxe",
  "total": "number - montant final payé",
  "currency": "string - USD ou CDF",
  "items": [
    {
      "name": "string - description de l'article",
      "quantity": "number - quantité achetée",
      "unitPrice": "number - prix unitaire",
      "totalPrice": "number - total de la ligne"
    }
  ]
}

Retournez l'objet JSON maintenant:
`;
```

## Implementation

### Client Service

```typescript
// src/shared/services/gemini/client.ts

import Config from 'react-native-config';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface GeminiConfig {
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
}

const DEFAULT_CONFIG: GeminiConfig = {
  temperature: 0.1,      // Low for consistent structured output
  topK: 1,               // Most likely token
  topP: 0.8,             // Focused sampling
  maxOutputTokens: 2048, // Sufficient for invoice JSON
};

export class GeminiClient {
  private apiKey: string;
  private config: GeminiConfig;

  constructor(config?: Partial<GeminiConfig>) {
    this.apiKey = Config.GEMINI_API_KEY;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async parseInvoice(imageBase64: string, language: 'en' | 'fr' = 'fr'): Promise<ParseResult> {
    const prompt = language === 'fr' ? INVOICE_PARSE_PROMPT_FR : INVOICE_PARSE_PROMPT;
    
    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageBase64
            }
          }
        ]
      }],
      generationConfig: {
        ...this.config,
        responseMimeType: 'application/json'
      },
      safetySettings: this.getSafetySettings()
    };

    try {
      const response = await fetch(`${GEMINI_ENDPOINT}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        return this.handleApiError(response);
      }

      const result = await response.json();
      return this.processResponse(result);
      
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to AI service'
        }
      };
    }
  }

  private getSafetySettings() {
    // Disable all safety filters for receipt parsing (safe content)
    return [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ];
  }

  private processResponse(result: any): ParseResult {
    const candidate = result.candidates?.[0];
    
    if (!candidate) {
      return {
        success: false,
        error: { code: 'NO_RESPONSE', message: 'AI returned no response' }
      };
    }

    if (candidate.finishReason === 'SAFETY') {
      return {
        success: false,
        error: { code: 'BLOCKED', message: 'Content was blocked by safety filters' }
      };
    }

    const text = candidate.content?.parts?.[0]?.text;
    
    if (!text) {
      return {
        success: false,
        error: { code: 'EMPTY_RESPONSE', message: 'AI returned empty response' }
      };
    }

    try {
      const data = JSON.parse(text);
      const validated = this.validateAndEnrich(data);
      
      return {
        success: true,
        data: validated,
        metadata: {
          tokensUsed: result.usageMetadata?.totalTokenCount || 0,
          confidence: this.calculateConfidence(validated)
        }
      };
    } catch (parseError) {
      return {
        success: false,
        error: { code: 'INVALID_JSON', message: 'AI returned invalid JSON' },
        rawText: text
      };
    }
  }

  private validateAndEnrich(data: any): ParsedInvoice {
    // Ensure required fields
    const invoice: ParsedInvoice = {
      shopName: data.shopName || 'Unknown Store',
      shopAddress: data.shopAddress || null,
      date: this.normalizeDate(data.date) || new Date().toISOString().split('T')[0],
      invoiceNumber: data.invoiceNumber || null,
      subtotal: typeof data.subtotal === 'number' ? data.subtotal : null,
      tax: typeof data.tax === 'number' ? data.tax : null,
      total: typeof data.total === 'number' ? data.total : 0,
      currency: this.normalizeCurrency(data.currency),
      items: this.normalizeItems(data.items || [])
    };

    // Calculate missing total from items
    if (invoice.total === 0 && invoice.items.length > 0) {
      invoice.total = invoice.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }

    return invoice;
  }

  private normalizeDate(date: string | null): string | null {
    if (!date) return null;
    
    // Handle various date formats
    const patterns = [
      /^(\d{4})-(\d{2})-(\d{2})$/,           // YYYY-MM-DD
      /^(\d{2})\/(\d{2})\/(\d{4})$/,         // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/,           // DD-MM-YYYY
    ];

    for (const pattern of patterns) {
      const match = date.match(pattern);
      if (match) {
        if (pattern === patterns[0]) {
          return date; // Already correct format
        } else {
          // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }

    return date; // Return as-is if no pattern matches
  }

  private normalizeCurrency(currency: string | null): 'USD' | 'CDF' {
    if (!currency) return 'USD';
    
    const upper = currency.toUpperCase();
    if (upper === 'CDF' || upper.includes('FRANC') || upper === 'FC') {
      return 'CDF';
    }
    return 'USD';
  }

  private normalizeItems(items: any[]): ParsedItem[] {
    return items.map(item => ({
      name: this.cleanItemName(item.name || 'Unknown Item'),
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitPrice: Math.max(0, Number(item.unitPrice) || Number(item.totalPrice) || 0),
      totalPrice: Math.max(0, Number(item.totalPrice) || 
        (Number(item.unitPrice) * Number(item.quantity)) || 0)
    }));
  }

  private cleanItemName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')                    // Multiple spaces to single
      .replace(/[^\w\s()/-]/g, '')              // Remove special chars except basics
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private calculateConfidence(data: ParsedInvoice): number {
    let score = 1.0;
    
    // Penalize missing critical fields
    if (data.shopName === 'Unknown Store') score -= 0.15;
    if (!data.date) score -= 0.15;
    if (data.total === 0) score -= 0.25;
    if (data.items.length === 0) score -= 0.25;
    
    // Check items quality
    const badItems = data.items.filter(item => 
      item.name === 'Unknown Item' || item.totalPrice === 0
    ).length;
    score -= (badItems / Math.max(1, data.items.length)) * 0.2;
    
    // Verify totals
    const itemsSum = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const expectedTotal = data.subtotal || data.total;
    if (Math.abs(itemsSum - expectedTotal) > 1) {
      score -= 0.1; // Small discrepancy acceptable
    }

    return Math.max(0, Math.min(1, score));
  }

  private async handleApiError(response: Response): Promise<ParseResult> {
    const errorBody = await response.json().catch(() => ({}));
    
    const errorMap: Record<number, { code: string; message: string }> = {
      400: { code: 'BAD_REQUEST', message: 'Invalid image or request format' },
      401: { code: 'UNAUTHORIZED', message: 'API key is invalid' },
      403: { code: 'FORBIDDEN', message: 'API access denied' },
      429: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait and try again.' },
      500: { code: 'SERVER_ERROR', message: 'AI service temporarily unavailable' },
    };

    const error = errorMap[response.status] || {
      code: 'UNKNOWN',
      message: `Request failed with status ${response.status}`
    };

    return {
      success: false,
      error,
      rawResponse: errorBody
    };
  }
}

// Export singleton
export const geminiClient = new GeminiClient();
```

### Type Definitions

```typescript
// src/shared/types/gemini.types.ts

export interface ParsedInvoice {
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

export interface ParsedItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedInvoice;
  error?: ParseError;
  metadata?: ParseMetadata;
  rawText?: string;
  rawResponse?: any;
}

export interface ParseError {
  code: string;
  message: string;
}

export interface ParseMetadata {
  tokensUsed: number;
  confidence: number;
}
```

## Image Preparation

### Best Practices for Receipt Images

```typescript
// src/features/scanner/utils/imagePrep.ts

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface ImagePrepOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

const DEFAULT_OPTIONS: ImagePrepOptions = {
  maxWidth: 1024,
  maxHeight: 1536,
  quality: 0.8,
};

export async function prepareImageForParsing(
  imageUri: string,
  options: Partial<ImagePrepOptions> = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Resize and compress
  const manipulated = await manipulateAsync(
    imageUri,
    [
      { resize: { width: opts.maxWidth, height: opts.maxHeight } }
    ],
    {
      compress: opts.quality,
      format: SaveFormat.JPEG,
      base64: true,
    }
  );

  return manipulated.base64!;
}

export function validateImageQuality(imageUri: string): Promise<ImageQualityResult> {
  // Basic validation - could be enhanced with actual image analysis
  return new Promise((resolve) => {
    Image.getSize(
      imageUri,
      (width, height) => {
        const isAcceptable = width >= 300 && height >= 400;
        resolve({
          isAcceptable,
          width,
          height,
          suggestions: isAcceptable ? [] : ['Image resolution is too low. Try taking a closer photo.']
        });
      },
      () => {
        resolve({
          isAcceptable: false,
          width: 0,
          height: 0,
          suggestions: ['Could not read image. Please try again.']
        });
      }
    );
  });
}

interface ImageQualityResult {
  isAcceptable: boolean;
  width: number;
  height: number;
  suggestions: string[];
}
```

## Error Handling & Retry Logic

```typescript
// src/features/scanner/hooks/useInvoiceScanner.ts

import { useState, useCallback } from 'react';
import { geminiClient } from '@/shared/services/gemini/client';
import { prepareImageForParsing } from '../utils/imagePrep';

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

export function useInvoiceScanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedInvoice | null>(null);

  const scanInvoice = useCallback(async (imageUri: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    let lastError: string = '';
    
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Prepare image
        const base64 = await prepareImageForParsing(imageUri);
        
        // Parse with Gemini
        const parseResult = await geminiClient.parseInvoice(base64);
        
        if (parseResult.success && parseResult.data) {
          // Check confidence threshold
          if (parseResult.metadata?.confidence && parseResult.metadata.confidence < 0.5) {
            setError('Receipt was hard to read. Please review the extracted data carefully.');
          }
          
          setResult(parseResult.data);
          setIsLoading(false);
          return parseResult.data;
        }
        
        lastError = parseResult.error?.message || 'Unknown error';
        
        // Don't retry on certain errors
        if (['UNAUTHORIZED', 'FORBIDDEN', 'BAD_REQUEST'].includes(parseResult.error?.code || '')) {
          break;
        }
        
        // Wait before retry
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
        }
        
      } catch (e) {
        lastError = e instanceof Error ? e.message : 'Unknown error';
      }
    }

    setError(lastError);
    setIsLoading(false);
    return null;
  }, []);

  return {
    scanInvoice,
    isLoading,
    error,
    result,
    clearResult: () => setResult(null),
    clearError: () => setError(null),
  };
}
```

## Testing

### Mock Responses for Testing

```typescript
// src/shared/services/gemini/__mocks__/client.ts

export const mockParsedInvoice: ParsedInvoice = {
  shopName: "Shoprite Gombe",
  shopAddress: "Avenue du Commerce, Gombe, Kinshasa",
  date: "2025-11-28",
  invoiceNumber: "INV-2025-001234",
  subtotal: 33.00,
  tax: 2.75,
  total: 35.75,
  currency: "USD",
  items: [
    {
      name: "Banana (kg)",
      quantity: 2.0,
      unitPrice: 1.50,
      totalPrice: 3.00
    },
    {
      name: "Cooking Oil (5L)",
      quantity: 1.0,
      unitPrice: 12.50,
      totalPrice: 12.50
    },
    {
      name: "Rice (25kg)",
      quantity: 1.0,
      unitPrice: 18.00,
      totalPrice: 18.00
    }
  ]
};

export const mockGeminiClient = {
  parseInvoice: jest.fn().mockResolvedValue({
    success: true,
    data: mockParsedInvoice,
    metadata: {
      tokensUsed: 1500,
      confidence: 0.92
    }
  })
};
```

---

*Next: [Payment Integration](./PAYMENT_INTEGRATION.md)*
