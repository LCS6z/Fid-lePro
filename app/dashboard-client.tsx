import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
const JAUNE = '#f1c40f';

type Client = {
  nom: string;
  qrCode: string;
};

type Tampon = {
  carteId: string;
  carteName: string;
  commercant?: { nom: string; id?: string };
  nombreTampons: number;
  maxTampons: number;
  recompense?: number | null;
};

type AvisModal = {
  visible: boolean;
  commercantId: string;
  commercantNom: string;
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
        <Animated.View style={[styles.barreRemplissage, barreStyle, estComplete && styles.barreComplete]} />
      </View>
      <Text style={styles.barreTexte}>
        {nombreTampons}/{maxTampons} tampons
        {estComplete ? ' 🎉 Récompense disponible !' : ''}
      </Text>
    </View>
  );
}

function EtoileNote({ note, onSelect }: { note: number; onSelect: (n: number) => void }) {
  return (
    <View style={styles.etoilesContainer}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onSelect(n)}>
          <Text style={[styles.etoile, n <= note && styles.etoileActive]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CarteTampon({ tampon, index, onLaisserAvis }: {
  tampon: Tampon;
  index: number;
  onLaisserAvis: (id: string, nom: string) => void;
}) {
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
      <BarreProgression nombreTampons={tampon.nombreTampons} maxTampons={tampon.maxTampons} />
      {tampon.recompense && (
        <Text style={styles.recompenseTexte}>Récompense : {tampon.recompense}€</Text>
      )}
      {tampon.commercant?.id && (
        <TouchableOpacity
          style={styles.avisButton}
          onPress={() => onLaisserAvis(tampon.commercant!.id!, tampon.commercant!.nom!)}
        >
          <Text style={styles.avisButtonText}>⭐ Laisser un avis</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function DashboardClient() {
  const [client, setClient] = useState<Client | null>(null);
  const [tampons, setTampons] = useState<Tampon[]>([]);
  const [loading, setLoading] = useState(true);
  const [avisModal, setAvisModal] = useState<AvisModal>({
    visible: false,
    commercantId: '',
    commercantNom: '',
  });
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [envoyerAvis, setEnvoyerAvis] = useState(false);

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

  const ouvrirAvis = async (commercantId: string, commercantNom: string) => {
  const token = await AsyncStorage.getItem('token');
  try {
    const res = await axios.get(API + '/api/client/commercant/' + commercantId, {
      headers: { Authorization: 'Bearer ' + token },
    });
    const lienGoogle = res.data.lienGoogle;
    if (lienGoogle) {
      Linking.openURL(lienGoogle);
    } else {
      setNote(0);
      setCommentaire('');
      setAvisModal({ visible: true, commercantId, commercantNom });
    }
  } catch {
    setNote(0);
    setCommentaire('');
    setAvisModal({ visible: true, commercantId, commercantNom });
  }
};

  const soumettreAvis = async () => {
    if (note === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner une note');
      return;
    }
    setEnvoyerAvis(true);
    const token = await AsyncStorage.getItem('token');
    try {
      await axios.post(
        API + '/api/client/avis',
        { commercantId: avisModal.commercantId, note, commentaire },
        { headers: { Authorization: 'Bearer ' + token } }
      );
      Alert.alert('Merci !', 'Votre avis a été publié avec succès 🎉');
      setAvisModal({ visible: false, commercantId: '', commercantNom: '' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'envoi';
      Alert.alert('Erreur', msg);
    }
    setEnvoyerAvis(false);
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={VIOLET} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.Text entering={FadeInDown.duration(600).springify()} style={styles.title}>
        FidèlePro
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(600).delay(100).springify()} style={styles.subtitle}>
        Bonjour {client?.nom} ! 👋
      </Animated.Text>

      <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} style={styles.qrContainer}>
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
          <Animated.View entering={FadeInDown.duration(600).delay(300).springify()} style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.empty}>Aucun tampon pour le moment</Text>
            <Text style={styles.emptySubtitle}>Scanne ton QR code chez un commerçant pour commencer !</Text>
          </Animated.View>
        ) : (
          tampons.map((t, i) => (
            <CarteTampon key={t.carteId} tampon={t} index={i} onLaisserAvis={ouvrirAvis} />
          ))
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={deconnexion}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </TouchableOpacity>

      {/* Modal Avis */}
      <Modal visible={avisModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.modalCard}>
            <Text style={styles.modalTitre}>Votre avis sur</Text>
            <Text style={styles.modalCommerce}>{avisModal.commercantNom}</Text>

            <Text style={styles.modalLabel}>Note</Text>
            <EtoileNote note={note} onSelect={setNote} />

            <Text style={styles.modalLabel}>Commentaire (optionnel)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Partagez votre expérience..."
              placeholderTextColor={GRIS_CLAIR}
              value={commentaire}
              onChangeText={setCommentaire}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBoutons}>
              <TouchableOpacity
                style={styles.modalBoutonAnnuler}
                onPress={() => setAvisModal({ visible: false, commercantId: '', commercantNom: '' })}
              >
                <Text style={styles.modalBoutonAnnulerTexte}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBoutonEnvoyer, envoyerAvis && { opacity: 0.6 }]}
                onPress={soumettreAvis}
                disabled={envoyerAvis}
              >
                <Text style={styles.modalBoutonEnvoyerTexte}>
                  {envoyerAvis ? 'Envoi...' : 'Publier'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  avisButton: {
    marginTop: 12,
    backgroundColor: GRIS,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  avisButtonText: {
    color: VIOLET,
    fontWeight: 'bold',
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: BLANC,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
  },
  modalTitre: {
    fontSize: 16,
    color: GRIS_CLAIR,
    textAlign: 'center',
  },
  modalCommerce: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GRIS_TEXTE,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GRIS_TEXTE,
    marginBottom: 8,
  },
  etoilesContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  etoile: {
    fontSize: 36,
    color: '#dddddd',
  },
  etoileActive: {
    color: JAUNE,
  },
  modalInput: {
    backgroundColor: GRIS,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: GRIS_TEXTE,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  modalBoutons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBoutonAnnuler: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: GRIS,
    alignItems: 'center',
  },
  modalBoutonAnnulerTexte: {
    color: GRIS_TEXTE,
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalBoutonEnvoyer: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: VIOLET,
    alignItems: 'center',
  },
  modalBoutonEnvoyerTexte: {
    color: BLANC,
    fontWeight: 'bold',
    fontSize: 15,
  },
});