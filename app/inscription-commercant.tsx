import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AuthBackground } from '@/components/AuthBackground';
import { FormInput } from '@/components/FormInput';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api';
import type { InscriptionCommercantResponse } from '@/lib/types';

type Etape = 1 | 2 | 3;

export default function InscriptionCommercant() {
  const { theme } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    scroll: { flexGrow: 1, padding: spacing.xxl, paddingTop: spacing.xl, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: spacing.xxl },
    logoCircle: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.lg,
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    },
    logoEmoji: { fontSize: 34 },
    logo: { fontSize: 38, fontWeight: 'bold', color: colors.white, letterSpacing: 0.5 },
    tagline: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
    stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl },
    stepItem: { alignItems: 'center', gap: spacing.xs },
    stepLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
    stepLabelActive: { color: colors.white, opacity: 1 },
    stepDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
    stepDotActive: { backgroundColor: colors.white },
    stepNum: { fontSize: 16, fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' },
    stepNumActive: { color: colors.primary },
    stepLine: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: spacing.sm },
    stepLineActive: { backgroundColor: colors.white },
    card: { backgroundColor: theme.surface, borderRadius: radius.card, padding: spacing.xxxl, ...shadow.cardElevated },
    cardTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
    cardSubtitle: { fontSize: 13, color: theme.textMuted, marginBottom: spacing.xxl },
    button: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 18, alignItems: 'center', ...shadow.button(colors.primary) },
    buttonDisabled: { backgroundColor: '#cccccc', shadowOpacity: 0, elevation: 0 },
    buttonText: { color: colors.white, fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
    buttonRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
    backButton: { padding: 18, borderRadius: radius.xl, backgroundColor: theme.surfaceSecondary },
    backButtonText: { color: theme.text, fontSize: 15, fontWeight: '600' },
    recapCommerce: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceSecondary, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg, gap: spacing.md },
    recapCommerceIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    recapCommerceIconText: { fontSize: 22 },
    recapCommerceName: { fontSize: 15, fontWeight: 'bold', color: theme.text },
    recapCommerceType: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    offreCard: { borderWidth: 2, borderColor: colors.primary, borderRadius: radius.xxl, padding: spacing.xl, marginBottom: spacing.xl },
    offreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    offreTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
    offreBadge: { backgroundColor: '#e8f0fe', borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
    offreBadgeText: { color: colors.primary, fontSize: 11, fontWeight: '600' },
    offrePrixRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl, marginBottom: spacing.xl, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: theme.border },
    offrePrix: { alignItems: 'center' },
    offrePrixMontant: { fontSize: 28, fontWeight: 'bold', color: colors.primary },
    offrePrixLabel: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    offrePrixPlus: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
    offrePrixPlusText: { fontSize: 16, fontWeight: 'bold', color: theme.textMuted },
    offreFeature: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    offreFeatureIcon: { fontSize: 14 },
    offreFeatureLabel: { fontSize: 13, color: theme.text },
    cgvRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, gap: spacing.md },
    checkbox: { width: 24, height: 24, borderRadius: radius.sm, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkmark: { color: colors.white, fontSize: 14, fontWeight: 'bold' },
    cgvText: { flex: 1, fontSize: 14, color: theme.text },
    cgvLink: { color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' },
    link: { marginTop: spacing.xl, alignItems: 'center' },
    linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  }), [theme]);
  const [etape, setEtape] = useState<Etape>(1);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [typeCommerce, setTypeCommerce] = useState('');
  const [cgvAcceptees, setCgvAcceptees] = useState(false);
  const [loading, setLoading] = useState(false);

  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));
  const handlePressIn = () => { buttonScale.value = withSpring(0.95); };
  const handlePressOut = () => { buttonScale.value = withSpring(1); };

  const validerEtape1 = () => {
    if (!nom || !email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Erreur', 'Tous les champs sont obligatoires');
      return;
    }
    if (password.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Erreur', 'Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEtape(2);
  };

  const validerEtape2 = () => {
    if (!telephone || !adresse || !typeCommerce) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Erreur', 'Tous les champs sont obligatoires');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEtape(3);
  };

  const handleInscription = async () => {
    if (!cgvAcceptees) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Erreur', 'Vous devez accepter les CGV pour continuer');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post<InscriptionCommercantResponse>('/api/stripe/inscription-commercant', {
        nom, email, password, telephone, adresse, typeCommerce,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const checkoutUrl = res.data.checkoutUrl;
      Alert.alert(
        '✅ Compte créé !',
        'Vous allez être redirigé vers le paiement sécurisé (150€ de mise en service).',
        [{ text: 'Procéder au paiement', onPress: () => Linking.openURL(checkoutUrl) }]
      );
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err?.response?.data?.erreur || 'Erreur serveur';
      Alert.alert('Erreur', message);
    }
    setLoading(false);
  };

  const STEP_LABELS = ['Compte', 'Commerce', 'Paiement'];

  const StepIndicator = ({ n }: { n: number }) => (
    <View style={styles.stepItem}>
      <View style={[styles.stepDot, etape >= n && styles.stepDotActive]}>
        <Text style={[styles.stepNum, etape >= n && styles.stepNumActive]}>
          {etape > n ? '✓' : n}
        </Text>
      </View>
      <Text style={[styles.stepLabel, etape >= n && styles.stepLabelActive]}>
        {STEP_LABELS[n - 1]}
      </Text>
    </View>
  );

  return (
    <AuthBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInUp.duration(800).springify()} style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🏪</Text>
          </View>
          <Text style={styles.logo}>FidèlePro</Text>
          <Text style={styles.tagline}>Inscription commerçant</Text>
        </Animated.View>

        {/* Indicateur étapes */}
        <View style={styles.stepsRow}>
          <StepIndicator n={1} />
          <View style={[styles.stepLine, etape >= 2 && styles.stepLineActive]} />
          <StepIndicator n={2} />
          <View style={[styles.stepLine, etape >= 3 && styles.stepLineActive]} />
          <StepIndicator n={3} />
        </View>

        <Animated.View entering={FadeInDown.duration(800).delay(200).springify()} style={styles.card}>

          {/* ÉTAPE 1 */}
          {etape === 1 && (
            <>
              <Text style={styles.cardTitle}>Informations de connexion</Text>
              <Text style={styles.cardSubtitle}>Vos identifiants pour accéder à l'espace commerçant</Text>
              <FormInput
                icon="🏪"
                placeholder="Nom du commerce"
                value={nom}
                onChangeText={setNom}
                autoCapitalize="words"
              />
              <FormInput
                icon="✉️"
                placeholder="Adresse email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <FormInput
                icon="🔒"
                placeholder="Mot de passe (6 caractères min)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Animated.View style={buttonStyle}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={validerEtape1}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={1}
                >
                  <Text style={styles.buttonText}>Continuer →</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}

          {/* ÉTAPE 2 */}
          {etape === 2 && (
            <>
              <Text style={styles.cardTitle}>Informations du commerce</Text>
              <Text style={styles.cardSubtitle}>Pour que vos clients puissent vous trouver</Text>
              <FormInput
                icon="📞"
                placeholder="Téléphone"
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
              />
              <FormInput
                icon="📍"
                placeholder="Adresse du commerce"
                value={adresse}
                onChangeText={setAdresse}
                autoCapitalize="words"
              />
              <FormInput
                icon="🏷️"
                placeholder="Type de commerce (ex: Restaurant, Café...)"
                value={typeCommerce}
                onChangeText={setTypeCommerce}
                autoCapitalize="words"
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setEtape(1)}>
                  <Text style={styles.backButtonText}>← Retour</Text>
                </TouchableOpacity>
                <Animated.View style={[buttonStyle, { flex: 1 }]}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={validerEtape2}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={1}
                  >
                    <Text style={styles.buttonText}>Continuer →</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </>
          )}

          {/* ÉTAPE 3 */}
          {etape === 3 && (
            <>
              <Text style={styles.cardTitle}>{"Récapitulatif & Paiement"}</Text>
              <Text style={styles.cardSubtitle}>Vérifiez vos informations avant de payer</Text>

              {/* Récap commerce */}
              <View style={styles.recapCommerce}>
                <View style={styles.recapCommerceIcon}>
                  <Text style={styles.recapCommerceIconText}>🏪</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recapCommerceName}>{nom}</Text>
                  <Text style={styles.recapCommerceType}>{typeCommerce} • {adresse}</Text>
                </View>
              </View>

              {/* Offre tarifaire */}
              <View style={styles.offreCard}>
                <View style={styles.offreHeader}>
                  <Text style={styles.offreTitle}>Offre FidèlePro</Text>
                  <View style={styles.offreBadge}>
                    <Text style={styles.offreBadgeText}>Sans engagement</Text>
                  </View>
                </View>

                <View style={styles.offrePrixRow}>
                  <View style={styles.offrePrix}>
                    <Text style={styles.offrePrixMontant}>150€</Text>
                    <Text style={styles.offrePrixLabel}>mise en service</Text>
                  </View>
                  <View style={styles.offrePrixPlus}>
                    <Text style={styles.offrePrixPlusText}>+</Text>
                  </View>
                  <View style={styles.offrePrix}>
                    <Text style={styles.offrePrixMontant}>49€</Text>
                    <Text style={styles.offrePrixLabel}>par mois</Text>
                  </View>
                </View>

                {[
                  { icon: '✅', label: 'Tableau de bord commerçant' },
                  { icon: '✅', label: 'Scanner QR client' },
                  { icon: '✅', label: 'Statistiques clients' },
                  { icon: '✅', label: 'Résiliation à tout moment' },
                ].map((item, i) => (
                  <View key={i} style={styles.offreFeature}>
                    <Text style={styles.offreFeatureIcon}>{item.icon}</Text>
                    <Text style={styles.offreFeatureLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* CGV */}
              <TouchableOpacity
                testID="cgv-toggle"
                style={styles.cgvRow}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCgvAcceptees(!cgvAcceptees);
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: cgvAcceptees }}
              >
                <View style={[styles.checkbox, cgvAcceptees && styles.checkboxActive]}>
                  {cgvAcceptees && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.cgvText}>
                  {"J'accepte les "}
                  <Text style={styles.cgvLink} onPress={() => router.push('/cgv')}>
                    conditions générales de vente
                  </Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setEtape(2)}>
                  <Text style={styles.backButtonText}>← Retour</Text>
                </TouchableOpacity>
                <Animated.View style={[buttonStyle, { flex: 1 }]}>
                  <TouchableOpacity
                    style={[styles.button, !cgvAcceptees && styles.buttonDisabled]}
                    onPress={handleInscription}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={1}
                    disabled={!cgvAcceptees || loading}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? '⏳ Création...' : '💳 Payer 150€'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </>
          )}

          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.link}>
            <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </AuthBackground>
  );
}

