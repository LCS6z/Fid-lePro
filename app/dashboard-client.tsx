import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const API = 'https://fid-lepro-production.up.railway.app';

const VIOLET = '#6637ee';
const BLANC = '#ffffff';
const GRIS = '#f5f5f5';
const GRIS_TEXTE = '#333333';
const GRIS_CLAIR = '#888888';
const ROUGE = '#e74c3c';

type Client = {
  nom: string;
  qrCode: string;
};

type Tampon = {
  commercant?: { nom: string };
  nombreTampons: number;
};

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
          headers: { Authorization: 'Bearer ' + token }
        });
        setClient(res.data);
        const res2 = await axios.get(API + '/api/client/tampons', {
          headers: { Authorization: 'Bearer ' + token }
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
      <Text style={styles.title}>FidèlePro</Text>
      <Text style={styles.subtitle}>Bonjour {client?.nom} !</Text>

      <View style={styles.qrContainer}>
        <Text style={styles.sectionTitle}>Mon QR Code</Text>
        {client?.qrCode ? (
          <QRCode value={client.qrCode} size={200} />
        ) : (
          <Text>QR code non disponible</Text>
        )}
        <Text style={styles.qrLabel}>Présente ce code au commerçant</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes tampons</Text>
        {tampons.length === 0 ? (
          <Text style={styles.empty}>Aucun tampon pour le moment</Text>
        ) : (
          tampons.map((t, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardTitle}>{t.commercant?.nom ?? 'Commerce'}</Text>
              <Text style={styles.cardText}>{t.nombreTampons} tampon(s)</Text>
            </View>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GRIS_TEXTE,
  },
  cardText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  empty: {
    color: '#aaaaaa',
    textAlign: 'center',
    padding: 20,
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