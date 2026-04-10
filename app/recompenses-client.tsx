import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { DashboardClientLoader } from '@/components/ScreenLoader';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import type { Theme } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api';
import type { RecompenseValidee } from '@/lib/types';

export default function RecompensesClient() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [recompenses, setRecompenses] = useState<RecompenseValidee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/client/recompenses')
      .then(r => setRecompenses(r.data.recompenses))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour" accessibilityRole="button">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes récompenses</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <DashboardClientLoader />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.xxl, paddingBottom: insets.bottom + spacing.huge }}
          showsVerticalScrollIndicator={false}
        >
          {recompenses.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏆</Text>
              <Text style={styles.emptyTitle}>Pas encore de récompenses</Text>
              <Text style={styles.emptySubtitle}>Continuez à scanner pour débloquer vos premières récompenses !</Text>
            </Animated.View>
          ) : (
            <>
              <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.totalBadge}>
                <Text style={styles.totalText}>🎁 {recompenses.length} récompense{recompenses.length > 1 ? 's' : ''} débloquée{recompenses.length > 1 ? 's' : ''}</Text>
              </Animated.View>
              {recompenses.map((r, i) => (
                <Animated.View key={r.id} entering={FadeInDown.duration(400).delay(i * 60).springify()} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconCircle}>
                      <Text style={styles.iconEmoji}>🏆</Text>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.commercantNom}>{r.carte.commercant.nom}</Text>
                    <Text style={styles.carteNom}>{r.carte.nom}</Text>
                    {r.carte.recompense != null && (
                      <View style={styles.recompenseBadge}>
                        <Text style={styles.recompenseText}>{r.carte.recompense}€ offerts</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.date}>
                    {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </Text>
                </Animated.View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 32, color: colors.primary, lineHeight: 36 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyEmoji: { fontSize: 64, marginBottom: spacing.xl },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: spacing.sm, textAlign: 'center' },
    emptySubtitle: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },
    totalBadge: {
      backgroundColor: `${colors.primary}18`,
      borderRadius: radius.xl,
      padding: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    totalText: { fontSize: 15, fontWeight: '600', color: colors.primary },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      gap: spacing.md,
      ...shadow.card,
    },
    cardLeft: {},
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#fff8e1',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconEmoji: { fontSize: 24 },
    cardContent: { flex: 1 },
    commercantNom: { fontSize: 15, fontWeight: '700', color: theme.text },
    carteNom: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
    recompenseBadge: {
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
      backgroundColor: '#e8f8f5',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    recompenseText: { fontSize: 12, color: '#27ae60', fontWeight: '700' },
    date: { fontSize: 12, color: theme.textMuted, textAlign: 'right' },
  });
}
