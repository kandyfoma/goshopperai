// Verify OTP Screen - SMS verification for password reset
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute, RouteProp as NavigationRouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/types';
import {useAuth} from '@/shared/contexts';
import {smsService} from '@/shared/services/sms';
import {authService, userBehaviorService} from '@/shared/services/firebase';
import {Button, Icon} from '@/shared/components';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '@/shared/theme/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type VerifyOtpRouteProp = NavigationRouteProp<RootStackParamList, 'VerifyOtp'>;

const VerifyOtpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<VerifyOtpRouteProp>();
  const {user} = useAuth();
  const {phoneNumber, isRegistration = false, registrationData, isPhoneVerification = false} = route.params;
  
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Send OTP when screen loads for phone verification
  useEffect(() => {
    if (isPhoneVerification) {
      const sendInitialOTP = async () => {
        try {
          const result = await smsService.sendOTP(phoneNumber);
          if (!result.success) {
            setError(result.error || 'Erreur lors de l\'envoi du code');
          }
        } catch (err) {
          setError('Erreur réseau. Veuillez réessayer.');
        }
      };
      sendInitialOTP();
    }
  }, [isPhoneVerification, phoneNumber]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otpCode[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otpCode.join('');
    
    if (code.length !== 6) {
      setError('Veuillez saisir le code complet à 6 chiffres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await smsService.verifyOTP(phoneNumber, code);
      
      if (result.success) {
        if (isPhoneVerification && user?.uid) {
          // Verify phone for existing user
          try {
            await authService.verifyUserPhone(user.uid, phoneNumber);
            
            Alert.alert(
              'Numéro vérifié!',
              'Votre numéro de téléphone a été vérifié avec succès.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack()
                }
              ]
            );
          } catch (verifyError: any) {
            setError(verifyError.message || 'Erreur lors de la vérification');
          }
        } else if (isRegistration && registrationData) {
          // Complete registration with verification
          try {
            // First create the user account
            const user = await authService.createUserWithPhone({
              phoneNumber,
              password: registrationData.password,
              city: registrationData.city,
              countryCode: registrationData.countryCode
            });
            
            // Now mark the user as verified in the profile
            if (result.token && user.uid) {
              await authService.completeRegistration({
                userId: user.uid,
                verificationToken: result.token,
                phoneNumber,
                countryCode: registrationData.countryCode,
                displayName: phoneNumber
              });
              
              // Initialize behavior profile for new user
              await userBehaviorService.initializeBehaviorProfile(user.uid)
                .catch(err => console.log('Failed to initialize behavior profile:', err));
            }
            
            // Show success message and navigate to main app
            Alert.alert('Bienvenue!', 'Votre compte a été créé avec succès!', [
              {
                text: 'Commencer',
                onPress: () => navigation.reset({
                  index: 0,
                  routes: [{name: 'Main'}]
                })
              }
            ]);
          } catch (regError: any) {
            setError(regError.message || 'Erreur lors de la création du compte');
          }
        } else {
          // Navigate to reset password screen for forgot password flow
          navigation.navigate('ResetPassword', { 
            phoneNumber,
            verificationToken: result.token || 'verified' 
          });
        }
      } else {
        setError(result.error || 'Code de vérification incorrect');
        // Clear the OTP inputs
        setOtpCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError(null);

    try {
      const result = await smsService.sendOTP(phoneNumber);
      
      if (result.success) {
        Alert.alert('Code envoyé', 'Un nouveau code de vérification a été envoyé');
        // Reset countdown
        setCountdown(60);
        setCanResend(false);
        
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.error || 'Erreur lors du renvoi du code');
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setResendLoading(false);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display (hide middle digits)
    if (phone.length > 6) {
      return phone.slice(0, 3) + '****' + phone.slice(-3);
    }
    return phone;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size="md" color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Icon name="message-circle" size="3xl" color={Colors.accent} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{isRegistration ? 'Finaliser l\'inscription' : 'Vérification'}</Text>
            <Text style={styles.subtitle}>
              {isRegistration 
                ? `Entrez le code de vérification envoyé au ${formatPhoneNumber(phoneNumber)} pour créer votre compte`
                : `Entrez le code à 6 chiffres envoyé au ${formatPhoneNumber(phoneNumber)}`
              }
            </Text>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {otpCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                    error ? styles.otpInputError : null
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({nativeEvent}) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading}
                />
              ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Verify Button */}
            <Button
              variant="primary"
              title={isRegistration ? 'Créer mon compte' : 'Vérifier le code'}
              onPress={handleVerifyOTP}
              disabled={loading || otpCode.join('').length !== 6}
              loading={loading}
              icon={<Icon name={isRegistration ? 'user-plus' : 'check'} size="md" color="white" />}
              iconPosition="right"
            />

            {/* Resend Section */}
            <View style={styles.resendSection}>
              <Text style={styles.resendText}>
                Vous n'avez pas reçu le code ?
              </Text>
              
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={resendLoading}>
                  <Text style={styles.resendLink}>
                    {resendLoading ? 'Envoi en cours...' : 'Renvoyer'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.countdownText}>
                  Renvoyer dans {countdown}s
                </Text>
              )}
            </View>

            {/* Wrong Number */}
            <View style={styles.wrongNumberSection}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.wrongNumberButton}>
                <Text style={styles.wrongNumberText}>Mauvais numéro ?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    paddingTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    lineHeight: Typography.lineHeight.relaxed,
    paddingHorizontal: Spacing.md,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderRadius: BorderRadius.base,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.secondary,
    textAlign: 'center',
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
  },
  otpInputFilled: {
    borderColor: Colors.accent,
    backgroundColor: Colors.background.primary,
  },
  otpInputError: {
    borderColor: Colors.status.error,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.status.error,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  resendSection: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  resendText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  resendLink: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.accent,
  },
  countdownText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
  },
  wrongNumberSection: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  wrongNumberButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  wrongNumberText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textDecorationLine: 'underline',
  },
});

export default VerifyOtpScreen;