// Image compression service for reducing data usage
import {Image} from 'react-native-compressor';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1600,
  quality: 0.7, // 70% quality - good balance for OCR
};

class ImageCompressionService {
  /**
   * Compress an image for AI processing
   * Reduces file size by ~90% while maintaining OCR readability
   */
  async compressForAI(
    imagePath: string,
    options: CompressionOptions = {},
  ): Promise<string> {
    const mergedOptions = {...DEFAULT_OPTIONS, ...options};

    try {
      const compressedPath = await Image.compress(imagePath, {
        maxWidth: mergedOptions.maxWidth,
        maxHeight: mergedOptions.maxHeight,
        quality: mergedOptions.quality,
        input: 'uri',
        returnableOutputType: 'uri',
      });

      return compressedPath;
    } catch (error) {
      console.error('Image compression failed:', error);
      // Return original if compression fails
      return imagePath;
    }
  }

  /**
   * Compress image and convert to base64 for API
   */
  async compressToBase64(
    imagePath: string,
    options: CompressionOptions = {},
  ): Promise<string> {
    const compressedPath = await this.compressForAI(imagePath, options);
    
    // Read compressed image as base64
    const RNFS = require('react-native-fs');
    const base64 = await RNFS.readFile(compressedPath, 'base64');
    
    return base64;
  }

  /**
   * Get compression presets for different use cases
   */
  getPreset(preset: 'thumbnail' | 'standard' | 'high'): CompressionOptions {
    const presets: Record<string, CompressionOptions> = {
      thumbnail: {
        maxWidth: 200,
        maxHeight: 200,
        quality: 0.5,
      },
      standard: {
        maxWidth: 1200,
        maxHeight: 1600,
        quality: 0.7,
      },
      high: {
        maxWidth: 2000,
        maxHeight: 2500,
        quality: 0.85,
      },
    };

    return presets[preset] || presets.standard;
  }
}

export const imageCompressionService = new ImageCompressionService();
