// Quick Receipt Extraction Cloud Function
// Lightweight extraction of basic receipt info for duplicate detection

import * as functions from 'firebase-functions';
import vision from '@google-cloud/vision';

const visionClient = new vision.ImageAnnotatorClient();

interface QuickExtractRequest {
  imageBase64: string;
  extractFields: string[];
}

interface QuickExtractResponse {
  success: boolean;
  data?: {
    storeName?: string;
    date?: string;
    total?: number;
    currency?: string;
    confidence: number;
  };
  error?: string;
}

/**
 * Quick extraction function for duplicate detection
 * Extracts basic receipt information without full parsing
 */
export const quickExtractReceipt = functions
  .region('europe-west1')
  .https.onCall(async (data: QuickExtractRequest, context): Promise<QuickExtractResponse> => {
    // Verify authentication
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to extract receipts',
      );
    }

    try {
      const {imageBase64, extractFields} = data;

      if (!imageBase64) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Image data is required',
        );
      }

      // Convert base64 to buffer for Vision API
      const imageBuffer = Buffer.from(imageBase64, 'base64');

      // Use Vision API for OCR
      const [result] = await visionClient.textDetection({
        image: {content: imageBuffer},
      });

      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        return {
          success: false,
          error: 'No text detected in image',
        };
      }

      const rawText = detections[0].description;
      if (!rawText) {
        return {
          success: false,
          error: 'No text content found in image',
        };
      }

      const extractedData = extractBasicInfo(rawText, extractFields);

      return {
        success: true,
        data: extractedData,
      };
    } catch (error: any) {
      console.error('Quick extract error:', error);
      throw new functions.https.HttpsError(
        'internal',
        `Failed to extract receipt data: ${error.message}`,
      );
    }
  });

/**
 * Extract basic information from OCR text
 */
function extractBasicInfo(text: string, fields: string[]): any {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const result: any = {confidence: 0.5}; // Default confidence

  // Extract store name (usually first non-empty line or line with store indicators)
  if (fields.includes('storeName')) {
    const storeName = extractStoreName(lines);
    if (storeName) {
      result.storeName = storeName;
      result.confidence += 0.2;
    }
  }

  // Extract date
  if (fields.includes('date')) {
    const date = extractDate(lines);
    if (date) {
      result.date = date;
      result.confidence += 0.2;
    }
  }

  // Extract total amount
  if (fields.includes('total')) {
    const {total, currency} = extractTotal(lines);
    if (total) {
      result.total = total;
      result.currency = currency;
      result.confidence += 0.3;
    }
  }

  return result;
}

function extractStoreName(lines: string[]): string | null {
  // Common patterns for store names - simplified approach
  for (const line of lines.slice(0, 5)) { // Check first 5 lines
    if (line.length > 2 && line.length < 50) {
      // Skip lines that look like addresses, phones, or dates
      if (
        !/\d{4}-\d{2}-\d{2}/.test(line) && // Not a date
        !/\d{3,}/.test(line.replace(/\D/g, '')) && // Not mostly numbers
        !/@/.test(line) && // Not an email
        !/^(TEL|PHONE|FAX)/i.test(line) // Not a phone line
      ) {
        return line;
      }
    }
  }

  return null;
}

/**
 * Extract date from receipt lines
 */
function extractDate(lines: string[]): string | null {
  const datePatterns = [
    /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/, // YYYY-MM-DD or YYYY/MM/DD
    /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/, // DD-MM-YYYY or MM/DD/YYYY
    /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i, // DD Mon YYYY
  ];

  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        // Normalize to YYYY-MM-DD format
        if (pattern.source.includes('YYYY')) {
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else {
          // Assume MM/DD/YYYY or DD/MM/YYYY - this is ambiguous, default to MM/DD/YYYY
          const year = match[3];
          const month = match[1].padStart(2, '0');
          const day = match[2].padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }
    }
  }

  return null;
}

/**
 * Extract total amount from receipt lines
 */
function extractTotal(lines: string[]): {total: number | null; currency: string} {
  const totalPatterns = [
    /(?:TOTAL|AMOUNT|SUM)[\s:]*\$?(\d+(?:\.\d{2})?)/i,
    /\$(\d+(?:\.\d{2})?)/, // $X.XX format
    /(\d+(?:\.\d{2})?)\s*\$/, // X.XX $ format
    /(?:TOTAL|AMOUNT)[\s:]*(\d+(?:\.\d{2})?)/i,
  ];

  // Look for total from the bottom up (usually at the end)
  const reversedLines = [...lines].reverse();

  for (const line of reversedLines.slice(0, 10)) { // Check last 10 lines
    for (const pattern of totalPatterns) {
      const match = line.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        if (amount > 0 && amount < 10000) { // Reasonable receipt total
          const currency = line.includes('$') ? 'USD' : 'CDF'; // Simple currency detection
          return {total: amount, currency};
        }
      }
    }
  }

  return {total: null, currency: 'USD'};
}