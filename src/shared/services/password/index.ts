// Password validation service with comprehensive edge case handling
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number; // 0-100
}

export interface PasswordRequirements {
  minLength: number;
  requireNumbers: boolean;
  requireLowercase: boolean;
  requireUppercase: boolean;
  requireSpecialChars: boolean;
  maxLength: number;
  allowSpaces: boolean;
}

class PasswordService {
  // Common weak passwords to reject
  private readonly COMMON_PASSWORDS = [
    '123456', '123456789', 'qwerty', 'password', 'password123',
    '111111', '123123', 'admin', 'letmein', 'welcome',
    '000000', 'qwerty123', 'abc123', 'password1', '1234567890',
    'azerty', 'qwerty12', '1q2w3e4r', 'password12', 'abcdef',
    '12345678', 'azerty123', 'motdepasse', 'bonjour', 'salut'
  ];

  // Default requirements for the app
  private readonly DEFAULT_REQUIREMENTS: PasswordRequirements = {
    minLength: 6,
    requireNumbers: true,
    requireLowercase: false,
    requireUppercase: false,
    requireSpecialChars: false,
    maxLength: 128,
    allowSpaces: false,
  };

  // Strong password requirements
  private readonly STRONG_REQUIREMENTS: PasswordRequirements = {
    minLength: 8,
    requireNumbers: true,
    requireLowercase: true,
    requireUppercase: true,
    requireSpecialChars: true,
    maxLength: 128,
    allowSpaces: false,
  };

