import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const API = 'https://fid-lepro-production.up.railway.app';

const VIOLET = '#6637ee';
const BLANC = '#ffffff';
const GRIS = '#f5f5f5';
const GRIS_TEXTE = '#333333';
const PLACEHOLDER = '#aaaaaa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      // Tentative connexion commerçant
      const res = await axios.post(API + '/api/auth/connexion/commercant', { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('role', 'commercant');
      router.replace('/dashboard-commercant');
      return;
    } catch (errCommercant: any) {
      const statut = errCommercant?.response?.data?.statut;
      const message = errCommercant?.response?.data?.message;

      // Compte commerçant trouvé mais bloqué
      if (statut === 'inactif') {
        setLoading(false);
        Alert.alert('Compte en attente', 'Votre compte est en attente de paiement. Veuillez finaliser votre inscription.');
        return;
      }
      if (statut === 'suspendu') {
        setLoading(false);
        Alert.alert('Compte suspendu', 'Votre compte est suspendu. Contactez le support.');
        return;
      }
      if (statut === 'résilié') {
        setLoading(false);
        Alert.alert('Compte résilié', 'Votre abonnement est résilié.');
        return;
      }
      if (statut === 'impayé') {
        setLoading(false);
        Alert.alert('Paiement en attente', 'Votre abonnement est impayé. Veuillez régulariser votre situation.');
        return;
      }
    }

    // Tentative connexion client
    try {
      const res = await axios.post(API + '/api/auth/connexion/client', { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('role', 'client');
      router.replace('/dashboard-client');
    } catch {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect');
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <Animated.View entering={FadeInUp.duration(800).springify()} style={styles.header}>
        <Text style={styles.logo}>FidèlePro</Text>
        <Text style={styles.tagline}>Votre fidélité récompensée</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(800).delay(200).springify()} style={styles.card}>
        <Text style={styles.cardTitle}>Connexion</Text>

        <TextInput
          style={[styles.input, emailFocus && styles.inputFocus]}
          placeholder="Adresse email"
          placeholderTextColor={PLACEHOLDER}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setEmailFocus(true)}
          onBlur={() => setEmailFocus(false)}
        />

        <TextInput
          style={[styles.input, passwordFocus && styles.inputFocus]}
          placeholder="Mot de passe"
          placeholderTextColor={PLACEHOLDER}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onFocus={() => setPasswordFocus(true)}
          onBlur={() => setPasswordFocus(false)}
        />

        <Animated.View style={buttonStyle}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          onPress={() => router.push('/inscription-client')}
          style={styles.registerLink}
        >
          <Text style={styles.registerText}>Pas encore de compte ? S'inscrire</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/inscription-commercant')} style={styles.registerLink}>
  <Text style={styles.registerText}>Vous êtes commerçant ? S'inscrire ici</Text>
</TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: VIOLET,
    justifyContent: 'center',
    padding: 24,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#7c4dff',
    top: -80,
    right: -80,
    opacity: 0.5,
  },
  circle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#5e35b1',
    bottom: 50,
    left: -60,
    opacity: 0.4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: BLANC,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: BLANC,
    marginTop: 6,
    opacity: 0.8,
  },
  card: {
    backgroundColor: BLANC,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GRIS_TEXTE,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: GRIS,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: GRIS_TEXTE,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocus: {
    borderColor: VIOLET,
    backgroundColor: BLANC,
  },
  button: {
    backgroundColor: VIOLET,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: VIOLET,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: BLANC,
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerText: {
    color: VIOLET,
    fontSize: 15,
    fontWeight: '600',
  },
});