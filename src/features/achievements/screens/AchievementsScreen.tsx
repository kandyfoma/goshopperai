// Achievements Screen - Gamification and user progress
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '@/shared/contexts';
import {
  savingsTrackerService,
  UserStats,
  Achievement,
} from '@/shared/services/firebase';
import {COLORS} from '@/shared/utils/constants';

export function AchievementsScreen() {
  const navigation = useNavigation();
  const {user} = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const loadData = async () => {
    if (!user?.uid) return;

    try {
      const [userStats, userAchievements] = await Promise.all([
        savingsTrackerService.getStats(user.uid),
        savingsTrackerService.getAchievements(user.uid),
      ]);

      setStats(userStats);
      setAchievements(userAchievements);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const levelInfo = stats
    ? savingsTrackerService.getLevelInfo(stats.level)
    : null;
  const xpProgress = stats ? (stats.xp / stats.xpToNextLevel) * 100 : 0;
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Succès</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Level Card */}
        {stats && levelInfo && (
          <View style={[styles.levelCard, {borderColor: levelInfo.color}]}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelIcon}>{levelInfo.icon}</Text>
              <View style={styles.levelInfo}>
                <Text style={styles.levelTitle}>{levelInfo.title}</Text>
                <Text style={styles.levelTitleLingala}>
                  {levelInfo.titleLingala}
                </Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={[styles.levelNumber, {color: levelInfo.color}]}>
                  Niv. {stats.level}
                </Text>
              </View>
            </View>

            {/* XP Progress Bar */}
            <View style={styles.xpContainer}>
              <View style={styles.xpBar}>
                <View
                  style={[
                    styles.xpProgress,
                    {width: `${xpProgress}%`, backgroundColor: levelInfo.color},
                  ]}
                />
              </View>
              <Text style={styles.xpText}>
                {stats.xp} / {stats.xpToNextLevel} XP
              </Text>
            </View>
          </View>
        )}

        {/* Stats Overview */}
        {stats && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statValue}>{stats.totalScans}</Text>
              <Text style={styles.statLabel}>Scans</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>
                ${stats.totalSavings.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Économisé</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statValue}>{stats.currentStreak}</Text>
              <Text style={styles.statLabel}>Série</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🏪</Text>
              <Text style={styles.statValue}>{stats.shopsVisited}</Text>
              <Text style={styles.statLabel}>Magasins</Text>
            </View>
          </View>
        )}

        {/* Achievements Section */}
        <View style={styles.achievementsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Accomplissements</Text>
            <Text style={styles.sectionCount}>
              {unlockedCount} / {achievements.length}
            </Text>
          </View>

          {/* Unlocked Achievements */}
          <View style={styles.achievementGroup}>
            <Text style={styles.groupTitle}>Débloqués</Text>
            {achievements.filter(a => a.isUnlocked).length === 0 ? (
              <Text style={styles.emptyText}>
                Continuez à scanner pour débloquer des succès !
              </Text>
            ) : (
              achievements
                .filter(a => a.isUnlocked)
                .map(achievement => (
                  <View key={achievement.id} style={styles.achievementCard}>
                    <View style={styles.achievementIcon}>
                      <Text style={styles.achievementIconText}>
                        {achievement.icon}
                      </Text>
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={styles.achievementTitle}>
                        {achievement.title}
                      </Text>
                      <Text style={styles.achievementTitleLingala}>
                        {achievement.titleLingala}
                      </Text>
                      <Text style={styles.achievementDesc}>
                        {achievement.description}
                      </Text>
                    </View>
                    <View style={styles.achievementXP}>
                      <Text style={styles.achievementXPText}>
                        +{achievement.xpReward} XP
                      </Text>
                    </View>
                  </View>
                ))
            )}
          </View>

          {/* Locked Achievements */}
          <View style={styles.achievementGroup}>
            <Text style={styles.groupTitle}>À débloquer</Text>
            {achievements
              .filter(a => !a.isUnlocked)
              .map(achievement => (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    styles.achievementCardLocked,
                  ]}>
                  <View
                    style={[
                      styles.achievementIcon,
                      styles.achievementIconLocked,
                    ]}>
                    <Text style={styles.achievementIconText}>🔒</Text>
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text
                      style={[
                        styles.achievementTitle,
                        styles.achievementTitleLocked,
                      ]}>
                      {achievement.title}
                    </Text>
                    <Text style={styles.achievementDesc}>
                      {achievement.description}
                    </Text>

                    {/* Progress Bar */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${
                                (achievement.progress / achievement.target) *
                                100
                              }%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {achievement.progress} / {achievement.target}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.achievementXP}>
                    <Text
                      style={[
                        styles.achievementXPText,
                        styles.achievementXPLocked,
                      ]}>
                      +{achievement.xpReward} XP
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </View>

        {/* Streak Info */}
        {stats && stats.longestStreak > 0 && (
          <View style={styles.streakCard}>
            <Text style={styles.streakIcon}>🔥</Text>
            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>Plus longue série</Text>
              <Text style={styles.streakValue}>
                {stats.longestStreak} jours
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray[600],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  levelCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  levelTitleLingala: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontStyle: 'italic',
  },
  levelBadge: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpBar: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.gray[200],
    borderRadius: 6,
    marginRight: 12,
    overflow: 'hidden',
  },
  xpProgress: {
    height: '100%',
    borderRadius: 6,
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[600],
    minWidth: 80,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  achievementsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  sectionCount: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontWeight: '600',
  },
  achievementGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[500],
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  achievementCardLocked: {
    opacity: 0.7,
    backgroundColor: COLORS.gray[50],
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementIconLocked: {
    backgroundColor: COLORS.gray[200],
  },
  achievementIconText: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  achievementTitleLocked: {
    color: COLORS.gray[600],
  },
  achievementTitleLingala: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontStyle: 'italic',
  },
  achievementDesc: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.gray[200],
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary[400],
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.gray[500],
    fontWeight: '600',
    minWidth: 40,
  },
  achievementXP: {
    marginLeft: 8,
  },
  achievementXPText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary[600],
  },
  achievementXPLocked: {
    color: COLORS.gray[400],
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  streakIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
});
