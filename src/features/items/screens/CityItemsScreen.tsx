// City Items Screen - Browse items from all users in the same city
// Shows aggregated price data for community price comparison
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
} from '@/shared/theme/theme';
import {Icon} from '@/shared/components';
import {useAuth, useUser} from '@/shared/contexts';
import {RootStackParamList} from '@/shared/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CityItemsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {isAuthenticated} = useAuth();
  const {profile: userProfile} = useUser();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
    }
  }, [isAuthenticated, navigation]);

  if (!userProfile?.defaultCity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Icon name="map-pin" size="3xl" color={Colors.text.secondary} />
          <Text style={styles.centerTitle}>Ville non définie</Text>
          <Text style={styles.centerSubtitle}>
            Définissez votre ville dans les paramètres pour voir les articles de votre communauté.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsButtonText}>Aller aux paramètres</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // For now, show coming soon message
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size="lg" color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Articles de {userProfile.defaultCity}</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.centerContainer}>
        <Icon name="users" size="3xl" color={Colors.primary} />
        <Text style={styles.centerTitle}>Fonctionnalité à venir</Text>
        <Text style={styles.centerSubtitle}>
          Bientôt, vous pourrez découvrir les prix des articles scannés par d'autres utilisateurs de {userProfile.defaultCity}.
          {'\n\n'}
          Cette fonctionnalité permettra de comparer les prix et découvrir les meilleures affaires dans votre ville.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  centerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  centerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  settingsButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.white,
    fontWeight: Typography.fontWeight.bold,
  },
});