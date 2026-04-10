import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import { notifStore, type NotifItem } from '@/lib/notif-store';

export default function NotificationsInbox() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [notifs, setNotifs] = useState<NotifItem[]>([]);

  const charger = useCallback(async () => {
    const all = await notifStore.getAll();
    setNotifs(all);
    await notifStore.marquerLues();
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const vider = async () => {
    await notifStore.vider();
    setNotifs([]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return 'À l\'instant';
    if (diff < 3_600_000) return `Il y a ${Math.floor(diff / 60_000)} min`;
    if (diff < 86_400_000) return `Il y a ${Math.floor(diff / 3_600_000)}h`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour" accessibilityRole="button">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifs.length > 0 ? (
          <TouchableOpacity onPress={vider} style={{ paddingHorizontal: spacing.sm }}>
            <Text style={styles.clearBtn}>Vider</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 50 }} />}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xxl, paddingBottom: insets.bottom + spacing.huge }}
        showsVerticalScrollIndicator={false}
      >
        {notifs.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>Vos notifications apparaîtront ici</Text>
          </Animated.View>
        ) : notifs.map((n, i) => (
          <Animated.View key={n.id} entering={FadeInDown.duration(400).delay(i * 40).springify()} style={[styles.notifCard, !n.lu && styles.notifCardUnread]}>
            <View style={styles.notifIcon}>
              <Text style={{ fontSize: 22 }}>🔔</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              {n.body ? <Text style={styles.notifBody}>{n.body}</Text> : null}
              <Text style={styles.notifDate}>{formatDate(n.receivedAt)}</Text>
            </View>
            {!n.lu && <View style={styles.unreadDot} />}
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg,
      borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: theme.surface,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 32, color: colors.primary, lineHeight: 36 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
    clearBtn: { fontSize: 14, color: colors.error, fontWeight: '600' },
    emptyContainer: { alignItems: 'center', paddingTop: 60 },
    emptyEmoji: { fontSize: 56, marginBottom: spacing.xl },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: spacing.sm },
    emptySubtitle: { fontSize: 14, color: theme.textMuted },
    notifCard: {
      flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
      backgroundColor: theme.surface, borderRadius: radius.xl,
      padding: spacing.lg, marginBottom: spacing.sm, ...shadow.card,
    },
    notifCardUnread: {
      borderLeftWidth: 3, borderLeftColor: colors.primary,
    },
    notifIcon: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: `${colors.primary}18`,
      alignItems: 'center', justifyContent: 'center',
    },
    notifTitle: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 2 },
    notifBody: { fontSize: 13, color: theme.textMuted, lineHeight: 18, marginBottom: 4 },
    notifDate: { fontSize: 11, color: theme.textMuted },
    unreadDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: colors.primary, marginTop: 6,
    },
  });
}
