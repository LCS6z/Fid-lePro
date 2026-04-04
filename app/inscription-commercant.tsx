import axios from 'axios';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
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
const VERT = '#2ecc71';

type Etape = 1 | 2 | 3;

export default function InscriptionCommercant() {
  const [etape, setEtape] = useState<Etape>(1);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [typeCommerce, setTypeCommerce] = useState('');
  const [cgvAcceptees, setCgvAcceptees] = useState(false);
  const [loading, setLoading] = useState(false);

  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));
  const handlePressIn = () => { buttonScale.value = withSpring(0.95); };
  const handlePressOut = () => { buttonScale.value = withSpring(1); };

  const validerEtape1 = () => {
    if (!nom || !email || !password) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    setEtape(2);
  };

  const validerEtape2 = () => {
    if (!telephone || !adresse || !typeCommerce) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires');
      return;
    }
    setEtape(3);
  };

  const handleInscription = async () => {
    if (!cgvAcceptees) {
      Alert.alert('Erreur', 'Vous devez accepter les CGV pour continuer');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(API + '/api/stripe/inscription-commercant', {
        nom,
        email,
        password,
        telephone,
        adresse,
        typeCommerce,
      });

      const checkoutUrl = res.data.checkoutUrl;

      Alert.alert(
        '✅ Compte créé !',
        'Vous allez être redirigé vers le paiement sécurisé (150€ de mise en service).',
        [
          {
            text: 'Procéder au paiement',
            onPress: () => Linking.openURL(checkoutUrl),
          },
        ]
      );
    } catch (err: any) {
      const message = err?.response?.data?.erreur || 'Erreur serveur';
      Alert.alert('Erreur', message);
    }
    setLoading(false);
  };

  const indicateurEtape = (n: number) => (
    <View style={[styles.etapeIndicateur, etape >= n && styles.etapeActive]}>
      <Text style={[styles.etapeNumero, etape >= n && styles.etapeNumeroActive]}>
        {etape > n ? '✓' : n}
      </Text>
    </View>
  );

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
          <Text style={styles.tagline}>Inscription commerçant</Text>
        </Animated.View>

        <View style={styles.etapesContainer}>
          {indicateurEtape(1)}
          <View style={[styles.etapeLigne, etape >= 2 && styles.etapeLigneActive]} />
          {indicateurEtape(2)}
          <View style={[styles.etapeLigne, etape >= 3 && styles.etapeLigneActive]} />
          {indicateurEtape(3)}
        </View>

        <Animated.View entering={FadeInDown.duration(800).delay(200).springify()} style={styles.card}>

          {etape === 1 && (
            <>
              <Text style={styles.cardTitle}>Informations de connexion</Text>

              <TextInput
                style={styles.input}
                placeholder="Nom du commerce"
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
                placeholder="Mot de passe (6 caractères min)"
                placeholderTextColor={PLACEHOLDER}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Animated.View style={buttonStyle}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={validerEtape1}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  activeOpacity={1}
                >
                  <Text style={styles.buttonText}>Continuer →</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}

          {etape === 2 && (
            <>
              <Text style={styles.cardTitle}>Informations du commerce</Text>

              <TextInput
                style={styles.input}
                placeholder="Téléphone"
                placeholderTextColor={PLACEHOLDER}
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Adresse du commerce"
                placeholderTextColor={PLACEHOLDER}
                value={adresse}
                onChangeText={setAdresse}
                autoCapitalize="words"
              />
              <TextInput
                style={styles.input}
                placeholder="Type de commerce (ex: Restaurant, Café...)"
                placeholderTextColor={PLACEHOLDER}
                value={typeCommerce}
                onChangeText={setTypeCommerce}
                autoCapitalize="words"
              />

              <View style={styles.boutonRow}>
                <TouchableOpacity style={styles.boutonRetour} onPress={() => setEtape(1)}>
                  <Text style={styles.boutonRetourText}>← Retour</Text>
                </TouchableOpacity>
                <Animated.View style={[buttonStyle, { flex: 1 }]}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={validerEtape2}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={1}
                  >
                    <Text style={styles.buttonText}>Continuer →</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </>
          )}

          {etape === 3 && (
            <>
              <Text style={styles.cardTitle}>Récapitulatif & Paiement</Text>

              <View style={styles.recap}>
                <Text style={styles.recapTitre}>📋 Votre offre</Text>
                <View style={styles.recapLigne}>
                  <Text style={styles.recapLabel}>Mise en service</Text>
                  <Text style={styles.recapValeur}>150 €</Text>
                </View>
                <View style={styles.recapLigne}>
                  <Text style={styles.recapLabel}>Abonnement mensuel</Text>
                  <Text style={styles.recapValeur}>49 €/mois</Text>
                </View>
                <View style={styles.recapLigne}>
                  <Text style={styles.recapLabel}>Engagement</Text>
                  <Text style={[styles.recapValeur, { color: VERT }]}>Aucun</Text>
                </View>
                <View style={styles.recapLigne}>
                  <Text style={styles.recapLabel}>Résiliation</Text>
                  <Text style={styles.recapValeur}>1 mois de préavis</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.cgvContainer}
                onPress={() => setCgvAcceptees(!cgvAcceptees)}
              >
                <View style={[styles.checkbox, cgvAcceptees && styles.checkboxActive]}>
                  {cgvAcceptees && <Text style={styles.checkboxCheck}>✓</Text>}
                </View>
                <Text style={styles.cgvTexte}>
                  J'accepte les{' '}
                  <Text style={styles.cgvLien} onPress={() => router.push('/cgv')}>conditions générales de vente</Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.boutonRow}>
                <TouchableOpacity style={styles.boutonRetour} onPress={() => setEtape(2)}>
                  <Text style={styles.boutonRetourText}>← Retour</Text>
                </TouchableOpacity>
                <Animated.View style={[buttonStyle, { flex: 1 }]}>
                  <TouchableOpacity
                    style={[styles.button, !cgvAcceptees && styles.buttonDisabled]}
                    onPress={handleInscription}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={1}
                    disabled={!cgvAcceptees}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Création...' : '💳 Payer 150€'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </>
          )}

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
    paddingBottom: 40,
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
    marginBottom: 24,
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
  etapesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  etapeIndicateur: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etapeActive: {
    backgroundColor: BLANC,
  },
  etapeNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.7)',
  },
  etapeNumeroActive: {
    color: VIOLET,
  },
  etapeLigne: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  etapeLigneActive: {
    backgroundColor: BLANC,
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
    fontSize: 20,
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
  buttonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: BLANC,
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  boutonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  boutonRetour: {
    padding: 18,
    borderRadius: 14,
    backgroundColor: GRIS,
  },
  boutonRetourText: {
    color: GRIS_TEXTE,
    fontSize: 15,
    fontWeight: '600',
  },
  recap: {
    backgroundColor: GRIS,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  recapTitre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GRIS_TEXTE,
    marginBottom: 16,
  },
  recapLigne: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recapLabel: {
    fontSize: 14,
    color: '#666666',
  },
  recapValeur: {
    fontSize: 14,
    fontWeight: 'bold',
    color: GRIS_TEXTE,
  },
  cgvContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cccccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: VIOLET,
    borderColor: VIOLET,
  },
  checkboxCheck: {
    color: BLANC,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cgvTexte: {
    flex: 1,
    fontSize: 14,
    color: GRIS_TEXTE,
  },
  cgvLien: {
    color: VIOLET,
    fontWeight: '600',
    textDecorationLine: 'underline',
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