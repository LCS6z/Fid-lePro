import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import type { Theme } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api';
import { getApiMessage } from '@/lib/api-error';
import { Toast, useToast } from '@/components/Toast';

export default function Parrainage() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { toast, showToast, hideToast } = useToast();

  const [code, setCode] = useState<string | null>(null);
  const [nbFilleuls, setNbFilleuls] = useState(0);
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    apiClient.get('/api/client/parrainage')
      .then(r => {
        setCode(r.data.codeParrainage);
        setNbFilleuls(r.data.nbFilleuls);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const partager = async () => {
    if (!code) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg = `Rejoins FidèlePro et commence à cumuler des tampons ! Utilise mon code de parrainage : ${code}\nTélécharge l'app : fidelepromobile://`;
    try {
      if (await Sharing.isAvailableAsync()) {
        // Sur iOS/Android, on passe par le share sheet natif via clipboard + alert
      }
      Alert.alert('Partager mon code', msg, [
        { text: 'Fermer', style: 'cancel' },
      ]);
    } catch {}
  };

  const appliquerCode = async () => {
    if (!codeInput.trim()) return;
    setApplying(true);
    try {
      await apiClient.post('/api/client/valider-parrainage', { code: codeInput.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Code parrain appliqué !', 'success');
      setCodeInput('');
    } catch (err: unknown) {
      showToast(getApiMessage(err, 'Code invalide'), 'error');
    }
    setApplying(false);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityLabel="Retour" accessibilityRole="button">
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parrainage</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingBottom: insets.bottom + spacing.huge }} showsVerticalScrollIndicator={false}>
        {/* Mon code */}
        <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.codeCard}>
          <Text style={styles.codeLabel}>Mon code de parrainage</Text>
          {loading ? (
            <Text style={styles.codeValue}>...</Text>
          ) : (
            <Text style={styles.codeValue}>{code ?? '—'}</Text>
          )}
          <Text style={styles.codeSub}>{nbFilleuls} ami{nbFilleuls !== 1 ? 's' : ''} parrainé{nbFilleuls !== 1 ? 's' : ''}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={partager} activeOpacity={0.8}>
            <Text style={styles.shareBtnText}>🔗 Partager mon code</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.duration(400).delay(100).springify()} style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{nbFilleuls}</Text>
            <Text style={styles.statLabel}>Filleuls</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>🎁</Text>
            <Text style={styles.statLabel}>Bonus à venir</Text>
          </View>
        </Animated.View>

        {/* Comment ça marche */}
        <Animated.View entering={FadeInDown.duration(400).delay(150).springify()} style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Comment ça marche ?</Text>
          {[
            '1. Partagez votre code avec un ami',
            '2. Votre ami s\'inscrit et entre votre code',
            '3. Vous êtes officiellement parrains !',
          ].map((s, i) => (
            <Text key={i} style={styles.infoText}>{s}</Text>
          ))}
        </Animated.View>

        {/* Entrer un code parrain */}
        <Animated.View entering={FadeInDown.duration(400).delay(200).springify()} style={styles.inputCard}>
          <Text style={styles.inputTitle}>Vous avez un code parrain ?</Text>
          <TextInput
            value={codeInput}
            onChangeText={t => setCodeInput(t.toUpperCase())}
            placeholder="Ex: AB12CD"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="characters"
            maxLength={6}
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
          />
          <TouchableOpacity
            style={[styles.applyBtn, applying && { opacity: 0.6 }]}
            onPress={appliquerCode}
            disabled={applying || !codeInput.trim()}
          >
            <Text style={styles.applyBtnText}>{applying ? 'Application...' : 'Appliquer le code'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <Toast visible={!!toast} message={toast?.message ?? ''} type={toast?.type} onHide={hideToast} />
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
    codeCard: {
      backgroundColor: colors.primary,
      borderRadius: radius.card,
      padding: spacing.xxxl,
      alignItems: 'center',
      marginBottom: spacing.lg,
      ...shadow.button(colors.primary),
    },
    codeLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: spacing.sm },
    codeValue: { fontSize: 42, fontWeight: 'bold', color: '#fff', letterSpacing: 8, marginBottom: spacing.sm },
    codeSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: spacing.xl },
    shareBtn: {
      backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.xl,
      paddingHorizontal: spacing.xxl, paddingVertical: spacing.md,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    statsCard: {
      flexDirection: 'row', backgroundColor: theme.surface, borderRadius: radius.xl,
      padding: spacing.xxl, marginBottom: spacing.lg, ...shadow.card,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 28, fontWeight: 'bold', color: theme.text },
    statLabel: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
    statDivider: { width: 1, backgroundColor: theme.border },
    infoCard: {
      backgroundColor: theme.surface, borderRadius: radius.xl,
      padding: spacing.xxl, marginBottom: spacing.lg, ...shadow.card,
    },
    infoTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: spacing.md },
    infoText: { fontSize: 14, color: theme.textMuted, marginBottom: spacing.sm, lineHeight: 20 },
    inputCard: {
      backgroundColor: theme.surface, borderRadius: radius.xl,
      padding: spacing.xxl, ...shadow.card,
    },
    inputTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: spacing.lg },
    input: {
      borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.md,
      fontSize: 20, fontWeight: 'bold', textAlign: 'center', letterSpacing: 4, marginBottom: spacing.lg,
    },
    applyBtn: {
      backgroundColor: colors.primary, borderRadius: radius.xl,
      padding: spacing.lg, alignItems: 'center', ...shadow.button(colors.primary),
    },
    applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  });
}
