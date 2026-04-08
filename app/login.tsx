import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AuthBackground } from '@/components/AuthBackground';
import { FormInput } from '@/components/FormInput';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api';

export default function Login() {
  const { theme } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xxl },
    header: { alignItems: 'center', marginBottom: spacing.xxxl },
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
    card: {
      backgroundColor: theme.surface,
      borderRadius: radius.card,
      padding: spacing.xxxl,
      ...shadow.cardElevated,
    },
    cardTitle: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
    cardSubtitle: { fontSize: 14, color: theme.textMuted, marginBottom: spacing.xxl },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.xl, padding: 18, alignItems: 'center',
      ...shadow.button(colors.primary),
    },
    buttonLoading: { opacity: 0.7 },
    buttonText: { color: colors.white, fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl, gap: spacing.md },
    dividerLine: { flex: 1, height: 1, backgroundColor: theme.border },
    dividerText: { fontSize: 12, color: theme.textMuted, fontWeight: '500' },
    links: { gap: spacing.md },
    linkButton: { backgroundColor: theme.surfaceSecondary, borderRadius: radius.xl, padding: 15, alignItems: 'center' },
    linkButtonText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
    linkButtonOutline: { borderRadius: radius.xl, padding: 15, alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary },
    linkButtonOutlineText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
    forgotBtn: { alignItems: 'flex-end', marginBottom: spacing.md, marginTop: -spacing.sm },
    forgotText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  }), [theme]);
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));
  const handlePressIn = () => { buttonScale.value = withSpring(0.95); };
  const handlePressOut = () => { buttonScale.value = withSpring(1); };

  const handleLogin = async () => {
    if (!email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post('/api/auth/connexion/commercant', { email, password });
      await login(res.data.token, 'commercant');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/dashboard-commercant');
      return;
    } catch (errCommercant: any) {
      const statut = errCommercant?.response?.data?.statut;
      if (statut === 'inactif') {
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Compte en attente', 'Votre compte est en attente de paiement. Veuillez finaliser votre inscription.');
        return;
      }
      if (statut === 'suspendu') {
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Compte suspendu', 'Votre compte est suspendu. Contactez le support.');
        return;
      }
      if (statut === 'résilié') {
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Compte résilié', 'Votre abonnement est résilié.');
        return;
      }
      if (statut === 'impayé') {
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        // Propose de relancer le paiement via un nouveau lien Stripe
        Alert.alert(
          'Paiement en attente',
          'Votre abonnement est impayé. Souhaitez-vous régler votre situation maintenant ?',
          [
            { text: 'Plus tard', style: 'cancel' },
            {
              text: 'Régler maintenant',
              onPress: async () => {
                try {
                  const res = await apiClient.post('/api/commercant/relance-paiement', { email });
                  if (res.data?.checkoutUrl) {
                    await Linking.openURL(res.data.checkoutUrl);
                  }
                } catch {
                  Alert.alert('Erreur', 'Impossible de générer le lien de paiement. Contactez le support.');
                }
              },
            },
          ]
        );
        return;
      }
    }

    try {
      const res = await apiClient.post('/api/auth/connexion/client', { email, password });
      await login(res.data.token, 'client');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/dashboard-client');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Email ou mot de passe incorrect');
    }

    setLoading(false);
  };

  return (
    <AuthBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View entering={FadeInUp.duration(800).springify()} style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🏆</Text>
          </View>
          <Text style={styles.logo}>FidèlePro</Text>
          <Text style={styles.tagline}>Votre fidélité récompensée</Text>
        </Animated.View>

        {/* Carte */}
        <Animated.View entering={FadeInDown.duration(800).delay(200).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>
          <Text style={styles.cardSubtitle}>Entrez vos identifiants pour continuer</Text>

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
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Animated.View style={buttonStyle}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonLoading]}
              onPress={handleLogin}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={1}
              disabled={loading}
              accessibilityLabel="Se connecter"
              accessibilityRole="button"
              accessibilityState={{ disabled: loading }}
            >
              <Text style={styles.buttonText}>
                {loading ? '⏳ Connexion...' : 'Se connecter →'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/mot-de-passe-oublie')}
            accessibilityLabel="Mot de passe oublié"
            accessibilityRole="button"
          >
            <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Pas encore de compte ?</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.links}>
            <TouchableOpacity
              onPress={() => router.push('/inscription-client')}
              style={styles.linkButton}
              accessibilityLabel="S'inscrire en tant que client"
              accessibilityRole="button"
            >
              <Text style={styles.linkButtonText}>{"S'inscrire en tant que client"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/inscription-commercant')}
              style={styles.linkButtonOutline}
              accessibilityLabel="S'inscrire en tant que commerçant"
              accessibilityRole="button"
            >
              <Text style={styles.linkButtonOutlineText}>{"S'inscrire en tant que commerçant"}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </AuthBackground>
  );
}

