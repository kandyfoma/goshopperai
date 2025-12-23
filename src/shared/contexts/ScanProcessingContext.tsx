// Scan Processing Context - Manages background receipt scanning
// Similar to Facebook/Instagram post upload experience
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from 'react';
import {ReceiptScanResult, Receipt} from '@/shared/types';

export type ScanStatus = 'idle' | 'processing' | 'success' | 'error';

interface ScanProcessingState {
  status: ScanStatus;
  progress: number; // 0-100
  message: string;
  receipt?: Receipt;
  receiptId?: string;
  error?: string;
  photoCount?: number;
}

interface ScanProcessingContextType {
  state: ScanProcessingState;
  
  // Start background processing
  startProcessing: (photoCount: number) => void;
  
  // Update progress
  updateProgress: (progress: number, message: string) => void;
  
  // Set success with receipt data (pending user confirmation)
  setSuccess: (receipt: Receipt, receiptId: string) => void;
  
  // Set error
  setError: (error: string) => void;
  
  // User confirmed - now save to DB
  confirmAndSave: () => Promise<void>;
  
  // User cancelled or dismissed
  dismiss: () => void;
  
  // Reset to idle
  reset: () => void;
  
  // Check if processing is active
  isProcessing: boolean;
  
  // Check if awaiting user confirmation
  isAwaitingConfirmation: boolean;
}

const defaultState: ScanProcessingState = {
  status: 'idle',
  progress: 0,
  message: '',
};

const ScanProcessingContext = createContext<ScanProcessingContextType | undefined>(undefined);

interface ScanProcessingProviderProps {
  children: ReactNode;
}

export function ScanProcessingProvider({children}: ScanProcessingProviderProps) {
  const [state, setState] = useState<ScanProcessingState>(defaultState);
  
  // Callback ref for saving receipt (set by the scanner screen)
  const saveReceiptCallbackRef = useRef<(() => Promise<void>) | null>(null);
  
  const startProcessing = useCallback((photoCount: number) => {
    setState({
      status: 'processing',
      progress: 0,
      message: 'Préparation de l\'analyse...',
      photoCount,
    });
  }, []);
  
  const updateProgress = useCallback((progress: number, message: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(progress, 99), // Don't show 100% until actually done
      message,
    }));
  }, []);
  
  const setSuccess = useCallback((receipt: Receipt, receiptId: string) => {
    setState(prev => ({
      ...prev,
      status: 'success',
      progress: 100,
      message: 'Analyse terminée!',
      receipt,
      receiptId,
    }));
  }, []);
  
  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      status: 'error',
      progress: 0,
      message: error,
      error,
    }));
  }, []);
  
  const confirmAndSave = useCallback(async () => {
    if (saveReceiptCallbackRef.current) {
      await saveReceiptCallbackRef.current();
    }
    setState(defaultState);
  }, []);
  
  const dismiss = useCallback(() => {
    setState(defaultState);
  }, []);
  
  const reset = useCallback(() => {
    setState(defaultState);
  }, []);
  
  const isProcessing = state.status === 'processing';
  const isAwaitingConfirmation = state.status === 'success' && !!state.receipt;
  
  return (
    <ScanProcessingContext.Provider
      value={{
        state,
        startProcessing,
        updateProgress,
        setSuccess,
        setError,
        confirmAndSave,
        dismiss,
        reset,
        isProcessing,
        isAwaitingConfirmation,
      }}>
      {children}
    </ScanProcessingContext.Provider>
  );
}

export function useScanProcessing() {
  const context = useContext(ScanProcessingContext);
  if (!context) {
    throw new Error('useScanProcessing must be used within a ScanProcessingProvider');
  }
  return context;
}

export default ScanProcessingContext;
