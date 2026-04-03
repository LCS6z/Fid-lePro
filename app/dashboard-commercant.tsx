import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const API = 'https://fid-lepro-production.up.railway.app';

const VIOLET = '#6637ee';
const BLANC = '#ffffff';
const GRIS = '#f5f5f5';
const GRIS_TEXTE = '#333333';
const ROUGE = '#e74c3c';

type Client = {
  nom: string;
  email: string;
  totalTampons: number;
};

type ScanData = {
  data: string;
};

export default function DashboardCommercant() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    const load = async () => {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const res = await axios.get(API + '/api/commercant/clients', {
          headers: { Authorization: 'Bearer ' + token },
        });
        setClients(Array.isArray(res.data) ? res.data : res.data.clients || []);
      } catch (e) {
        console.log(e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const ouvrirScanner = async () => {
    if (!permission || !permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission refusée', 'Autorise la caméra pour scanner');
        return;
      }
    }
    setScanned(false);
    setScanning(true);
  };

  const handleScan = async ({ data }: ScanData) => {
    if (scanned) return;
    setScanned(true);
    setScanning(false);
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await axios.post(
        API + '/api/scan',
        { qrCode: data },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      Alert.alert(
        'Succès !',
        'Tampon ajouté pour ' + (res.data.client ? res.data.client.nom : 'le client')
      );
    } catch (e) {
      Alert.alert('Erreur', 'QR code invalide ou client introuvable');
    }
  };

  const deconnexion = async () => {
    await AsyncStorage.clear();
    router.replace('/login');
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={VIOLET} />;
  }

  if (scanning) {
    return (
      <View style={styles.scanContainer}>
        <Text style={styles.scanTitle}>Scanner le QR client</Text>
        <CameraView
          style={styles.scanner}
          onBarcodeScanned={handleScan}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
        <TouchableOpacity style={styles.cancelButton} onPress={() => setScanning(false)}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>FidèlePro</Text>
      <Text style={styles.subtitle}>Espace Commerçant</Text>

      <TouchableOpacity style={styles.scanButton} onPress={ouvrirScanner}>
        <Text style={styles.scanButtonText}>📷 Scanner un client</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes clients</Text>
        {clients.length === 0 ? (
          <Text style={styles.empty}>Aucun client pour le moment</Text>
        ) : (
          clients.map((c, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardTitle}>{c.nom}</Text>
              <Text style={styles.cardText}>{c.email}</Text>
              <Text style={styles.cardText}>{c.totalTampons} tampon(s)</Text>
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
  scanButton: {
    backgroundColor: VIOLET,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  scanButtonText: {
    color: BLANC,
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GRIS_TEXTE,
    marginBottom: 16,
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
  scanContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTitle: {
    color: BLANC,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scanner: {
    width: 300,
    height: 300,
  },
  cancelButton: {
    marginTop: 30,
    backgroundColor: ROUGE,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    width: 200,
  },
  cancelText: {
    color: BLANC,
    fontSize: 16,
    fontWeight: 'bold',
  },
});