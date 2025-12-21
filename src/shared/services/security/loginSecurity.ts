// Login attempt tracking service for security
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LoginAttempt {
  phoneNumber: string;
  timestamp: number;
  success: boolean;
}

interface AccountLockInfo {
  phoneNumber: string;
  lockUntil: number;
  attemptCount: number;
}

class LoginSecurityService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour
  private readonly STORAGE_KEY = 'login_attempts';
  private readonly LOCKOUT_KEY = 'account_locks';

  /**
   * Record a login attempt
   */
  async recordAttempt(phoneNumber: string, success: boolean): Promise<void> {
    const attempt: LoginAttempt = {
      phoneNumber,
      timestamp: Date.now(),
      success,
    };

    try {
      // Get existing attempts
      const attempts = await this.getAttempts();
      
      // Add new attempt
      attempts.push(attempt);
      
      // Clean old attempts (older than 1 hour)
      const cutoff = Date.now() - this.ATTEMPT_WINDOW;
      const recentAttempts = attempts.filter(a => a.timestamp > cutoff);
      
      // Save attempts
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentAttempts));

      // If failed attempt, check for lockout
      if (!success) {
        await this.checkAndApplyLockout(phoneNumber);
      } else {
        // Clear lockout on successful login
        await this.clearLockout(phoneNumber);
      }
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  }

  /**
   * Check if account is locked
   */
  async isAccountLocked(phoneNumber: string): Promise<{ locked: boolean; lockUntil?: number; remainingTime?: number }> {
    try {
      const locks = await this.getLocks();
      const lock = locks.find(l => l.phoneNumber === phoneNumber);
      
      if (!lock) {
        return { locked: false };
      }

      const now = Date.now();
      if (now < lock.lockUntil) {
        const remainingTime = lock.lockUntil - now;
        return { 
          locked: true, 
          lockUntil: lock.lockUntil,
          remainingTime 
        };
      } else {
        // Lock expired, remove it
        await this.clearLockout(phoneNumber);
        return { locked: false };
      }
    } catch (error) {
      console.error('Error checking account lock:', error);
      return { locked: false };
    }
  }

  /**
   * Get failed attempts count for phone number
   */
  async getFailedAttemptsCount(phoneNumber: string): Promise<number> {
    try {
      const attempts = await this.getAttempts();
      const cutoff = Date.now() - this.ATTEMPT_WINDOW;
      
      const recentFailedAttempts = attempts.filter(
        a => a.phoneNumber === phoneNumber && 
             !a.success && 
             a.timestamp > cutoff
      );
      
      return recentFailedAttempts.length;
    } catch (error) {
      console.error('Error getting failed attempts count:', error);
      return 0;
    }
  }

  /**
   * Get remaining attempts before lockout
   */
  async getRemainingAttempts(phoneNumber: string): Promise<number> {
    const failedAttempts = await this.getFailedAttemptsCount(phoneNumber);
    return Math.max(0, this.MAX_ATTEMPTS - failedAttempts);
  }

  /**
   * Check if login should be delayed (rate limiting)
   */
  async shouldDelayLogin(phoneNumber: string): Promise<{ delay: boolean; seconds: number }> {
    try {
      const attempts = await this.getAttempts();
      const now = Date.now();
      const recentAttempts = attempts.filter(
        a => a.phoneNumber === phoneNumber && 
             a.timestamp > (now - 60000) && // Last minute
             !a.success
      );

      // If more than 2 failed attempts in the last minute, add delay
      if (recentAttempts.length >= 2) {
        const delaySeconds = Math.min(recentAttempts.length * 2, 30); // Max 30 seconds
        return { delay: true, seconds: delaySeconds };
      }

      return { delay: false, seconds: 0 };
    } catch (error) {
      console.error('Error checking login delay:', error);
      return { delay: false, seconds: 0 };
    }
  }

  /**
   * Clear all data for a phone number (admin function)
   */
  async clearUserData(phoneNumber: string): Promise<void> {
    try {
      // Clear attempts
      const attempts = await this.getAttempts();
      const filteredAttempts = attempts.filter(a => a.phoneNumber !== phoneNumber);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredAttempts));

      // Clear lockouts
      await this.clearLockout(phoneNumber);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Get security status for phone number
   */
  async getSecurityStatus(phoneNumber: string): Promise<{
    failedAttempts: number;
    remainingAttempts: number;
    locked: boolean;
    lockUntil?: number;
    remainingLockTime?: number;
    shouldDelay: boolean;
    delaySeconds: number;
  }> {
    const [
      failedAttempts,
      remainingAttempts,
      lockInfo,
      delayInfo
    ] = await Promise.all([
      this.getFailedAttemptsCount(phoneNumber),
      this.getRemainingAttempts(phoneNumber),
      this.isAccountLocked(phoneNumber),
      this.shouldDelayLogin(phoneNumber)
    ]);

    return {
      failedAttempts,
      remainingAttempts,
      locked: lockInfo.locked,
      lockUntil: lockInfo.lockUntil,
      remainingLockTime: lockInfo.remainingTime,
      shouldDelay: delayInfo.delay,
      delaySeconds: delayInfo.seconds,
    };
  }

  /**
   * Format remaining time for display
   */
  formatRemainingTime(milliseconds: number): string {
    const minutes = Math.ceil(milliseconds / (60 * 1000));
    if (minutes < 1) return 'moins d\'une minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  }

  // Private methods
  private async getAttempts(): Promise<LoginAttempt[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting attempts:', error);
      return [];
    }
  }

  private async getLocks(): Promise<AccountLockInfo[]> {
    try {
      const data = await AsyncStorage.getItem(this.LOCKOUT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting locks:', error);
      return [];
    }
  }

  private async checkAndApplyLockout(phoneNumber: string): Promise<void> {
    const failedAttempts = await this.getFailedAttemptsCount(phoneNumber);
    
    if (failedAttempts >= this.MAX_ATTEMPTS) {
      const locks = await this.getLocks();
      const existingLockIndex = locks.findIndex(l => l.phoneNumber === phoneNumber);
      
      const lockInfo: AccountLockInfo = {
        phoneNumber,
        lockUntil: Date.now() + this.LOCKOUT_DURATION,
        attemptCount: failedAttempts,
      };

      if (existingLockIndex >= 0) {
        locks[existingLockIndex] = lockInfo;
      } else {
        locks.push(lockInfo);
      }

      await AsyncStorage.setItem(this.LOCKOUT_KEY, JSON.stringify(locks));
    }
  }

  private async clearLockout(phoneNumber: string): Promise<void> {
    try {
      const locks = await this.getLocks();
      const filteredLocks = locks.filter(l => l.phoneNumber !== phoneNumber);
      await AsyncStorage.setItem(this.LOCKOUT_KEY, JSON.stringify(filteredLocks));
    } catch (error) {
      console.error('Error clearing lockout:', error);
    }
  }
}

export const loginSecurityService = new LoginSecurityService();