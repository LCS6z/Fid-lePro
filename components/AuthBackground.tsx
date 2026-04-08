import { KeyboardAvoidingView, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function AuthBackground({ children, style }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.wrapper, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Cercles décoratifs */}
      <View style={[styles.circle1, { top: -60 + insets.top }]} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />
      <View style={styles.circle4} />
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  circle1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primaryLight,
    right: -100,
    opacity: 0.45,
  },
  circle2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primaryDark,
    bottom: 60,
    left: -50,
    opacity: 0.4,
  },
  circle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: '40%',
    left: 20,
  },
  circle4: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: '25%',
    right: 30,
  },
});
