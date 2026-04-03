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
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';

const API = 'https://fid-lepro-production.up.railway.app';

const VIOLET = '#6637ee';
const BLANC = '#ffffff';
const GRIS = '#f5f5f5';
const GRIS_TEXTE = '#333333';
const GRIS_CLAIR = '#888888';
const ROUGE = '#e74c3c';
const VERT = '#2ecc71';
const ORANGE = '#f39c12';

type Client = {
  nom: string;
  email: string;
  totalTampons: number;
  derniereScan: string | null;
};

type ScanData = {
  data: string;
};

type Stats = {
  totalClients: number;
  totalScans: number;
  clientActif: string | null;
  moyenneScans: number;
};

function CarteStatistique({
  icon,
  valeur,
  label,
  couleur,
  index,
}: {
  icon: string;
  valeur: string | number;
  label: string;
  couleur: string;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(index * 100).springify()}
      style={[styles.statCard, { borderLeftColor: couleur }]}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValeur, { color: couleur }]}>{valeur}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function CarteClient({ client, index, onScanSuccess }: {
  client: Client;
  index: number;
  onScanSuccess: () => void;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const joursInactif = client.derniereScan
    ? Math.floor((Date.now() - new Date(client.derniereScan).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const estInactif = joursInactif !== null && joursInactif > 30;

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(index * 80).springify()}
      style={[styles.clientCard, estInactif && styles.clientCardInactif]}
    >
      <View style={styles.clientHeader}>
        <View style={styles.clientAvatar}>
          <Text style={styles.clientAvatarText}>
            {client.nom.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientNom}>{client.nom}</Text>
          <Text style={styles.clientEmail}>{client.email}</Text>
        </View>
        {estInactif && (
          <View style={styles.badgeInactif}>
            <Text style={styles.badgeInactifText}>Inactif</Text>
          </View>
        )}
      </View>

      <View style={styles.clientStats}>
        <View style={styles.clientStat}>
          <Text style={styles.clientStatValeur}>{client.totalTampons}</Text>
          <Text style={styles.clientStatLabel}>tampons</Text>
        </View>
        <View style={styles.clientStat}>
          <Text style={styles.clientStatValeur}>
            {joursInactif !== null ? `${joursInactif}j` : 'N/A'}
          </Text>
          <Text style={styles.clientStatLabel}>inactivité</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function DashboardCommercant() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalScans: 0,
    clientActif: null,
    moyenneScans: 0,
  });

  const chargerDonnees = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const res = await axios.get(API + '/api/commercant/clients', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const liste: Client[] = Array.isArray(res.data) ? res.data : res.data.clients || [];
      setClients(liste);

      const totalScans = liste.reduce((sum, c) => sum + c.totalTampons, 0);
      const topClient = liste.length > 0 ? liste[0].nom : null;
      const moyenne = liste.length > 0 ? Math.round(totalScans / liste.length) : 0;

      setStats({
        totalClients: liste.length,
        totalScans,
        clientActif: topClient,
        moyenneScans: moyenne,
      });
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    chargerDonnees();
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
        '✅ Succès !',
        `Tampon ajouté pour ${res.data.client?.nom ?? 'le client'}\nTotal : ${res.data.totalTampons} tampon(s)${res.data.recompense ? '\n🎁 ' + res.data.recompense : ''}`
      );
      chargerDonnees();
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
      <Animated.Text entering={FadeInDown.duration(600).springify()} style={styles.title}>
        FidèlePro
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(600).delay(100).springify()} style={styles.subtitle}>
        Espace Commerçant
      </Animated.Text>

      <Animated.View entering={FadeInDown.duration(600).delay(150).springify()} style={{ width: '100%' }}>
        <TouchableOpacity style={styles.scanButton} onPress={ouvrirScanner}>
          <Text style={styles.scanButtonText}>📷 Scanner un client</Text>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.statsGrid}>
        <CarteStatistique icon="👥" valeur={stats.totalClients} label="Clients" couleur={VIOLET} index={0} />
        <CarteStatistique icon="🎯" valeur={stats.totalScans} label="Scans total" couleur={VERT} index={1} />
        <CarteStatistique icon="⭐" valeur={stats.moyenneScans} label="Moy. scans" couleur={ORANGE} index={2} />
        <CarteStatistique icon="🏆" valeur={stats.clientActif ?? 'N/A'} label="Top client" couleur={ROUGE} index={3} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Mes clients {clients.length > 0 && `(${clients.length})`}
        </Text>
        {clients.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.empty}>Aucun client pour le moment</Text>
            <Text style={styles.emptySubtitle}>Scannez un QR code pour commencer !</Text>
          </Animated.View>
        ) : (
          clients.map((c, i) => (
            <CarteClient
              key={i}
              client={c}
              index={i}
              onScanSuccess={chargerDonnees}
            />
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
    shadowColor: VIOLET,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  scanButtonText: {
    color: BLANC,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: BLANC,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValeur: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: GRIS_CLAIR,
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
  clientCard: {
    backgroundColor: BLANC,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  clientCardInactif: {
    borderWidth: 1,
    borderColor: '#ffcccc',
    backgroundColor: '#fff9f9',
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    color: BLANC,
    fontSize: 18,
    fontWeight: 'bold',
  },
  clientInfo: {
    flex: 1,
  },
  clientNom: {
    fontSize: 15,
    fontWeight: 'bold',
    color: GRIS_TEXTE,
  },
  clientEmail: {
    fontSize: 12,
    color: GRIS_CLAIR,
    marginTop: 2,
  },
  badgeInactif: {
    backgroundColor: '#ffeeee',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeInactifText: {
    color: ROUGE,
    fontSize: 11,
    fontWeight: 'bold',
  },
  clientStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  clientStat: {
    flex: 1,
    alignItems: 'center',
  },
  clientStatValeur: {
    fontSize: 18,
    fontWeight: 'bold',
    color: VIOLET,
  },
  clientStatLabel: {
    fontSize: 11,
    color: GRIS_CLAIR,
    marginTop: 2,
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