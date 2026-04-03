import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const API = 'https://fid-lepro-production.up.railway.app';

const VIOLET = '#6637ee';
const BLANC = '#ffffff';
const GRIS = '#f5f5f5';
const GRIS_TEXTE = '#333333';
const GRIS_CLAIR = '#888888';
const ROUGE = '#e74c3c';
const VERT = '#2ecc71';

type Client = {
  nom: string;
  qrCode: string;
};

type Tampon = {
  carteId: string;
  carteName: string;
  commercant?: { nom: string };
  nombreTampons: number;
  maxTampons: number;
  recompense?: number | null;
};

function BarreProgression({ nombreTampons, maxTampons }: { nombreTampons: number; maxTampons: number }) {
  const progression = Math.min(nombreTampons / maxTampons, 1);
  const largeur = useSharedValue(0);

  useEffect(() => {
    largeur.value = withSpring(progression, { damping: 15, stiffness: 80 });
  }, [nombreTampons, maxTampons]);

  const barreStyle = useAnimatedStyle(() => ({
    width: `${largeur.value * 100}%`,
  }));

  const estComplete = nombreTampons >= maxTampons;

  return (
    <View style={styles.barreContainer}>
      <View style={styles.barreFond}>
        <Animated.View
          style={[
            styles.barreRemplissage,
            barreStyle,
            estComplete && styles.barreComplete,
          ]}
        />
      </View>
      <Text style={styles.barreTexte}>
        {nombreTampons}/{maxTampons} tampons
        {estComplete ? ' 🎉 Récompense disponible !' : ''}
      </Text>
    </View>
  );
}

function CarteTampon({ tampon, index }: { tampon: Tampon; index: number }) {
  const estComplete = tampon.nombreTampons >= tampon.maxTampons;

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(index * 100).springify()}
      style={[styles.card, estComplete && styles.cardComplete]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{tampon.commercant?.nom ?? 'Commerce'}</Text>
        {estComplete && <Text style={styles.badge}>🎁 Récompense</Text>}
      </View>
      <Text style={styles.cardSubtitle}>{tampon.carteName}</Text>
      <BarreProgression
        nombreTampons={tampon.nombreTampons}
        maxTampons={tampon.maxTampons}
      />
      {tampon.recompense && (
        <Text style={styles.recompenseTexte}>
          Récompense : {tampon.recompense}€
        </Text>
      )}
    </Animated.View>
  );
}

export default function DashboardClient() {
  const [client, setClient] = useState<Client | null>(null);
  const [tampons, setTampons] = useState<Tampon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const res = await axios.get(API + '/api/client/profil', {
          headers: { Authorization: 'Bearer ' + token },
        });
        setClient(res.data);
        const res2 = await axios.get(API + '/api/client/tampons', {
          headers: { Authorization: 'Bearer ' + token },
        });
        setTampons(res2.data);
      } catch (e) {
        console.log(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const deconnexion = async () => {
    await AsyncStorage.clear();
    router.replace('/login');
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={VIOLET} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.Text
        entering={FadeInDown.duration(600).springify()}
        style={styles.title}
      >
        FidèlePro
      </Animated.Text>
      <Animated.Text
        entering={FadeInDown.duration(600).delay(100).springify()}
        style={styles.subtitle}
      >
        Bonjour {client?.nom} ! 👋
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.duration(600).delay(200).springify()}
        style={styles.qrContainer}
      >
        <Text style={styles.sectionTitle}>Mon QR Code</Text>
        {client?.qrCode ? (
          <QRCode value={client.qrCode} size={200} />
        ) : (
          <Text>QR code non disponible</Text>
        )}
        <Text style={styles.qrLabel}>Présente ce code au commerçant</Text>
      </Animated.View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ma fidélité</Text>
        {tampons.length === 0 ? (
          <Animated.View
            entering={FadeInDown.duration(600).delay(300).springify()}
            style={styles.emptyContainer}
          >
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.empty}>Aucun tampon pour le moment</Text>
            <Text style={styles.emptySubtitle}>
              Scanne ton QR code chez un commerçant pour commencer !
            </Text>
          </Animated.View>
        ) : (
          tampons.map((t, i) => (
            <CarteTampon key={t.carteId} tampon={t} index={i} />
          ))
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={deconnexion}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: GRIS,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: VIOLET,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#555555',
    marginBottom: 24,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: BLANC,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GRIS_TEXTE,
    marginBottom: 16,
  },
  qrLabel: {
    marginTop: 12,
    color: GRIS_CLAIR,
    fontSize: 13,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  card: {
    backgroundColor: BLANC,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardComplete: {
    borderWidth: 2,
    borderColor: VERT,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GRIS_TEXTE,
  },
  cardSubtitle: {
    fontSize: 13,
    color: GRIS_CLAIR,
    marginBottom: 12,
  },
  badge: {
    fontSize: 12,
    color: VERT,
    fontWeight: 'bold',
  },
  barreContainer: {
    width: '100%',
  },
  barreFond: {
    height: 12,
    backgroundColor: '#eeeeee',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barreRemplissage: {
    height: '100%',
    backgroundColor: VIOLET,
    borderRadius: 6,
  },
  barreComplete: {
    backgroundColor: VERT,
  },
  barreTexte: {
    fontSize: 12,
    color: GRIS_CLAIR,
  },
  recompenseTexte: {
    marginTop: 8,
    fontSize: 13,
    color: VERT,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: BLANC,
    borderRadius: 16,
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  empty: {
    color: GRIS_TEXTE,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: GRIS_CLAIR,
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    backgroundColor: ROUGE,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: BLANC,
    fontSize: 16,
    fontWeight: 'bold',
  },
});