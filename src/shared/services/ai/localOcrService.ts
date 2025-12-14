// Local OCR Service
// Performs text recognition directly on device using ML Kit
// Fast, free, and privacy-friendly on-device OCR

import {Platform} from 'react-native';
import TextRecognition from '@react-native-ml-kit/text-recognition';

export interface OcrResult {
  success: boolean;
  text: string;
  blocks?: TextBlock[];
  error?: string;
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ReceiptData {
  success: boolean;
  confidence: number;
  merchant?: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total?: number;
  currency?: string;
  date?: string;
  rawText: string;
  error?: string;
}

class LocalOcrService {
  /**
   * Perform OCR on an image using ML Kit
   */
  async recognizeText(imageBase64: string): Promise<OcrResult> {
    try {
      // ML Kit expects a file path or data URI
      // Convert base64 to data URI if needed
      const imageUri = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`;

      // Perform text recognition using ML Kit
      const result = await TextRecognition.recognize(imageUri);
      
      // Transform ML Kit result to our format
      const blocks: TextBlock[] = result.blocks.map(block => ({
        text: block.text,
        confidence: 1.0, // ML Kit doesn't provide confidence per block
        boundingBox: block.frame ? {
          x: (block.frame as any).x || 0,
          y: (block.frame as any).y || 0,
          width: (block.frame as any).width || 0,
          height: (block.frame as any).height || 0
        } : undefined
      }));

      return {
        success: true,
        text: result.text,
        blocks
      };
      
    } catch (error: any) {
      console.error('OCR recognition error:', error);
      return {
        success: false,
        text: '',
        error: error.message || 'OCR failed'
      };
    }
  }

  /**
   * Extract structured receipt data from OCR text
   * Uses pattern matching and heuristics
   */
  async extractReceiptData(imageBase64: string): Promise<ReceiptData> {
    try {
      // Step 1: Perform OCR
      const ocrResult = await this.recognizeText(imageBase64);
      
      if (!ocrResult.success || !ocrResult.text) {
        return {
          success: false,
          confidence: 0,
          items: [],
          rawText: '',
          error: ocrResult.error || 'OCR failed'
        };
      }

      // Step 2: Extract structured data from text
      const text = ocrResult.text;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      // Extract merchant (usually at the top)
      const merchant = this.extractMerchant(lines);

      // Extract items with prices
      const items = this.extractItems(lines);

      // Extract total
      const total = this.extractTotal(lines);

      // Extract date
      const date = this.extractDate(lines);

      // Extract currency
      const currency = this.extractCurrency(text);

      // Calculate confidence
      const confidence = this.calculateConfidence({
        merchant,
        items,
        total,
        date,
        text
      });

      return {
        success: true,
        confidence,
        merchant,
        items,
        total,
        currency,
        date,
        rawText: text
      };

    } catch (error: any) {
      console.error('Receipt extraction error:', error);
      return {
        success: false,
        confidence: 0,
        items: [],
        rawText: '',
        error: error.message || 'Receipt extraction failed'
      };
    }
  }

  /**
   * Extract merchant name from receipt text
   */
  private extractMerchant(lines: string[]): string | undefined {
    // Look for merchant name in first few lines
    // Usually it's capitalized and at the top
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      
      // Skip lines with only numbers or special characters
      if (/^[\d\s\-\.\/]+$/.test(line)) continue;
      
      // Look for lines with mostly uppercase letters (store names)
      if (line.length >= 3 && /[A-Z]/.test(line)) {
        return line;
      }
    }

    return undefined;
  }

  /**
   * Extract items with prices from receipt text
   */
  private extractItems(lines: string[]): Array<{name: string; price: number; quantity: number}> {
    const items: Array<{name: string; price: number; quantity: number}> = [];

    // Common receipt patterns:
    // "Item Name    12.50"
    // "Item Name 2x 25.00"
    // "2 Item Name  25.00"
    const patterns = [
      // Pattern: "Item Name    12.50"
      /^(.+?)\s+(\d+[.,]\d{2})\s*$/,
      // Pattern: "Item Name 2x 25.00" or "Item Name x2 25.00"
      /^(.+?)\s+[xX]?(\d+)[xX]?\s+(\d+[.,]\d{2})\s*$/,
      // Pattern: "2 Item Name  25.00"
      /^(\d+)\s+(.+?)\s+(\d+[.,]\d{2})\s*$/,
    ];

    for (const line of lines) {
      // Skip common receipt headers/footers
      if (this.isHeaderOrFooter(line)) continue;

      // Try each pattern
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          let name: string;
          let price: number;
          let quantity = 1;

          if (pattern === patterns[0]) {
            // Pattern: "Item Name    12.50"
            name = match[1].trim();
            price = parseFloat(match[2].replace(',', '.'));
          } else if (pattern === patterns[1]) {
            // Pattern: "Item Name 2x 25.00"
            name = match[1].trim();
            quantity = parseInt(match[2], 10);
            price = parseFloat(match[3].replace(',', '.'));
          } else {
            // Pattern: "2 Item Name  25.00"
            quantity = parseInt(match[1], 10);
            name = match[2].trim();
            price = parseFloat(match[3].replace(',', '.'));
          }

          // Validate extracted data
          if (name.length >= 2 && price > 0 && quantity > 0) {
            items.push({
              name,
              price: price / quantity, // Unit price
              quantity
            });
            break; // Found match, skip other patterns
          }
        }
      }
    }

    return items;
  }

  /**
   * Extract total from receipt text
   */
  private extractTotal(lines: string[]): number | undefined {
    // Look for total in last lines
    const lastLines = lines.slice(-10); // Check last 10 lines

    const totalPatterns = [
      /total\s*:?\s*(\d+[.,]\d{2})/i,
      /montant\s*:?\s*(\d+[.,]\d{2})/i,
      /somme\s*:?\s*(\d+[.,]\d{2})/i,
      /^total\s+(\d+[.,]\d{2})/i,
    ];

    for (const line of lastLines) {
      for (const pattern of totalPatterns) {
        const match = line.match(pattern);
        if (match) {
          return parseFloat(match[1].replace(',', '.'));
        }
      }
    }

    return undefined;
  }

  /**
   * Extract date from receipt text
   */
  private extractDate(lines: string[]): string | undefined {
    const datePatterns = [
      // DD/MM/YYYY or DD-MM-YYYY
      /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,
      // DD/MM/YY or DD-MM-YY
      /(\d{2})[\/\-](\d{2})[\/\-](\d{2})/,
      // YYYY-MM-DD
      /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/,
    ];

    for (const line of lines.slice(0, 10)) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          return match[0]; // Return the full date string
        }
      }
    }

    return undefined;
  }

  /**
   * Extract currency from receipt text
   */
  private extractCurrency(text: string): string {
    if (/CDF|FC/i.test(text)) return 'CDF';
    if (/USD|\$|US/i.test(text)) return 'USD';
    if (/EUR|€/i.test(text)) return 'EUR';
    
    // Default to CDF for Congo
    return 'CDF';
  }

  /**
   * Calculate confidence score for extracted data
   */
  private calculateConfidence(data: {
    merchant?: string;
    items: any[];
    total?: number;
    date?: string;
    text: string;
  }): number {
    let confidence = 0.5; // Base confidence

    if (data.merchant) confidence += 0.1;
    if (data.items.length > 0) confidence += 0.2;
    if (data.total) confidence += 0.1;
    if (data.date) confidence += 0.05;

    // Check if items total matches receipt total
    if (data.items.length > 0 && data.total) {
      const itemsTotal = data.items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
      );
      const difference = Math.abs(itemsTotal - data.total);
      const tolerance = data.total * 0.01; // 1% tolerance

      if (difference <= tolerance) {
        confidence += 0.15; // Math matches - high confidence boost
      }
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Check if line is a header or footer (not an item)
   */
  private isHeaderOrFooter(line: string): boolean {
    const headerFooterPatterns = [
      /merci|thank you|au revoir|goodbye/i,
      /^total/i,
      /^montant/i,
      /^tva|tax/i,
      /facture|invoice|receipt/i,
      /^date/i,
      /^heure|time/i,
      /adresse|address/i,
      /telephone|phone|tel/i,
      /www\.|http/i,
    ];

    return headerFooterPatterns.some(pattern => pattern.test(line));
  }

  /**
   * Check if local OCR is available
   */
  isAvailable(): boolean {
    // ML Kit is available on both Android and iOS
    return Platform.OS === 'android' || Platform.OS === 'ios';
  }
}

export const localOcrService = new LocalOcrService();