  /**
   * Validate password with comprehensive edge case checking
   */
  validatePassword(
    password: string,
    requirements: PasswordRequirements = this.DEFAULT_REQUIREMENTS,
    personalInfo?: { phone?: string; name?: string; email?: string }
  ): PasswordValidationResult {
    const errors: string[] = [];
    let score = 0;

    // Edge Case 1: Empty or null password
    if (!password) {
      return {
        isValid: false,
        errors: ['Le mot de passe est requis'],
        strength: 'weak',
        score: 0,
      };
    }

    // Edge Case 2: Whitespace-only password
    if (!password.trim()) {
      return {
        isValid: false,
        errors: ['Le mot de passe ne peut pas contenir uniquement des espaces'],
        strength: 'weak',
        score: 0,
      };
    }

    // Edge Case 3: Trim and check actual content
    const trimmedPassword = password.trim();
    if (trimmedPassword !== password) {
      errors.push('Le mot de passe ne doit pas commencer ou finir par des espaces');
    }

    // Edge Case 4: Length validation
    if (password.length < requirements.minLength) {
      errors.push(`Le mot de passe doit contenir au moins ${requirements.minLength} caractères`);
    } else {
      score += 20;
    }

    // Edge Case 5: Maximum length protection (DOS prevention)
    if (password.length > requirements.maxLength) {
      errors.push(`Le mot de passe ne peut pas dépasser ${requirements.maxLength} caractères`);
    }

    // Edge Case 6: Space handling
    if (!requirements.allowSpaces && password.includes(' ')) {
      errors.push('Le mot de passe ne peut pas contenir d\'espaces');
    }

    // Edge Case 7: Character requirements
    if (requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    } else if (/\d/.test(password)) {
      score += 15;
    }

    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
    } else if (/[a-z]/.test(password)) {
      score += 10;
    }

    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
    } else if (/[A-Z]/.test(password)) {
      score += 15;
    }

    if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 20;
    }

    // Edge Case 8: Common password detection
    const lowerPassword = password.toLowerCase();
    if (this.COMMON_PASSWORDS.includes(lowerPassword)) {
      errors.push('Ce mot de passe est trop commun. Choisissez quelque chose de plus sécurisé');
    }

    // Edge Case 9: Sequential/repeated characters
    if (this.hasSequentialChars(password)) {
      errors.push('Évitez les séquences de caractères (123, abc, etc.)');
      score -= 10;
    }

    if (this.hasRepeatedChars(password)) {
      errors.push('Évitez de répéter le même caractère plusieurs fois');
      score -= 5;
    }

    // Edge Case 10: Personal information detection
    if (personalInfo && this.containsPersonalInfo(password, personalInfo)) {
      errors.push('Le mot de passe ne doit pas contenir vos informations personnelles');
    }

    // Edge Case 11: Unicode/emoji handling
    if (this.hasUnsafeUnicode(password)) {
      errors.push('Le mot de passe contient des caractères non supportés');
    }

    // Bonus points for length and complexity
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (this.hasMixedCharTypes(password)) score += 10;

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (score < 40) strength = 'weak';
    else if (score < 70) strength = 'medium';
    else strength = 'strong';

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score,
    };
  }

  /**
   * Check if password contains sequential characters
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = ['123', '234', '345', '456', '567', '678', '789', '890',
                      'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij'];
    
    const lowerPassword = password.toLowerCase();
    return sequences.some(seq => lowerPassword.includes(seq));
  }

  /**
   * Check if password has too many repeated characters
   */
  private hasRepeatedChars(password: string): boolean {
    // Check for 3 or more consecutive repeated characters
    return /(.)\1{2,}/.test(password);
  }

  /**
   * Check if password contains personal information
   */
  private containsPersonalInfo(password: string, personalInfo: { phone?: string; name?: string; email?: string }): boolean {
    const lowerPassword = password.toLowerCase();
    
    // Check phone number (without country code)
    if (personalInfo.phone) {
      const cleanPhone = personalInfo.phone.replace(/[^\d]/g, '');
      if (cleanPhone.length > 3 && lowerPassword.includes(cleanPhone.slice(-8))) {
        return true;
      }
    }

    // Check name
    if (personalInfo.name && personalInfo.name.length > 2) {
      const lowerName = personalInfo.name.toLowerCase();
      if (lowerPassword.includes(lowerName)) {
        return true;
      }
    }

    // Check email username
    if (personalInfo.email) {
      const emailUsername = personalInfo.email.split('@')[0].toLowerCase();
      if (emailUsername.length > 2 && lowerPassword.includes(emailUsername)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for unsafe Unicode characters
   */
  private hasUnsafeUnicode(password: string): boolean {
    // Allow basic Latin, numbers, and common special characters
    const safePattern = /^[\x20-\x7E\u00A0-\u00FF]+$/;
    return !safePattern.test(password);
  }

  /**
   * Check if password has mixed character types
   */
  private hasMixedCharTypes(password: string): boolean {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length >= 3;
  }

  /**
   * Get password requirements for different contexts
   */
  getRequirements(context: 'login' | 'register' | 'reset' | 'change'): PasswordRequirements {
    switch (context) {
      case 'register':
      case 'reset':
        return this.DEFAULT_REQUIREMENTS;
      case 'change':
        return this.STRONG_REQUIREMENTS;
      case 'login':
        return { ...this.DEFAULT_REQUIREMENTS, minLength: 1 }; // Allow existing weak passwords for login
      default:
        return this.DEFAULT_REQUIREMENTS;
    }
  }

  /**
   * Get password strength color for UI
   */
  getStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
    switch (strength) {
      case 'weak': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'strong': return '#2ed573';
    }
  }

  /**
   * Check if passwords match (with proper trimming)
   */
  passwordsMatch(password1: string, password2: string): boolean {
    return password1.trim() === password2.trim();
  }

  /**
   * Sanitize password input (basic cleanup)
   */
  sanitizePassword(password: string): string {
    // Remove any control characters but keep valid spaces
    return password.replace(/[\x00-\x1F\x7F]/g, '');
  }
}

export const passwordService = new PasswordService();

// Export commonly used methods for direct access
export const validatePassword = passwordService.validatePassword.bind(passwordService);
export const sanitizePassword = passwordService.sanitizePassword.bind(passwordService);