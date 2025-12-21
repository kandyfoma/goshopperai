// Recommendation Engine - AI-powered personalized recommendations
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import {APP_ID} from '@/shared/services/firebase/config';

export interface RecommendationItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  averagePrice: number;
  lastSeenDate: string;
  frequency: number; // How often user buys this
  stores: string[]; // Where it's available
  imageUrl?: string;
}

export interface Recommendation {
  id: string;
  type: 'personalized' | 'price_alert' | 'bundle' | 'seasonal';
  title: string;
  description: string;
  items: RecommendationItem[];
  confidence: number; // 0-1
  reason: string; // Why this is recommended
  priority: number; // Higher = more important
  expiresAt: Date;
  createdAt: Date;
}

export interface BundleRecommendation {
  items: string[]; // Item names that go well together
  reason: string;
  savings: number; // Potential savings
}

class RecommendationEngineService {
  private db = firestore();

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<Recommendation[]> {
    try {
      const userPath = `artifacts/${APP_ID}/users/${userId}`;
      const userDoc = await this.db.doc(userPath).get();
      
      if (!userDoc.exists) {
        return [];
      }

      const userData = userDoc.data();
      const behaviorProfile = userData?.behaviorProfile;
      const recPreferences = userData?.recommendationPreferences;

      // Check if recommendations are enabled
      if (recPreferences?.enablePersonalizedRecommendations === false) {
        return [];
      }

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const recommendationsToday = await this.db
        .collection(`${userPath}/recommendations`)
        .where('createdAt', '>=', firestore.Timestamp.fromDate(today))
        .where('status', '==', 'shown')
        .get();

      const maxPerDay = recPreferences?.maxRecommendationsPerDay || 5;
      if (recommendationsToday.size >= maxPerDay) {
        return [];
      }

      const recommendations: Recommendation[] = [];

      // 1. Category-based recommendations (top categories)
      if (behaviorProfile?.topCategories && behaviorProfile.topCategories.length > 0) {
        const categoryRecs = await this.getCategoryBasedRecommendations(
          userId,
          behaviorProfile.topCategories.slice(0, 3),
          recPreferences?.dismissedRecommendations || []
        );
        recommendations.push(...categoryRecs);
      }

      // 2. Brand affinity recommendations
      if (behaviorProfile?.brandAffinities && behaviorProfile.brandAffinities.length > 0) {
        const brandRecs = await this.getBrandBasedRecommendations(
          userId,
          behaviorProfile.brandAffinities.slice(0, 3),
          recPreferences?.dismissedRecommendations || []
        );
        recommendations.push(...brandRecs);
      }

      // 3. Price-conscious recommendations
      if (behaviorProfile?.priceConsciousness) {
        const priceRecs = await this.getPriceBasedRecommendations(
          userId,
          behaviorProfile.priceConsciousness,
          recPreferences?.dismissedRecommendations || []
        );
        recommendations.push(...priceRecs);
      }

      // 4. Shopping pattern recommendations (what's due to buy)
      if (behaviorProfile?.shoppingFrequency) {
        const patternRecs = await this.getPatternBasedRecommendations(
          userId,
          behaviorProfile
        );
        recommendations.push(...patternRecs);
      }

      // Sort by priority and confidence
      recommendations.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return b.confidence - a.confidence;
      });

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Get category-based recommendations
   */
  private async getCategoryBasedRecommendations(
    userId: string,
    topCategories: any[],
    dismissed: string[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const userPath = `artifacts/${APP_ID}/users/${userId}`;

    for (const categoryPref of topCategories) {
      const category = categoryPref.category;
      const interestScore = categoryPref.interestScore || 50;

      // Find items in this category from city items
      const userDoc = await this.db.doc(userPath).get();
      const city = userDoc.data()?.city || 'kinshasa';

      const itemsSnapshot = await this.db
        .collection(`artifacts/${APP_ID}/cities/${city}/items`)
        .where('category', '==', category)
        .orderBy('popularity', 'desc')
        .limit(3)
        .get();

      if (!itemsSnapshot.empty) {
        const items: RecommendationItem[] = itemsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            category: data.category || '',
            brand: data.brand,
            averagePrice: data.averagePrice || 0,
            lastSeenDate: data.lastSeenDate || new Date().toISOString(),
            frequency: data.frequency || 0,
            stores: data.stores || [],
            imageUrl: data.imageUrl,
          };
        });

        const recId = `cat_${category}_${Date.now()}`;
        if (!dismissed.includes(recId)) {
          recommendations.push({
            id: recId,
            type: 'personalized',
            title: `Suggestions pour ${category}`,
            description: `Basé sur vos achats fréquents dans cette catégorie`,
            items,
            confidence: interestScore / 100,
            reason: `Vous achetez souvent dans la catégorie ${category}`,
            priority: Math.floor(interestScore / 10),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            createdAt: new Date(),
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Get brand-based recommendations
   */
  private async getBrandBasedRecommendations(
    userId: string,
    brandAffinities: any[],
    dismissed: string[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const userPath = `artifacts/${APP_ID}/users/${userId}`;

    for (const brandAff of brandAffinities) {
      const brand = brandAff.brand;
      const loyaltyScore = brandAff.loyaltyScore || 50;

      // Find new items from this brand
      const userDoc = await this.db.doc(userPath).get();
      const city = userDoc.data()?.city || 'kinshasa';

      const itemsSnapshot = await this.db
        .collection(`artifacts/${APP_ID}/cities/${city}/items`)
        .where('brand', '==', brand)
        .orderBy('lastSeenDate', 'desc')
        .limit(3)
        .get();

      if (!itemsSnapshot.empty) {
        const items: RecommendationItem[] = itemsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            category: data.category || '',
            brand: data.brand,
            averagePrice: data.averagePrice || 0,
            lastSeenDate: data.lastSeenDate || new Date().toISOString(),
            frequency: data.frequency || 0,
            stores: data.stores || [],
            imageUrl: data.imageUrl,
          };
        });

        const recId = `brand_${brand}_${Date.now()}`;
        if (!dismissed.includes(recId)) {
          recommendations.push({
            id: recId,
            type: 'personalized',
            title: `Nouveautés ${brand}`,
            description: `Découvrez les derniers produits de votre marque préférée`,
            items,
            confidence: loyaltyScore / 100,
            reason: `${brand} est l'une de vos marques préférées`,
            priority: Math.floor(loyaltyScore / 10),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Get price-based recommendations
   */
  private async getPriceBasedRecommendations(
    userId: string,
    priceConsciousness: string,
    dismissed: string[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // For budget-conscious users, recommend items on sale or with price drops
    if (priceConsciousness === 'budget') {
      const userPath = `artifacts/${APP_ID}/users/${userId}`;
      const userDoc = await this.db.doc(userPath).get();
      const city = userDoc.data()?.city || 'kinshasa';

      // Find items with recent price drops
      const alertsSnapshot = await this.db
        .collection(`${userPath}/priceAlerts`)
        .where('triggered', '==', true)
        .where('notified', '==', false)
        .limit(5)
        .get();

      if (!alertsSnapshot.empty) {
        const items: RecommendationItem[] = [];
        
        for (const alertDoc of alertsSnapshot.docs) {
          const alert = alertDoc.data();
          items.push({
            id: alert.itemName,
            name: alert.itemName,
            category: alert.category || '',
            averagePrice: alert.currentPrice || 0,
            lastSeenDate: new Date().toISOString(),
            frequency: 0,
            stores: [],
          });
        }

        if (items.length > 0) {
          const recId = `price_${Date.now()}`;
          if (!dismissed.includes(recId)) {
            recommendations.push({
              id: recId,
              type: 'price_alert',
              title: 'Alertes de prix',
              description: 'Ces articles ont baissé de prix!',
              items,
              confidence: 0.9,
              reason: 'Baisse de prix détectée sur vos articles surveillés',
              priority: 10,
              expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
              createdAt: new Date(),
            });
          }
        }
      }
    }

    return recommendations;
  }

  /**
   * Get pattern-based recommendations (items due to buy based on frequency)
   */
  private async getPatternBasedRecommendations(
    userId: string,
    behaviorProfile: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    
    // Calculate when user typically shops
    const lastActiveDate = behaviorProfile.lastActiveDate 
      ? new Date(behaviorProfile.lastActiveDate.toDate?.() || behaviorProfile.lastActiveDate)
      : new Date();
    
    const daysSinceLastShop = Math.floor(
      (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If user typically shops weekly and it's been 6+ days
    const shouldRemind = 
      (behaviorProfile.shoppingFrequency === 'weekly' && daysSinceLastShop >= 6) ||
      (behaviorProfile.shoppingFrequency === 'biweekly' && daysSinceLastShop >= 13);

    if (shouldRemind) {
      // Get user's most frequent items
      const userPath = `artifacts/${APP_ID}/users/${userId}`;
      const itemsSnapshot = await this.db
        .collection(`${userPath}/items`)
        .orderBy('frequency', 'desc')
        .limit(5)
        .get();

      if (!itemsSnapshot.empty) {
        const items: RecommendationItem[] = itemsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            category: data.category || '',
            brand: data.brand,
            averagePrice: data.averagePrice || 0,
            lastSeenDate: data.lastSeenDate || new Date().toISOString(),
            frequency: data.frequency || 0,
            stores: data.stores || [],
          };
        });

        recommendations.push({
          id: `pattern_${Date.now()}`,
          type: 'personalized',
          title: 'Temps de faire les courses?',
          description: `Vos articles habituels vous attendent`,
          items,
          confidence: 0.8,
          reason: `Vous faites généralement vos courses ${behaviorProfile.shoppingFrequency === 'weekly' ? 'chaque semaine' : 'toutes les deux semaines'}`,
          priority: 8,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          createdAt: new Date(),
        });
      }
    }

    return recommendations;
  }

  /**
   * Get bundle recommendations (items frequently bought together)
   */
  async getBundleRecommendations(userId: string): Promise<BundleRecommendation[]> {
    try {
      // This would use collaborative filtering or association rules
      // For now, return empty - implement ML model later
      return [];
    } catch (error) {
      console.error('Failed to get bundle recommendations:', error);
      return [];
    }
  }

  /**
   * Track when a recommendation is shown
   */
  async trackRecommendationShown(
    userId: string,
    recommendation: Recommendation
  ): Promise<void> {
    try {
      const userPath = `artifacts/${APP_ID}/users/${userId}`;
      await this.db
        .collection(`${userPath}/recommendations`)
        .doc(recommendation.id)
        .set({
          type: recommendation.type,
          title: recommendation.title,
          itemIds: recommendation.items.map(i => i.id),
          status: 'shown',
          shownAt: firestore.FieldValue.serverTimestamp(),
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      // Update engagement metrics
      await this.db.doc(userPath).update({
        'engagementMetrics.recommendationsShown': firestore.FieldValue.increment(1),
      });
    } catch (error) {
      console.error('Failed to track recommendation shown:', error);
    }
  }

  /**
   * Track when a recommendation is clicked
   */
  async trackRecommendationClick(
    userId: string,
    recommendationId: string
  ): Promise<void> {
    try {
      const userPath = `artifacts/${APP_ID}/users/${userId}`;
      await this.db
        .collection(`${userPath}/recommendations`)
        .doc(recommendationId)
        .update({
          status: 'clicked',
          clickedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Update engagement metrics
      await this.db.doc(userPath).update({
        'engagementMetrics.recommendationsClicked': firestore.FieldValue.increment(1),
      });
    } catch (error) {
      console.error('Failed to track recommendation click:', error);
    }
  }

  /**
   * Dismiss a recommendation
   */
  async dismissRecommendation(
    userId: string,
    recommendationId: string
  ): Promise<void> {
    try {
      const userPath = `artifacts/${APP_ID}/users/${userId}`;
      
      // Update recommendation status
      await this.db
        .collection(`${userPath}/recommendations`)
        .doc(recommendationId)
        .update({
          status: 'dismissed',
          dismissedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Add to dismissed list
      await this.db.doc(userPath).update({
        'recommendationPreferences.dismissedRecommendations': firestore.FieldValue.arrayUnion(recommendationId),
      });
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
    }
  }
}

export const recommendationEngineService = new RecommendationEngineService();
