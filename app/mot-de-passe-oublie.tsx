import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { AuthBackground } from '@/components/AuthBackground';
import { FormInput } from '@/components/FormInput';
import { Toast, useToast } from '@/components/Toast';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import type { Theme } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api';
import { getApiMessage } from '@/lib/api-error';

type Etape = 'email' | 'code' | 'nouveau_mdp' | 'succes';

export default function MotDePasseOublie() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { toast, showToast, hideToast } = useToast();

  const [etape, setEtape] = useState<Etape>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  const [loading, setLoading] = useState(false);

  // Étape 1 — envoi du code
  const envoyerCode = async () => {
    if (!email.trim()) {
      showToast('Entrez votre adresse email', 'warning');
      return;
    }
    if (!email.includes('@')) {
      showToast('Adresse email invalide', 'warning');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/api/auth/mdp-oublie', { email: email.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEtape('code');
    } catch {
      // Même en cas d'erreur on passe à l'étape code (sécurité : pas de fuite email)
      setEtape('code');
    }
    setLoading(false);
  };

  // Étape 2 — vérification du code
  const verifierCode = async () => {
    if (code.trim().length < 4) {
      showToast('Entrez le code reçu par email', 'warning');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/api/auth/verifier-code', { email: email.trim(), code: code.trim() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEtape('nouveau_mdp');
    } catch {
      showToast('Code invalide ou expiré', 'error');
    }
    setLoading(false);
  };

  // Étape 3 — nouveau mot de passe
  const reinitialiserMdp = async () => {
    if (!nouveauMdp || !confirmMdp) {
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
    setLoading(true);
    try {
      await apiClient.post('/api/auth/reinitialiser-mdp', {
        email: email.trim(),
        code: code.trim(),
        nouveauMotDePasse: nouveauMdp,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEtape('succes');
    } catch (err: unknown) {
      const msg = getApiMessage(err, 'Erreur lors de la réinitialisation');
      showToast(msg, 'error');
    }
    setLoading(false);
  };

  const ETAPES_LABELS = ['Email', 'Code', 'Nouveau MDP'];
  const etapeIndex = etape === 'email' ? 0 : etape === 'code' ? 1 : 2;

  return (
    <AuthBackground>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mot de passe oublié</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Indicateur d'étapes */}
        {etape !== 'succes' && (
          <Animated.View entering={FadeInDown.duration(400).delay(100).springify()} style={styles.stepsRow}>
            {ETAPES_LABELS.map((label, i) => (
              <View key={label} style={styles.stepItem}>
                <View style={[styles.stepDot, i <= etapeIndex && styles.stepDotActive]}>
                  <Text style={[styles.stepNum, i <= etapeIndex && styles.stepNumActive]}>
                    {i < etapeIndex ? '✓' : String(i + 1)}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, i <= etapeIndex && styles.stepLabelActive]}>{label}</Text>
                {i < ETAPES_LABELS.length - 1 && (
                  <View style={[styles.stepLine, i < etapeIndex && styles.stepLineActive]} />
                )}
              </View>
            ))}
          </Animated.View>
        )}

        {/* Contenu */}
        <Animated.View entering={FadeInUp.duration(500).delay(200).springify()} style={styles.card}>
          {etape === 'email' && (
            <>
              <Text style={styles.cardTitle}>Récupération</Text>
              <Text style={styles.cardSubtitle}>
                Entrez votre email pour recevoir un code de réinitialisation.
              </Text>
              <FormInput
                icon="✉️"
                placeholder="Adresse email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Adresse email"
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={envoyerCode}
                disabled={loading}
                accessibilityLabel="Envoyer le code"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>{loading ? 'Envoi...' : 'Envoyer le code →'}</Text>
              </TouchableOpacity>
            </>
          )}

          {etape === 'code' && (
            <>
              <Text style={styles.cardTitle}>Code reçu ?</Text>
              <Text style={styles.cardSubtitle}>
                Vérifiez votre boîte mail ({email}) et entrez le code reçu.
              </Text>
              <FormInput
                icon="🔢"
                placeholder="Code à 6 chiffres"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                accessibilityLabel="Code de vérification"
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={verifierCode}
                disabled={loading}
                accessibilityLabel="Vérifier le code"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>{loading ? 'Vérification...' : 'Vérifier →'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkBtn} onPress={() => setEtape('email')}>
                <Text style={styles.linkBtnText}>Renvoyer le code</Text>
              </TouchableOpacity>
            </>
          )}

          {etape === 'nouveau_mdp' && (
            <>
              <Text style={styles.cardTitle}>Nouveau mot de passe</Text>
              <Text style={styles.cardSubtitle}>
                Choisissez un mot de passe sécurisé (8 caractères minimum).
              </Text>
              <FormInput
                icon="🔒"
                placeholder="Nouveau mot de passe"
                value={nouveauMdp}
                onChangeText={setNouveauMdp}
                secureTextEntry
                accessibilityLabel="Nouveau mot de passe"
              />
              <FormInput
                icon="✅"
                placeholder="Confirmer le mot de passe"
                value={confirmMdp}
                onChangeText={setConfirmMdp}
                secureTextEntry
                accessibilityLabel="Confirmer le mot de passe"
              />
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={reinitialiserMdp}
                disabled={loading}
                accessibilityLabel="Réinitialiser le mot de passe"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>{loading ? 'Enregistrement...' : 'Réinitialiser →'}</Text>
              </TouchableOpacity>
            </>
          )}

          {etape === 'succes' && (
            <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.successContainer}>
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.cardTitle}>Mot de passe modifié !</Text>
              <Text style={styles.cardSubtitle}>
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace('/login')}
                accessibilityLabel="Aller à la connexion"
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>Se connecter →</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        <Toast visible={!!toast} message={toast?.message ?? ''} type={toast?.type} onHide={hideToast} />
      </View>
    </AuthBackground>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.lg,
    },
    backBtn: {
      width: 40, height: 40,
      alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { fontSize: 32, color: colors.white, lineHeight: 36 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.white },
    stepsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xxl,
      marginBottom: spacing.xxl,
      gap: spacing.xs,
    },
    stepItem: { alignItems: 'center', gap: spacing.xs, flexDirection: 'row' },
    stepDot: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.3)',
      alignItems: 'center', justifyContent: 'center',
    },
    stepDotActive: { backgroundColor: colors.white },
    stepNum: { fontSize: 14, fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' },
    stepNumActive: { color: colors.primary },
    stepLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginLeft: 4 },
    stepLabelActive: { color: colors.white },
    stepLine: { width: 24, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: spacing.xs },
    stepLineActive: { backgroundColor: colors.white },
    card: {
      backgroundColor: theme.surface,
      borderRadius: radius.card,
      padding: spacing.xxxl,
      marginHorizontal: spacing.xxl,
      ...shadow.cardElevated,
    },
    cardTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
    cardSubtitle: { fontSize: 14, color: theme.textMuted, marginBottom: spacing.xxl, lineHeight: 20 },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.xl,
      padding: 18,
      alignItems: 'center',
      ...shadow.button(colors.primary),
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: colors.white, fontSize: 17, fontWeight: 'bold' },
    linkBtn: { marginTop: spacing.lg, alignItems: 'center' },
    linkBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    successContainer: { alignItems: 'center' },
    successIcon: { fontSize: 56, marginBottom: spacing.lg, textAlign: 'center' },
  });
}
