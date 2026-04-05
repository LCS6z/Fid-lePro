import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface StampGridProps {
  maxTampons: number;
  tamponsActuels: number;
  color?: string;
}

function Stamp({
  filled,
  index,
  color,
}: {
  filled: boolean;
  index: number;
  color: string;
}) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 60, withSpring(1, { damping: 12, stiffness: 180 }));
    opacity.value = withDelay(index * 60, withSpring(1));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.stamp, filled && { backgroundColor: color }, animStyle]}>
      {filled && (
        <Ionicons name="checkmark" size={12} color="#fff" />
      )}
    </Animated.View>
  );
}

export default function StampGrid({ maxTampons, tamponsActuels, color = Colors.primary }: StampGridProps) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: maxTampons }).map((_, i) => (
        <Stamp key={i} filled={i < tamponsActuels} index={i} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  stamp: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
