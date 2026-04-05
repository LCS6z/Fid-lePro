import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clientAPI, Progression } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import LoyaltyCard from '../../components/LoyaltyCard';
import { Colors } from '../../constants/colors';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const [progressions, setProgressions] = useState<Progression[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await clientAPI.getProgression();
      setProgressions(data);
    } catch {
      // silencieux si déjà des données affichées
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const prenom = user?.nom?.split(' ')[0] ?? 'vous';

  const totalTampons = progressions.reduce((acc, p) => acc + p.tamponsActuels, 0);
  const cartesPresque = progressions.filter(
    (p) => p.pourcentage >= 80 && p.tamponsActuels < p.maxTampons
  ).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header gradient */}
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.headerGradient}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.headerContent}>
          <Text style={styles.greeting}>Bonjour, {prenom} 👋</Text>
          <Text style={styles.subtitle}>Voici vos cartes de fidélité</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{progressions.length}</Text>
              <Text style={styles.statLabel}>Cartes actives</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalTampons}</Text>
              <Text style={styles.statLabel}>Tampons au total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{cartesPresque}</Text>
              <Text style={styles.statLabel}>Presque gagnées</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Liste */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={progressions}
          keyExtractor={(item) => item.carteId}
          renderItem={({ item, index }) => (
            <LoyaltyCard progression={item} index={index} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎴</Text>
              <Text style={styles.emptyTitle}>Aucune carte pour l'instant</Text>
              <Text style={styles.emptyText}>
                Rendez-vous chez un commerçant partenaire et faites scanner votre QR code pour commencer.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {},
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 20,
    paddingTop: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
