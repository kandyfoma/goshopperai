// Register Screen - Email/password registration
import React, {useState} from 'react';
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
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/types';
import {authService} from '@/shared/services/firebase';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '@/shared/theme/theme';
import {Icon} from '@/shared/components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function RegisterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Erreur',
        'Le mot de passe doit contenir au moins 6 caractères',
      );
      return;
    }

    setLoading(true);
    try {
      await authService.signUpWithEmail(email, password);
      // Navigation will be handled by AuthContext
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Inscription échouée');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Alert.alert(
      'Bientôt disponible',
      'La connexion Google sera disponible prochainement',
    );
  };

  const handleAppleSignIn = async () => {
    Alert.alert(
      'Bientôt disponible',
      'La connexion Apple sera disponible prochainement',
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Icon name="user-plus" size="2xl" color={Colors.white} variant="filled" />
            </View>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>
              Commencez à économiser aujourd'hui
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name="mail" size="md" color={Colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor={Colors.text.tertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size="md" color={Colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Au moins 6 caractères"
                  placeholderTextColor={Colors.text.tertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size="md" color={Colors.text.secondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Répétez le mot de passe"
                  placeholderTextColor={Colors.text.tertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleRegister}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>S'inscrire</Text>
                  <Icon name="arrow-right" size="md" color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social buttons */}
            <TouchableOpacity
              style={[styles.button, styles.socialButton]}
              onPress={handleGoogleSignIn}
              disabled={loading}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.socialButtonText}>
                Continuer avec Google
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.button, styles.socialButton, styles.appleButton]}
                onPress={handleAppleSignIn}
                disabled={loading}>
                <Icon name="apple" size="md" color={Colors.white} />
                <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                  Continuer avec Apple
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              disabled={loading}>
              <Text style={styles.linkText}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadows.lg,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  form: {
    marginBottom: Spacing['2xl'],
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.background.primary,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  button: {
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    ...Shadows.md,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  buttonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.light,
  },
  dividerText: {
    marginHorizontal: Spacing.sm,
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.md,
  },
  socialButton: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  googleIcon: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#4285F4',
  },
  socialButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
  },
  appleButton: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  appleButtonText: {
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.md,
  },
  linkText: {
    color: Colors.accent,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default RegisterScreen;
