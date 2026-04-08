import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  onUnlock: () => Promise<boolean>;
};

export function BiometricLock({ onUnlock }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleUnlock = async () => {
    setLoading(true);
    setError(false);
    const ok = await onUnlock();
    if (!ok) setError(true);
    setLoading(false);
  };

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Application verrouillée</Text>
        <Text style={styles.subtitle}>Utilisez la biométrie pour continuer</Text>

        {error && (
          <Text style={styles.errorText}>Authentification échouée. Réessayez.</Text>
        )}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleUnlock}
          disabled={loading}
          accessibilityLabel="Déverrouiller avec biométrie"
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>
            {loading ? '⏳ Vérification...' : '👆 Déverrouiller'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const makeStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.background,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: radius.xxl,
      padding: spacing.xxxl,
      alignItems: 'center',
      width: '80%',
      ...shadow.card,
    },
    icon: { fontSize: 52, marginBottom: spacing.lg },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    errorText: {
      fontSize: 13,
      color: colors.error,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    btn: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxxl,
      borderRadius: radius.xl,
      ...shadow.button(colors.primary),
    },
    btnDisabled: { opacity: 0.6 },
    btnText: {
      color: colors.white,
      fontWeight: 'bold',
      fontSize: 16,
    },
  });
