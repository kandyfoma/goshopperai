// SMS Service - Placeholder implementation
// TODO: Replace with actual SMS provider (Twilio, AWS SNS, etc.)

class SMSService {
  private otpStore = new Map<string, string>();

  /**
   * Send OTP via SMS (placeholder)
   */
  async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP for verification (in production, store in secure backend)
      this.otpStore.set(phoneNumber, otp);
      
      // TODO: Replace with actual SMS provider
      console.log(`📱 SMS OTP Sent to ${phoneNumber}: ${otp}`);
      console.log(`🔐 [SMS Service] OTP for ${phoneNumber} is: ${otp}`);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return { 
        success: false, 
        error: 'Failed to send SMS. Please try again.' 
      };
    }
  }

  /**
   * Verify OTP
   */
  verifyOTP(phoneNumber: string, enteredOTP: string): {success: boolean; error?: string; token?: string} {
    const storedOTP = this.otpStore.get(phoneNumber);
    
    if (!storedOTP) {
      console.log(`❌ No OTP found for ${phoneNumber}`);
      return { success: false, error: 'Code de vérification expiré ou invalide' };
    }

    const isValid = storedOTP === enteredOTP;
    
    if (isValid) {
      console.log(`✅ OTP verified successfully for ${phoneNumber}`);
      // Clear OTP after successful verification
      this.otpStore.delete(phoneNumber);
      return { success: true, token: 'verified_' + Date.now() };
    } else {
      console.log(`❌ Invalid OTP for ${phoneNumber}. Expected: ${storedOTP}, Got: ${enteredOTP}`);
      return { success: false, error: 'Code de vérification incorrect' };
    }
  }

  /**
   * Clear OTP for a phone number
   */
  clearOTP(phoneNumber: string): void {
    this.otpStore.delete(phoneNumber);
    console.log(`🗑️ Cleared OTP for ${phoneNumber}`);
  }
}

export const smsService = new SMSService();