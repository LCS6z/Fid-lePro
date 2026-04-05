import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Progression } from '../services/api';
import StampGrid from './StampGrid';

interface LoyaltyCardProps {
  progression: Progression;
  index: number;
  onPress?: () => void;
}

const GRADIENT_COLORS = Colors.cardGradients;

export default function LoyaltyCard({ progression, index, onPress }: LoyaltyCardProps) {
  const gradient = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const progress = progression.tamponsActuels / progression.maxTampons;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 120).duration(500).springify()}
      style={animStyle}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={gradient}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative circles */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Ionicons name="storefront-outline" size={18} color="#fff" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.commercantName} numberOfLines={1}>
                {progression.commercant}
              </Text>
              <Text style={styles.carteName} numberOfLines={1}>
                {progression.nomCarte}
              </Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>
                {progression.tamponsActuels}/{progression.maxTampons}
              </Text>
            </View>
          </View>

          {/* Stamps */}
          <StampGrid
            maxTampons={Math.min(progression.maxTampons, 12)}
            tamponsActuels={progression.tamponsActuels}
            color="rgba(255,255,255,0.9)"
          />

          {/* Footer */}
          <View style={styles.footer}>
            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.rewardRow}>
              <Ionicons name="gift-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.rewardText} numberOfLines={1}>
                {' '}{progression.recompense}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    overflow: 'hidden',
    minHeight: 180,
  },
  circle1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -40,
    right: -30,
  },
  circle2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -20,
    left: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  commercantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  carteName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  progressBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  progressText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  footer: {
    marginTop: 14,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
});
