import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import type { Theme } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { apiClient, API_BASE_URL } from '@/lib/api';
import { authStorage } from '@/lib/auth-storage';
import type { StatsAvancees } from '@/lib/types';

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function MiniGraphe({ courbe }: { courbe: StatsAvancees['courbe30j'] }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const max = Math.max(...courbe.map(d => d.scans), 1);
  // Affiche 10 points équirépartis
  const points = courbe.filter((_, i) => i % 3 === 0);

  return (
    <View style={styles.graphCard}>
      <Text style={styles.graphTitle}>Scans — 30 derniers jours</Text>
      <View style={styles.graphBars}>
        {points.map((d, i) => {
          const h = Math.max((d.scans / max) * 80, d.scans > 0 ? 6 : 2);
          const jour = new Date(d.date);
          return (
            <View key={i} style={styles.graphCol}>
              <Text style={styles.graphCount}>{d.scans > 0 ? d.scans : ''}</Text>
              <View style={styles.graphBarBg}>
                <View style={[styles.graphBar, { height: h, backgroundColor: d.scans > 0 ? colors.primary : theme.borderLight }]} />
              </View>
              <Text style={styles.graphLabel}>{JOURS[jour.getDay()]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function StatsCommercant() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<StatsAvancees | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    apiClient.get<StatsAvancees>('/api/commercant/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const exporterCSV = async () => {
    setExportLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const token = await authStorage.getToken();
      const url = `${API_BASE_URL}/api/commercant/export-clients`;
      // Ouvre dans le navigateur — téléchargement natif
      await Linking.openURL(`${url}?token=${token}`);
    } catch {
      Alert.alert('Erreur', 'Impossible de lancer l\'export.');
    }
    setExportLoading(false);
  };

  const recap = stats?.recap;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerApp}>FidèlePro</Text>
          <Text style={styles.headerTitle}>Statistiques avancées</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.xxl, paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 60 }}>Chargement...</Text>
        ) : !stats ? (
          <Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 60 }}>Données indisponibles</Text>
        ) : (
          <>
            {/* Récap ce mois */}
            <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.recapGrid}>
              {[
                { icon: '🎯', val: recap!.scansMois, label: 'Scans ce mois' },
                { icon: '👥', val: recap!.clientsUniques30j, label: 'Clients uniques (30j)' },
                { icon: '🎁', val: recap!.recompensesMois, label: 'Récompenses validées' },
                { icon: '📊', val: recap!.totalScans, label: 'Scans total' },
              ].map((item, i) => (
                <Animated.View key={i} entering={FadeInDown.duration(400).delay(i * 60).springify()} style={styles.recapCard}>
                  <Text style={styles.recapIcon}>{item.icon}</Text>
                  <Text style={styles.recapVal}>{item.val}</Text>
                  <Text style={styles.recapLabel}>{item.label}</Text>
                </Animated.View>
              ))}
            </Animated.View>

            {/* Graphe 30j */}
            <Animated.View entering={FadeInDown.duration(500).delay(200).springify()}>
              <MiniGraphe courbe={stats.courbe30j} />
            </Animated.View>

            {/* Export CSV */}
            <Animated.View entering={FadeInDown.duration(500).delay(300).springify()}>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={exporterCSV}
                disabled={exportLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.exportIcon}>📥</Text>
                <View>
                  <Text style={styles.exportTitle}>Exporter mes clients</Text>
                  <Text style={styles.exportSubtitle}>Fichier CSV — compatible Excel</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xxl, paddingBottom: spacing.xl,
      borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
    headerApp: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    scroll: { flex: 1 },
    recapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    recapCard: {
      backgroundColor: theme.surface, borderRadius: radius.xl,
      padding: spacing.lg, flex: 1, minWidth: 140,
      alignItems: 'flex-start', ...shadow.statCard,
    },
    recapIcon: { fontSize: 22, marginBottom: spacing.sm },
    recapVal: { fontSize: 26, fontWeight: 'bold', color: colors.primary },
    recapLabel: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    graphCard: {
      backgroundColor: theme.surface, borderRadius: radius.xxl,
      padding: spacing.xl, marginBottom: spacing.xl, ...shadow.card,
    },
    graphTitle: { fontSize: 15, fontWeight: 'bold', color: theme.text, marginBottom: spacing.lg },
    graphBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
    graphCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
    graphCount: { fontSize: 9, color: colors.primary, fontWeight: 'bold', height: 13 },
    graphBarBg: { width: 18, height: 80, justifyContent: 'flex-end', borderRadius: 4, overflow: 'hidden', backgroundColor: theme.surfaceSecondary },
    graphBar: { width: '100%', borderRadius: 4 },
    graphLabel: { fontSize: 9, color: theme.textMuted, fontWeight: '500' },
    exportBtn: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
      backgroundColor: theme.surface, borderRadius: radius.xxl,
      padding: spacing.xl, ...shadow.card,
      borderWidth: 1.5, borderColor: colors.primary + '30',
    },
    exportIcon: { fontSize: 28 },
    exportTitle: { fontSize: 15, fontWeight: 'bold', color: theme.text },
    exportSubtitle: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  });
}
