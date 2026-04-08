import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const COLORS = ['#6637ee', '#2ecc71', '#f1c40f', '#e74c3c', '#3498db', '#e67e22', '#ffffff'];
const PARTICLE_COUNT = 18;

function Particle({ color, index }: { color: string; index: number }) {
  const angle = (index / PARTICLE_COUNT) * 2 * Math.PI;
  const distance = 40 + Math.random() * 50;
  const tx = Math.cos(angle) * distance;
  const ty = Math.sin(angle) * distance - 30;

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const delay = index * 20;
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(300, withTiming(0, { duration: 400 }))
    ));
    scale.value = withDelay(delay, withSequence(
      withSpring(1, { damping: 8, stiffness: 200 }),
      withDelay(200, withTiming(0.3, { duration: 400 }))
    ));
    x.value = withDelay(delay, withSpring(tx, { damping: 10, stiffness: 80 }));
    y.value = withDelay(delay, withSpring(ty, { damping: 10, stiffness: 80 }));
    rotate.value = withDelay(delay, withSpring(
      (Math.random() - 0.5) * 360,
      { damping: 8, stiffness: 60 }
    ));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const size = 6 + Math.floor(Math.random() * 6);
  const isCircle = index % 3 === 0;

  return (
    <Animated.View style={[
      styles.particle,
      style,
      {
        width: size,
        height: isCircle ? size : size * 1.6,
        borderRadius: isCircle ? size / 2 : 2,
        backgroundColor: color,
      },
    ]} />
  );
}

type Props = {
  visible: boolean;
};

export function Confetti({ visible }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <Particle
          key={i}
          color={COLORS[i % COLORS.length]}
          index={i}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
  },
});
