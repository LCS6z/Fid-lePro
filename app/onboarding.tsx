import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🏆',
    title: 'Bienvenue sur FidèlePro',
    subtitle: 'Le programme de fidélité\nnumérique pour vos commerces préférés',
    color: '#6637ee',
    colorLight: '#7c4dff',
    features: [
      { icon: '📱', label: 'Votre QR code toujours disponible' },
      { icon: '🎁', label: 'Récompenses automatiques' },
      { icon: '🏪', label: '100% local, sans papier' },
    ],
  },
  {
    emoji: '📱',
    title: 'Scannez, cumulez',
    subtitle: 'Présentez votre QR code à chaque visite\npour accumuler des tampons',
    color: '#2ecc71',
    colorLight: '#27ae60',
    features: [
      { icon: '✓', label: 'Un tampon = une visite' },
      { icon: '✓', label: 'Plusieurs cartes en même temps' },
      { icon: '✓', label: 'Progression visible en temps réel' },
    ],
  },
  {
    emoji: '🎁',
    title: 'Récoltez vos récompenses',
    subtitle: 'Carte complète = récompense chez\nle commerçant, c\'est automatique',
    color: '#f39c12',
    colorLight: '#e67e22',
    features: [
      { icon: '⭐', label: 'Laissez des avis sur vos commerces' },
      { icon: '🔔', label: 'Notifications quand vous êtes proche' },
      { icon: '🚀', label: 'Inscription gratuite et rapide' },
    ],
  },
];

export default function Onboarding() {
  const { theme } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    root: { flex: 1 },
    circle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -80, right: -80, opacity: 0.4 },
    circle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, bottom: '35%', left: -40, backgroundColor: 'rgba(0,0,0,0.08)' },
    skipButton: { position: 'absolute', right: spacing.xxl, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.circle },
    skipText: { color: colors.white, fontSize: 14, fontWeight: '600' },
    content: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xxl },
    emojiCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    emoji: { fontSize: 48 },
    title: { fontSize: 26, fontWeight: 'bold', color: colors.white, textAlign: 'center', marginBottom: spacing.md },
    subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
    card: { backgroundColor: theme.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.xxxl, paddingTop: spacing.xxl, ...shadow.cardElevated },
    features: { gap: spacing.lg, marginBottom: spacing.xxl },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    featureIconText: { fontSize: 20 },
    featureLabel: { fontSize: 15, color: theme.text, fontWeight: '500', flex: 1 },
    dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
    dotIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.border },
    button: { borderRadius: radius.xl, padding: 18, alignItems: 'center' },
    buttonText: { color: colors.white, fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
  }), [theme]);
  const insets = useSafeAreaInsets();
  const [slide, setSlide] = useState(0);
  const buttonScale = useSharedValue(1);

  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const terminer = async () => {
    await SecureStore.setItemAsync('onboarding_done', '1');
    router.replace('/login');
  };

  const suivant = () => {
    if (isLast) {
      terminer();
    } else {
      setSlide(s => s + 1);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: current.color }]}>
      {/* Cercles décoratifs */}
      <View style={[styles.circle1, { backgroundColor: current.colorLight }]} />
      <View style={styles.circle2} />

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipButton, { top: insets.top + spacing.lg }]}
          onPress={terminer}
        >
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* Contenu */}
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <Animated.View key={`emoji-${slide}`} entering={FadeIn.duration(400)} style={styles.emojiCircle}>
          <Text style={styles.emoji}>{current.emoji}</Text>
        </Animated.View>

        <Animated.Text key={`title-${slide}`} entering={FadeInUp.duration(400).delay(100)} style={styles.title}>
          {current.title}
        </Animated.Text>

        <Animated.Text key={`sub-${slide}`} entering={FadeInUp.duration(400).delay(180)} style={styles.subtitle}>
          {current.subtitle}
        </Animated.Text>
      </View>

      {/* Carte blanche */}
      <Animated.View
        key={`card-${slide}`}
        entering={FadeInDown.duration(500).delay(200).springify()}
        style={[styles.card, { paddingBottom: insets.bottom + spacing.xxl }]}
      >
        <View style={styles.features}>
          {current.features.map((f, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.duration(400).delay(300 + i * 80).springify()}
              style={styles.featureRow}
            >
              <View style={[styles.featureIcon, { backgroundColor: current.color + '18' }]}>
                <Text style={styles.featureIconText}>{f.icon}</Text>
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Indicateurs */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dotIndicator,
                i === slide && { backgroundColor: current.color, width: 24 },
              ]}
            />
          ))}
        </View>

        {/* Bouton */}
        <Animated.View style={buttonStyle}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: current.color, ...shadow.button(current.color) }]}
            onPress={suivant}
            onPressIn={() => { buttonScale.value = withSpring(0.95); }}
            onPressOut={() => { buttonScale.value = withSpring(1); }}
            activeOpacity={1}
          >
            <Text style={styles.buttonText}>
              {isLast ? "C'est parti ! 🚀" : 'Suivant →'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

