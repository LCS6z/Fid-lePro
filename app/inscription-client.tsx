import axios from 'axios';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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

export default function InscriptionClient() {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => { buttonScale.value = withSpring(0.95); };
  const handlePressOut = () => { buttonScale.value = withSpring(1); };

  const handleInscription = async () => {
    if (!nom || !email || !password) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires');
      return;
    }
    setLoading(true);
    try {
      await axios.post(API + '/api/auth/inscription/client', { nom, email, password });
      Alert.alert('Compte créé !', 'Bienvenue sur FidèlePro !', [
        { text: 'Se connecter', onPress: () => router.replace('/login') }
      ]);
    } catch (err) {
      Alert.alert('Erreur', 'Email déjà utilisé ou problème serveur');
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(800).springify()} style={styles.header}>
          <Text style={styles.logo}>FidèlePro</Text>
          <Text style={styles.tagline}>Créer mon compte client</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Inscription</Text>

          <TextInput
            style={styles.input}
            placeholder="Prénom et nom"
            placeholderTextColor={PLACEHOLDER}
            value={nom}
            onChangeText={setNom}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Adresse email"
            placeholderTextColor={PLACEHOLDER}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor={PLACEHOLDER}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Animated.View style={buttonStyle}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleInscription}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={1}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Création...' : 'Créer mon compte'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>Déjà un compte ? Se connecter</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: VIOLET,
  },
  scroll: {
    padding: 24,
    paddingTop: 60,
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
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginText: {
    color: VIOLET,
    fontSize: 15,
    fontWeight: '600',
  },
});