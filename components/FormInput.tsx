import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

type Props = TextInputProps & {
  icon?: string;
};

export function FormInput({ style, icon, secureTextEntry, ...props }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceSecondary,
      borderRadius: radius.lg,
      marginBottom: spacing.lg,
      borderWidth: 2,
      borderColor: 'transparent',
      paddingHorizontal: spacing.lg,
    },
    wrapperFocus: {
      borderColor: colors.primary,
      backgroundColor: theme.surface,
    },
    icon: {
      fontSize: 18,
      marginRight: spacing.sm,
    },
    input: {
      flex: 1,
      paddingVertical: spacing.lg,
      fontSize: 16,
      color: theme.text,
    },
    eyeBtn: {
      paddingLeft: spacing.sm,
      paddingVertical: spacing.sm,
    },
    eyeText: {
      fontSize: 18,
    },
  }), [theme]);

  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.wrapper, focused && styles.wrapperFocus, style as any]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <TextInput
        style={styles.input}
        placeholderTextColor={theme.placeholder}
        secureTextEntry={secureTextEntry && !visible}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {secureTextEntry && (
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setVisible(v => !v)}
          accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={styles.eyeText}>{visible ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
