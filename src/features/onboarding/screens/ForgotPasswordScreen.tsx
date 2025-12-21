// Forgot Password Screen - SMS OTP based password reset
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/types';
import {Button, Icon} from '@/shared/components';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '@/shared/theme/theme';
import {TextInput, TouchableOpacity} from 'react-native-gesture-handler';
import {smsService} from '@/shared/services/sms';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove spaces and special characters
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if it starts with + and has 10-15 digits after
    const phoneRegex = /^\+?[1-9]\d{8,14}$/;
    return phoneRegex.test(cleanPhone);
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      setError('Veuillez saisir votre numéro de téléphone');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Veuillez saisir un numéro de téléphone valide');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await smsService.sendOTP(phoneNumber);
      
      if (result.success) {
        // Navigate to OTP verification screen
        navigation.navigate('VerifyOtp', { phoneNumber });
      } else {
        setError(result.error || 'Erreur lors de l\'envoi du code');
      }
    } catch (err) {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    if (error) {
      setError(null);
    }
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
              <Icon name="lock" size="3xl" color={Colors.accent} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Mot de passe oublié</Text>
            <Text style={styles.subtitle}>
              Entrez votre numéro de téléphone pour recevoir un code de vérification
            </Text>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Numéro de téléphone</Text>
              <View style={[styles.inputWrapper, !!error && styles.inputError]}>
                <Icon name="phone" size="sm" color={Colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="+243 123 456 789"
                  placeholderTextColor={Colors.text.tertiary}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            {/* Send OTP Button */}
            <Button
              variant="primary"
              title="Envoyer le code"
              onPress={handleSendOTP}
              disabled={loading || !phoneNumber.trim()}
              loading={loading}
              rightIcon="arrow-right"
            />

            {/* Back to Login */}
            <View style={styles.backToLogin}>
              <Text style={styles.backToLoginText}>
                Vous vous souvenez de votre mot de passe ?
              </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backToLoginLink}> Se connecter</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.guestFooter}>
              <Text style={styles.footerText}>
                Récupérer votre compte c'est{' '}
                <Text style={styles.footerHighlight}>gratuit, rapide et sécurisé</Text>
              </Text>
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
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.base,
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.status.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  backToLogin: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  backToLoginText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
  },
  backToLoginLink: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.accent,
  },

  // Guest Footer
  guestFooter: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing.base,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  footerHighlight: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
});

export default ForgotPasswordScreen;
