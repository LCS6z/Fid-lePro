import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import type { Theme } from '@/constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🏆',
    title: 'Bienvenue sur FidèlePro',
    subtitle: 'Le programme de fidélité numérique pour vos commerces préférés — sans carte papier.',
    color: '#6637ee',
    colorLight: '#7c4dff',
    features: [
      { icon: '📱', label: 'Votre QR code toujours sur vous' },
      { icon: '🎁', label: 'Récompenses débloquées automatiquement' },
      { icon: '🏪', label: '100% local, gratuit pour les clients' },
    ],
  },
  {
    emoji: '📷',
    title: 'Scannez et cumulez',
    subtitle: 'Présentez votre QR code à chaque visite. Le commerçant scanne, le tampon s\'ajoute.',
    color: '#2ecc71',
    colorLight: '#27ae60',
    features: [
      { icon: '✓', label: 'Un tampon = une visite validée' },
      { icon: '✓', label: 'Plusieurs cartes chez différents commerces' },
      { icon: '✓', label: 'Progression en temps réel dans l\'app' },
    ],
  },
  {
    emoji: '🏪',
    title: 'Commerces partenaires',
    subtitle: 'Découvrez tous nos commerces partenaires près de chez vous avec leurs offres et horaires.',
    color: '#f39c12',
    colorLight: '#e67e22',
    features: [
      { icon: '⭐', label: 'Laissez des avis sur vos commerces' },
      { icon: '🔔', label: 'Recevez les offres de vos commerçants' },
      { icon: '🗺️', label: 'Itinéraire et horaires intégrés' },
    ],
  },
];

export default function Onboarding() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [slide, setSlide] = useState(0);
  const flatRef = useRef<FlatList>(null);
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

  const allerSlide = (index: number) => {
    flatRef.current?.scrollToIndex({ index, animated: true });
    setSlide(index);
    Haptics.selectionAsync();
  };

  const suivant = () => {
    if (isLast) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      terminer();
    } else {
      allerSlide(slide + 1);
    }
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (newIndex !== slide) {
      setSlide(newIndex);
      Haptics.selectionAsync();
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

      {/* Slides swipables */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
        style={styles.flatList}
        renderItem={({ item, index }) => (
          <View style={[styles.slideContent, { paddingTop: insets.top + 60 }]}>
            <Animated.View
              entering={FadeInDown.duration(400).delay(100).springify()}
              style={styles.emojiCircle}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
            </Animated.View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Carte blanche */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(200).springify()}
        style={[styles.card, { paddingBottom: insets.bottom + spacing.xxl }]}
      >
        {/* Features du slide actif */}
        <View style={styles.features}>
          {current.features.map((f, i) => (
            <Animated.View
              key={`${slide}-${i}`}
              entering={FadeInDown.duration(400).delay(i * 80).springify()}
              style={styles.featureRow}
            >
              <View style={[styles.featureIcon, { backgroundColor: current.color + '18' }]}>
                <Text style={styles.featureIconText}>{f.icon}</Text>
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Indicateurs cliquables */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => allerSlide(i)} hitSlop={8}>
              <View style={[
                styles.dotIndicator,
                { backgroundColor: i === slide ? current.color : theme.border },
                i === slide && { width: 24 },
              ]} />
            </TouchableOpacity>
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

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1 },
    circle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, top: -80, right: -80, opacity: 0.4 },
    circle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, bottom: '35%', left: -40, backgroundColor: 'rgba(0,0,0,0.08)' },
    skipButton: {
      position: 'absolute', right: spacing.xxl, zIndex: 10,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
      borderRadius: radius.circle,
    },
    skipText: { color: colors.white, fontSize: 14, fontWeight: '600' },
    flatList: { flex: 1 },
    slideContent: {
      width: SCREEN_W,
      alignItems: 'center',
      paddingHorizontal: spacing.xxl,
    },
    emojiCircle: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: spacing.xxl,
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    },
    emoji: { fontSize: 48 },
    title: { fontSize: 26, fontWeight: 'bold', color: colors.white, textAlign: 'center', marginBottom: spacing.md },
    subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 22 },
    card: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 32, borderTopRightRadius: 32,
      padding: spacing.xxxl, paddingTop: spacing.xxl,
      ...shadow.cardElevated,
    },
    features: { gap: spacing.lg, marginBottom: spacing.xxl },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    featureIconText: { fontSize: 20 },
    featureLabel: { fontSize: 15, color: theme.text, fontWeight: '500', flex: 1 },
    dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
    dotIndicator: { width: 8, height: 8, borderRadius: 4 },
    button: { borderRadius: radius.xl, padding: 18, alignItems: 'center' },
    buttonText: { color: colors.white, fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5 },
  });
}
