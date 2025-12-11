// Login Screen - Comprehensive authentication with full features
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Keyboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/types';
import {authService} from '@/shared/services/firebase';
import {COLORS} from '@/shared/utils/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Firebase error messages in French
const getErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'auth/invalid-email': 'L\'adresse email est invalide.',
    'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
    'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
    'auth/operation-not-allowed': 'Cette méthode de connexion n\'est pas activée.',
  };
  return errorMessages[errorCode] || 'Une erreur est survenue. Veuillez réessayer.';
};

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Refs
  const passwordInputRef = useRef<TextInput>(null);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Shake animation for errors
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {toValue: 10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: -10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: 10, duration: 50, useNativeDriver: true}),
      Animated.timing(shakeAnimation, {toValue: 0, duration: 50, useNativeDriver: true}),
    ]).start();
  };

  // Validate email
  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError('L\'email est requis');
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setEmailError('Format d\'email invalide');
      return false;
    }
    setEmailError(null);
    return true;
  };

  // Validate password
  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Le mot de passe est requis');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  // Handle login
  const handleLogin = async () => {
    Keyboard.dismiss();
    setError(null);
    setSuccessMessage(null);

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      triggerShake();
      return;
    }

    console.log('🔐 Login attempt with:', email);
    setLoading(true);

    try {
      const user = await authService.signInWithEmail(email.trim(), password);
      console.log('✅ Login successful, user:', user?.uid);
      
      setSuccessMessage('Connexion réussie! Redirection...');
      
      // The AuthContext will handle navigation automatically
      // But if it doesn't happen within 3 seconds, show an error
      setTimeout(() => {
        setLoading(false);
      }, 3000);
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      const errorMessage = getErrorMessage(err.code || '');
      setError(errorMessage);
      triggerShake();
      setLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setEmailError('Entrez votre email pour réinitialiser le mot de passe');
      triggerShake();
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setEmailError('Format d\'email invalide');
      triggerShake();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.sendPasswordResetEmail(email.trim());
      setSuccessMessage('Email de réinitialisation envoyé! Vérifiez votre boîte de réception.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(getErrorMessage(err.code || ''));
    } finally {
      setLoading(false);
    }
  };

  // Handle social sign in (placeholder)
  const handleGoogleSignIn = async () => {
    setError('La connexion Google sera disponible prochainement');
  };

  const handleAppleSignIn = async () => {
    setError('La connexion Apple sera disponible prochainement');
  };

  // Clear field errors on change
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError(null);
    if (error) setError(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) setPasswordError(null);
    if (error) setError(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          
          <Animated.View style={[styles.content, {opacity: fadeAnim}]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>🛒</Text>
              <Text style={styles.title}>GoShopperAI</Text>
              <Text style={styles.subtitle}>
                Scannez vos reçus, économisez plus
              </Text>
            </View>

            {/* Success Message */}
            {successMessage && (
              <View style={styles.successBanner}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* Error Message */}
            {error && (
              <Animated.View 
                style={[
                  styles.errorBanner,
                  {transform: [{translateX: shakeAnimation}]}
                ]}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Form */}
            <Animated.View 
              style={[
                styles.form,
                {transform: [{translateX: shakeAnimation}]}
              ]}>
              
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={[
                  styles.inputWrapper,
                  emailError ? styles.inputError : null,
                  loading && styles.inputDisabled
                ]}>
                  <Text style={styles.inputIcon}>📧</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="votre@email.com"
                    placeholderTextColor={COLORS.gray[400]}
                    value={email}
                    onChangeText={handleEmailChange}
                    onBlur={() => email && validateEmail(email)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>
                {emailError && (
                  <Text style={styles.fieldError}>{emailError}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={[
                  styles.inputWrapper,
                  passwordError ? styles.inputError : null,
                  loading && styles.inputDisabled
                ]}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.gray[400]}
                    value={password}
                    onChangeText={handlePasswordChange}
                    onBlur={() => password && validatePassword(password)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    disabled={loading}>
                    <Text style={styles.eyeIcon}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {passwordError && (
                  <Text style={styles.fieldError}>{passwordError}</Text>
                )}
              </View>

              {/* Remember Me & Forgot Password */}
              <View style={styles.optionsRow}>
                <TouchableOpacity 
                  style={styles.rememberMe}
                  onPress={() => setRememberMe(!rememberMe)}
                  disabled={loading}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberMeText}>Se souvenir de moi</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handleForgotPassword}
                  disabled={loading}>
                  <Text style={styles.forgotPassword}>Mot de passe oublié?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.primaryButton,
                  loading && styles.buttonDisabled
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <View style={styles.loadingContent}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.loadingText}>Connexion en cours...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Se connecter</Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou continuer avec</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={[styles.socialButton, loading && styles.buttonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                  activeOpacity={0.7}>
                  <Text style={styles.socialIcon}>G</Text>
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={[styles.socialButton, styles.appleButton, loading && styles.buttonDisabled]}
                    onPress={handleAppleSignIn}
                    disabled={loading}
                    activeOpacity={0.7}>
                    <Text style={[styles.socialIcon, styles.appleIcon]}></Text>
                    <Text style={[styles.socialButtonText, styles.appleText]}>Apple</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Vous n'avez pas de compte?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                disabled={loading}>
                <Text style={styles.linkText}> Créer un compte</Text>
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <Text style={styles.terms}>
              En vous connectant, vous acceptez nos{' '}
              <Text style={styles.termsLink}>Conditions d'utilisation</Text>
              {' '}et notre{' '}
              <Text style={styles.termsLink}>Politique de confidentialité</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 72,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  successIcon: {
    fontSize: 18,
    color: '#155724',
    marginRight: 12,
    fontWeight: 'bold',
  },
  successText: {
    flex: 1,
    color: '#155724',
    fontSize: 14,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  errorText: {
    flex: 1,
    color: '#721c24',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  inputDisabled: {
    backgroundColor: COLORS.gray[100],
    opacity: 0.7,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },
  fieldError: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[500],
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberMeText: {
    color: COLORS.gray[600],
    fontSize: 14,
  },
  forgotPassword: {
    color: COLORS.primary[500],
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary[500],
    shadowColor: COLORS.primary[500],
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.gray[500],
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  socialIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  socialButtonText: {
    color: COLORS.gray[700],
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  appleIcon: {
    color: '#fff',
  },
  appleText: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: COLORS.gray[600],
    fontSize: 15,
  },
  linkText: {
    color: COLORS.primary[500],
    fontSize: 15,
    fontWeight: '700',
  },
  terms: {
    textAlign: 'center',
    color: COLORS.gray[500],
    fontSize: 12,
    marginTop: 24,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.primary[500],
    fontWeight: '500',
  },
});
