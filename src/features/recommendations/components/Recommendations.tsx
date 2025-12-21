// Recommendations Component - Display AI-powered personalized recommendations
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import {recommendationEngineService, Recommendation, RecommendationItem} from '@/shared/services/firebase/recommendationEngineService';
import {useAuth} from '@/shared/contexts';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '@/shared/theme/theme';
import {Icon} from '@/shared/components';
import {formatCurrency} from '@/shared/utils/helpers';

interface RecommendationsProps {
  onItemPress?: (item: RecommendationItem) => void;
  limit?: number;
}

export function Recommendations({onItemPress, limit = 5}: RecommendationsProps) {
  const {user} = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRecommendations();
  }, [user?.uid]);

  const loadRecommendations = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const recs = await recommendationEngineService.getPersonalizedRecommendations(
        user.uid,
        limit
      );
      setRecommendations(recs);

      // Track that recommendations were shown
      for (const rec of recs) {
        await recommendationEngineService.trackRecommendationShown(user.uid, rec);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (recId: string) => {
    if (!user?.uid) return;

    try {
      await recommendationEngineService.dismissRecommendation(user.uid, recId);
      setDismissedIds(prev => new Set([...prev, recId]));
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
    }
  };

  const handleItemPress = async (rec: Recommendation, item: RecommendationItem) => {
    if (!user?.uid) return;

    try {
      await recommendationEngineService.trackRecommendationClick(user.uid, rec.id);
      onItemPress?.(item);
    } catch (error) {
      console.error('Failed to track recommendation click:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement des recommandations...</Text>
      </View>
    );
  }

  const visibleRecs = recommendations.filter(rec => !dismissedIds.has(rec.id));

  if (visibleRecs.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="sparkles" size="md" color={Colors.primary} />
        <Text style={styles.headerTitle}>Recommandations pour vous</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {visibleRecs.map(rec => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            onItemPress={item => handleItemPress(rec, item)}
            onDismiss={() => handleDismiss(rec.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onItemPress: (item: RecommendationItem) => void;
  onDismiss: () => void;
}

function RecommendationCard({
  recommendation,
  onItemPress,
  onDismiss,
}: RecommendationCardProps) {
  const getTypeIcon = () => {
    switch (recommendation.type) {
      case 'price_alert':
        return 'trending-down';
      case 'bundle':
        return 'gift';
      case 'seasonal':
        return 'calendar';
      default:
        return 'star';
    }
  };

  const getTypeColor = () => {
    switch (recommendation.type) {
      case 'price_alert':
        return '#10B981'; // success green
      case 'bundle':
        return Colors.secondary;
      case 'seasonal':
        return '#3B82F6'; // info blue
      default:
        return Colors.primary;
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.typeIcon, {backgroundColor: getTypeColor() + '20'}]}>
            <Icon name={getTypeIcon()} size="sm" color={getTypeColor()} />
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {recommendation.title}
          </Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Icon name="x" size="sm" color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Description */}
      <Text style={styles.cardDescription} numberOfLines={2}>
        {recommendation.description}
      </Text>

      {/* Reason Badge */}
      <View style={styles.reasonBadge}>
        <Icon name="info" size="xs" color={Colors.text.secondary} />
        <Text style={styles.reasonText} numberOfLines={1}>
          {recommendation.reason}
        </Text>
      </View>

      {/* Items */}
      <View style={styles.itemsContainer}>
        {recommendation.items.slice(0, 3).map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.item}
            onPress={() => onItemPress(item)}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              {item.brand && (
                <Text style={styles.itemBrand} numberOfLines={1}>
                  {item.brand}
                </Text>
              )}
              <Text style={styles.itemPrice}>
                {formatCurrency(item.averagePrice)}
              </Text>
            </View>
            <Icon name="chevron-right" size="sm" color={Colors.text.secondary} />
          </TouchableOpacity>
        ))}

        {recommendation.items.length > 3 && (
          <Text style={styles.moreItems}>
            +{recommendation.items.length - 3} autres articles
          </Text>
        )}
      </View>

      {/* Confidence Indicator */}
      <View style={styles.confidenceContainer}>
        <View style={[styles.confidenceBar, {width: `${recommendation.confidence * 100}%`}]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    marginLeft: Spacing.xs,
    color: Colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  card: {
    width: 300,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.text.primary,
    flex: 1,
  },
  dismissButton: {
    padding: Spacing.xs,
  },
  cardDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  reasonText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  itemsContainer: {
    marginTop: Spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  itemBrand: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  moreItems: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  confidenceContainer: {
    height: 3,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: '#10B981',
  },
});
