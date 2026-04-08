import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AuthBackground } from '@/components/AuthBackground';
import { FormInput } from '@/components/FormInput';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api';
import { getApiMessage } from '@/lib/api-error';

export default function InscriptionClient() {
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
    card: { backgroundColor: theme.surface, borderRadius: radius.card, padding: spacing.xxxl, ...shadow.cardElevated },
    cardTitle: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
    cardSubtitle: { fontSize: 14, color: colors.success, fontWeight: '600', marginBottom: spacing.xl },
    perksRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.xl },
    perk: { alignItems: 'center', gap: spacing.xs },
    perkIcon: { fontSize: 26 },
    perkLabel: { fontSize: 11, color: theme.textMuted, fontWeight: '500' },
    formDivider: { height: 1, backgroundColor: theme.border, marginBottom: spacing.xl },
    button: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: 18, alignItems: 'center', ...shadow.button(colors.primary) },
    buttonLoading: { opacity: 0.7 },
    buttonText: { color: colors.white, fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
    link: { marginTop: spacing.xl, alignItems: 'center' },
    linkText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
  }), [theme]);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));
  const handlePressIn = () => { buttonScale.value = withSpring(0.95); };
  const handlePressOut = () => { buttonScale.value = withSpring(1); };

  const handleInscription = async () => {
    if (!nom || !email || !password) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Erreur', 'Tous les champs sont obligatoires');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/api/auth/inscription/client', { nom, email, password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Compte créé !',
        'Bienvenue sur FidèlePro !',
        [{ text: 'Se connecter', onPress: () => router.replace('/login') }]
      );
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = getApiMessage(err, 'Email déjà utilisé ou problème serveur');
      Alert.alert('Erreur', message);
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
        <Animated.View entering={FadeInUp.duration(800).springify()} style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>👤</Text>
          </View>
          <Text style={styles.logo}>FidèlePro</Text>
          <Text style={styles.tagline}>Rejoignez la communauté</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Créer un compte</Text>
          <Text style={styles.cardSubtitle}>Client — Accès gratuit</Text>

          {/* Avantages */}
          <View style={styles.perksRow}>
            <View style={styles.perk}>
              <Text style={styles.perkIcon}>🎁</Text>
              <Text style={styles.perkLabel}>Récompenses</Text>
            </View>
            <View style={styles.perk}>
              <Text style={styles.perkIcon}>📱</Text>
              <Text style={styles.perkLabel}>QR Code</Text>
            </View>
            <View style={styles.perk}>
              <Text style={styles.perkIcon}>⭐</Text>
              <Text style={styles.perkLabel}>Avis</Text>
            </View>
          </View>

          <View style={styles.formDivider} />

          <FormInput
            icon="👤"
            placeholder="Prénom et nom"
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
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Animated.View style={buttonStyle}>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonLoading]}
              onPress={handleInscription}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={1}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '⏳ Création...' : 'Créer mon compte →'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.link}>
            <Text style={styles.linkText}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </AuthBackground>
  );
}

