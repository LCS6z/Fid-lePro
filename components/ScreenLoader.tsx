import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

function SkeletonBlock({ width, height, style, blockStyle }: {
  width: number | `${number}%`;
  height: number;
  style?: object;
  blockStyle?: object;
}) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 700 }),
        withTiming(1, { duration: 700 })
      ),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        blockStyle,
        { width, height, borderRadius: height / 2 > 12 ? radius.md : height / 2 },
        animStyle,
        style,
      ]}
    />
  );
}

function SkeletonHeader({ paddingTop, headerStyle, children }: { paddingTop: number; headerStyle?: object; children: React.ReactNode }) {
  return (
    <View style={[headerStyle, { paddingTop }]}>
      {children}
    </View>
  );
}

export function DashboardClientLoader() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Header violet */}
      <SkeletonHeader paddingTop={insets.top + spacing.lg} headerStyle={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ gap: spacing.sm }}>
            <SkeletonBlock width={80} height={12} blockStyle={styles.block} style={styles.skeletonLight} />
            <SkeletonBlock width={160} height={22} blockStyle={styles.block} style={styles.skeletonLight} />
          </View>
          <SkeletonBlock width={44} height={44} blockStyle={styles.block} style={[styles.skeletonLight, { borderRadius: 22 }]} />
        </View>
        <View style={styles.statsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.statPill}>
              <SkeletonBlock width={30} height={20} blockStyle={styles.block} style={styles.skeletonLight} />
              <SkeletonBlock width={50} height={10} blockStyle={styles.block} style={[styles.skeletonLight, { marginTop: 4 }]} />
            </View>
          ))}
        </View>
      </SkeletonHeader>

      <View style={styles.body}>
        <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl }]}>
          <View style={{ flex: 1, gap: spacing.md, marginRight: spacing.xl }}>
            <SkeletonBlock width="70%" height={16} blockStyle={styles.block} />
            <SkeletonBlock width="90%" height={12} blockStyle={styles.block} />
            <SkeletonBlock width="90%" height={12} blockStyle={styles.block} />
            <SkeletonBlock width={60} height={22} blockStyle={styles.block} style={{ borderRadius: radius.sm }} />
          </View>
          <SkeletonBlock width={120} height={120} blockStyle={styles.block} style={{ borderRadius: radius.md }} />
        </View>

        <SkeletonBlock width="35%" height={18} blockStyle={styles.block} style={{ marginBottom: spacing.lg }} />

        {[1, 2].map(i => (
          <View key={i} style={[styles.card, { marginBottom: spacing.md }]}>
            <View style={[styles.row, { marginBottom: spacing.lg }]}>
              <SkeletonBlock width={42} height={42} blockStyle={styles.block} style={{ borderRadius: 21, marginRight: spacing.md, flexShrink: 0 }} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonBlock width="55%" height={15} blockStyle={styles.block} />
                <SkeletonBlock width="40%" height={12} blockStyle={styles.block} />
              </View>
            </View>
            <View style={[styles.row, { flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }]}>
              {[0, 1, 2, 3, 4, 5].map(j => (
                <SkeletonBlock key={j} width={28} height={28} blockStyle={styles.block} style={{ borderRadius: 14 }} />
              ))}
            </View>
            <SkeletonBlock width="50%" height={12} blockStyle={styles.block} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function DashboardCommercantLoader() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      {/* Header violet */}
      <SkeletonHeader paddingTop={insets.top + spacing.lg} headerStyle={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ gap: spacing.sm }}>
            <SkeletonBlock width={80} height={12} blockStyle={styles.block} style={styles.skeletonLight} />
            <SkeletonBlock width={160} height={22} blockStyle={styles.block} style={styles.skeletonLight} />
          </View>
          <SkeletonBlock width={44} height={44} blockStyle={styles.block} style={[styles.skeletonLight, { borderRadius: 22 }]} />
        </View>
        <SkeletonBlock width="100%" height={52} blockStyle={styles.block} style={[styles.skeletonLight, { borderRadius: radius.xl }]} />
      </SkeletonHeader>

      <View style={styles.body}>
        <View style={styles.statsGrid}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.statCard]}>
              <SkeletonBlock width={38} height={38} blockStyle={styles.block} style={{ borderRadius: 19, marginBottom: spacing.sm }} />
              <SkeletonBlock width="55%" height={22} blockStyle={styles.block} style={{ marginBottom: 4 }} />
              <SkeletonBlock width="75%" height={12} blockStyle={styles.block} />
            </View>
          ))}
        </View>

        <SkeletonBlock width="35%" height={18} blockStyle={styles.block} style={{ marginBottom: spacing.lg }} />

        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.card, { marginBottom: spacing.md }]}>
            <View style={[styles.row, { marginBottom: spacing.md }]}>
              <SkeletonBlock width={44} height={44} blockStyle={styles.block} style={{ borderRadius: 22, marginRight: spacing.md, flexShrink: 0 }} />
              <View style={{ flex: 1, gap: spacing.xs }}>
                <SkeletonBlock width="55%" height={15} blockStyle={styles.block} />
                <SkeletonBlock width="70%" height={12} blockStyle={styles.block} />
              </View>
            </View>
            <View style={[styles.row, { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: theme.borderLight }]}>
              <View style={styles.statPillSkeleton}>
                <SkeletonBlock width={36} height={18} blockStyle={styles.block} style={{ marginBottom: 4 }} />
                <SkeletonBlock width={50} height={11} blockStyle={styles.block} />
              </View>
              <View style={[styles.statPillSkeleton, { borderLeftWidth: 1, borderLeftColor: theme.borderLight }]}>
                <SkeletonBlock width={36} height={18} blockStyle={styles.block} style={{ marginBottom: 4 }} />
                <SkeletonBlock width={50} height={11} blockStyle={styles.block} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function makeStyles(theme: import('@/constants/theme').Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.xxxl,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      gap: spacing.xl,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: radius.xxl,
      padding: spacing.md,
    },
    statPill: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    skeletonLight: {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    body: {
      padding: spacing.xxl,
      marginTop: -spacing.md,
    },
    block: {
      backgroundColor: theme.skeletonBase,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: radius.xxl,
      padding: spacing.xl,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: spacing.xxl,
      gap: spacing.md,
    },
    statCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      width: '47%',
    },
    statPillSkeleton: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: spacing.md,
    },
  });
}
