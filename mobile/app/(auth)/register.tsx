import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/auth';
import { Colors } from '../../constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    nom: '',
    email: '',
    password: '',
    telephone: '',
    dateNaissance: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const update = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { nom, email, password, telephone, dateNaissance } = form;
    if (!nom || !email || !password || !telephone || !dateNaissance) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      const data = await authAPI.register({
        nom: nom.trim(),
        email: email.trim().toLowerCase(),
        password,
        telephone: telephone.trim(),
        dateNaissance: dateNaissance.trim(),
      });
      await login(data.token, data.client);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de créer le compte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.primaryDark, Colors.primary, '#9F67FF']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View entering={FadeIn.delay(100).duration(500)} style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Créer un compte</Text>
              <Text style={styles.headerSubtitle}>Rejoignez FidèlePro gratuitement</Text>
            </Animated.View>

            {/* Card */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(600).springify()}
              style={styles.card}
            >
              <Field
                icon="person-outline"
                placeholder="Nom complet"
                value={form.nom}
                onChangeText={update('nom')}
              />
              <Field
                icon="mail-outline"
                placeholder="Email"
                value={form.email}
                onChangeText={update('email')}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                icon="phone-portrait-outline"
                placeholder="Téléphone"
                value={form.telephone}
                onChangeText={update('telephone')}
                keyboardType="phone-pad"
              />
              <Field
                icon="calendar-outline"
                placeholder="Date de naissance (JJ/MM/AAAA)"
                value={form.dateNaissance}
                onChangeText={update('dateNaissance')}
                keyboardType="numbers-and-punctuation"
              />

              {/* Password */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Mot de passe"
                  placeholderTextColor={Colors.textMuted}
                  value={form.password}
                  onChangeText={update('password')}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Créer mon compte</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Déjà un compte ? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.loginLink}>Se connecter</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'words',
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numbers-and-punctuation';
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
}) {
  return (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color={Colors.textMuted} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { flex: 1 }]}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 12,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
  },
  button: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonGradient: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
});
