import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FormInput } from '@/components/FormInput';
import { Toast, useToast } from '@/components/Toast';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import type { Theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { type ThemePreference, useTheme } from '@/context/ThemeContext';
import { useBiometricLock } from '@/hooks/useBiometricLock';
import { apiClient } from '@/lib/api';
import { getApiMessage } from '@/lib/api-error';
import {
  type NotifPrefKey,
  NOTIF_PREFS,
  getNotifPrefs,
  setNotifPref,
} from '@/lib/notification-prefs';

type Section = {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
};

export default function Profil() {
  const { theme, themePreference, setThemePreference } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { toast, showToast, hideToast } = useToast();

  const { biometricEnabled, enableBiometric, disableBiometric } = useBiometricLock();

  const [notifPrefs, setNotifPrefs] = useState<Record<NotifPrefKey, boolean> | null>(null);

  useEffect(() => {
    getNotifPrefs().then(setNotifPrefs);
  }, []);

  const toggleNotifPref = async (key: NotifPrefKey) => {
    if (!notifPrefs) return;
    const newVal = !notifPrefs[key];
    setNotifPrefs(prev => prev ? { ...prev, [key]: newVal } : prev);
    await setNotifPref(key, newVal);
    Haptics.selectionAsync();
  };

  const [showChangeMdp, setShowChangeMdp] = useState(false);
  const [ancienMdp, setAncienMdp] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  const [loadingMdp, setLoadingMdp] = useState(false);

  const changerMotDePasse = async () => {
    if (!ancienMdp || !nouveauMdp || !confirmMdp) {
      showToast('Remplissez tous les champs', 'warning');
      return;
    }
    if (nouveauMdp !== confirmMdp) {
      showToast('Les mots de passe ne correspondent pas', 'warning');
      return;
    }
    if (nouveauMdp.length < 8) {
      showToast('Le mot de passe doit contenir au moins 8 caractères', 'warning');
      return;
    }
    setLoadingMdp(true);
    try {
      await apiClient.post('/api/auth/changer-mdp', {
        ancienMotDePasse: ancienMdp,
        nouveauMotDePasse: nouveauMdp,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Mot de passe modifié avec succès', 'success');
      setAncienMdp('');
      setNouveauMdp('');
      setConfirmMdp('');
      setShowChangeMdp(false);
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = getApiMessage(err, 'Mot de passe actuel incorrect');
      showToast(msg, 'error');
    }
    setLoadingMdp(false);
  };

  const demanderSuppressionCompte = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/api/auth/compte');
              await logout();
              router.replace('/login');
            } catch {
              showToast('Impossible de supprimer le compte. Contactez le support.', 'error');
            }
          },
        },
      ]
    );
  };

  const sections: Section[] = [
    {
      icon: '🔒',
      label: 'Changer le mot de passe',
      sublabel: 'Modifier vos identifiants de connexion',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowChangeMdp(v => !v);
      },
    },
    {
      icon: '📋',
      label: 'Conditions générales',
      sublabel: 'CGU et politique de confidentialité',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/cgv');
      },
    },
    {
      icon: '🚪',
      label: 'Se déconnecter',
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Déconnecter', style: 'destructive', onPress: logout },
        ]);
      },
    },
    {
      icon: '🗑️',
      label: 'Supprimer mon compte',
      sublabel: 'Action irréversible',
      onPress: demanderSuppressionCompte,
      danger: true,
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xxl, paddingBottom: insets.bottom + spacing.huge }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar section */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.avatarLabel}>Mon compte</Text>
        </Animated.View>

        {/* Apparence */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.apparenceCard}>
          <Text style={styles.apparenceTitle}>🎨 Apparence</Text>
          <View style={styles.apparenceRow}>
            {([
              { key: 'light', label: '☀️ Clair' },
              { key: 'system', label: '⚙️ Auto' },
              { key: 'dark',  label: '🌙 Sombre' },
            ] as { key: ThemePreference; label: string }[]).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.apparenceBtn, themePreference === opt.key && styles.apparenceBtnActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setThemePreference(opt.key);
                }}
                accessibilityLabel={opt.label}
                accessibilityRole="button"
                accessibilityState={{ selected: themePreference === opt.key }}
              >
                <Text style={[styles.apparenceBtnText, themePreference === opt.key && styles.apparenceBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Biométrie */}
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <TouchableOpacity
            style={styles.row}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (biometricEnabled) {
                await disableBiometric();
              } else {
                const ok = await enableBiometric();
                if (!ok) showToast('Biométrie non disponible ou non configurée', 'warning');
              }
            }}
            accessibilityLabel={biometricEnabled ? 'Désactiver la biométrie' : 'Activer la biométrie'}
            accessibilityRole="button"
          >
            <View style={styles.rowIcon}>
              <Text style={styles.rowIconText}>🔐</Text>
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Verrouillage biométrique</Text>
              <Text style={styles.rowSublabel}>
                {biometricEnabled ? 'Activé — toucher pour désactiver' : 'Désactivé — toucher pour activer'}
              </Text>
            </View>
            <View style={[styles.toggleDot, biometricEnabled && styles.toggleDotOn]} />
          </TouchableOpacity>
        </Animated.View>

        {/* Notifications */}
        {notifPrefs && (
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.apparenceCard}>
            <Text style={styles.apparenceTitle}>🔔 Notifications</Text>
            {NOTIF_PREFS.map(pref => (
              <TouchableOpacity
                key={pref.key}
                style={styles.notifRow}
                onPress={() => toggleNotifPref(pref.key)}
                accessibilityLabel={pref.label}
                accessibilityRole="switch"
                accessibilityState={{ checked: notifPrefs[pref.key] }}
              >
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>{pref.label}</Text>
                  <Text style={styles.rowSublabel}>{pref.description}</Text>
                </View>
                <View style={[styles.toggleDot, notifPrefs[pref.key] && styles.toggleDotOn]} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Sections */}
        {sections.map((s, i) => (
          <Animated.View key={s.label} entering={FadeInDown.duration(400).delay(i * 60).springify()}>
            <TouchableOpacity
              style={[styles.row, s.danger && styles.rowDanger]}
              onPress={s.onPress}
              accessibilityLabel={s.label}
              accessibilityRole="button"
              activeOpacity={0.7}
            >
              <View style={[styles.rowIcon, s.danger && styles.rowIconDanger]}>
                <Text style={styles.rowIconText}>{s.icon}</Text>
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowLabel, s.danger && styles.rowLabelDanger]}>{s.label}</Text>
                {s.sublabel && <Text style={styles.rowSublabel}>{s.sublabel}</Text>}
              </View>
              {!s.danger && <Text style={styles.rowChevron}>›</Text>}
            </TouchableOpacity>

            {/* Formulaire changement mdp inline */}
            {s.label === 'Changer le mot de passe' && showChangeMdp && (
              <Animated.View entering={FadeInDown.duration(300).springify()} style={styles.mdpForm}>
                <FormInput
                  icon="🔑"
                  placeholder="Mot de passe actuel"
                  secureTextEntry
                  value={ancienMdp}
                  onChangeText={setAncienMdp}
                  accessibilityLabel="Mot de passe actuel"
                />
                <FormInput
                  icon="🔒"
                  placeholder="Nouveau mot de passe"
                  secureTextEntry
                  value={nouveauMdp}
                  onChangeText={setNouveauMdp}
                  accessibilityLabel="Nouveau mot de passe"
                />
                <FormInput
                  icon="✅"
                  placeholder="Confirmer le nouveau mot de passe"
                  secureTextEntry
                  value={confirmMdp}
                  onChangeText={setConfirmMdp}
                  accessibilityLabel="Confirmer le nouveau mot de passe"
                />
                <TouchableOpacity
                  style={[styles.saveBtn, loadingMdp && styles.saveBtnDisabled]}
                  onPress={changerMotDePasse}
                  disabled={loadingMdp}
                  accessibilityLabel="Enregistrer le nouveau mot de passe"
                  accessibilityRole="button"
                >
                  <Text style={styles.saveBtnText}>
                    {loadingMdp ? 'Enregistrement...' : 'Enregistrer'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        ))}

        {/* Version */}
        <Text style={styles.version}>FidèlePro v1.0.0</Text>
      </ScrollView>

      <Toast visible={!!toast} message={toast?.message ?? ''} type={toast?.type} onHide={hideToast} />
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
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
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      fontSize: 32,
      color: colors.primary,
      lineHeight: 36,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: spacing.xxxl,
      marginTop: spacing.md,
    },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      ...shadow.button(colors.primary),
    },
    avatarEmoji: { fontSize: 36 },
    avatarLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textMuted,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      gap: spacing.md,
      ...shadow.card,
    },
    rowDanger: {
      backgroundColor: theme.inactiveBackground,
      borderWidth: 1,
      borderColor: theme.inactiveBorder,
    },
    rowIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.surfaceSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowIconDanger: {
      backgroundColor: '#ffeeee',
    },
    rowIconText: { fontSize: 20 },
    rowContent: { flex: 1 },
    rowLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    rowLabelDanger: { color: colors.error },
    rowSublabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    rowChevron: {
      fontSize: 22,
      color: theme.textMuted,
    },
    mdpForm: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: radius.xl,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      marginTop: spacing.xs,
      ...shadow.button(colors.primary),
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: {
      color: colors.white,
      fontWeight: 'bold',
      fontSize: 15,
    },
    version: {
      textAlign: 'center',
      color: theme.textMuted,
      fontSize: 12,
      marginTop: spacing.xxxl,
    },
    apparenceCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    apparenceTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      marginBottom: spacing.md,
    },
    apparenceRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    apparenceBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
    },
    apparenceBtnActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}18`,
    },
    apparenceBtnText: {
      fontSize: 13,
      color: theme.textMuted,
      fontWeight: '500',
    },
    apparenceBtnTextActive: {
      color: colors.primary,
      fontWeight: '700',
    },
    notifRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: spacing.md,
    },
    toggleDot: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.border,
      borderWidth: 2,
      borderColor: theme.textMuted,
      flexShrink: 0,
    },
    toggleDotOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
  });
}
