import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Confetti } from '@/components/Confetti';
import { DashboardClientLoader } from '@/components/ScreenLoader';
import { Toast, useToast } from '@/components/Toast';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import type { Theme } from '@/constants/theme';
import { apiClient } from '@/lib/api';
import { cache } from '@/lib/cache';
import type { ClientProfil, Tampon } from '@/lib/types';
import useNotifications from '../hooks/useNotifications';

type AvisModal = {
  visible: boolean;
  commercantId: string;
  commercantNom: string;
};

function FiltrePill({
  label,
  actif,
  onPress,
  theme,
}: {
  label: string;
  actif: boolean;
  onPress: () => void;
  theme: Theme;
}) {
  const progress = useSharedValue(actif ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(actif ? 1 : 0, { duration: 200 });
  }, [actif]);

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.surfaceSecondary, colors.primary],
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.border, colors.primary],
    ),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      [theme.textMuted, '#ffffff'],
    ),
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[{
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
      }, pillStyle]}>
        <Animated.Text style={[{ fontSize: 12, fontWeight: '600' }, textStyle]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function initiales(nom: string): string {
  return nom
    .split(' ')
    .slice(0, 2)
    .map(p => p.charAt(0).toUpperCase())
    .join('');
}

function DotTampon({ rempli, index, estComplete }: { rempli: boolean; index: number; estComplete: boolean }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const scale = useSharedValue(rempli ? 1 : 0.6);
  const opacity = useSharedValue(rempli ? 1 : 0.4);

  useEffect(() => {
    if (rempli) {
      scale.value = withSpring(1, { damping: 10, stiffness: 120 });
      opacity.value = withSpring(1);
    } else {
      scale.value = withSpring(0.6, { damping: 12, stiffness: 100 });
      opacity.value = withSpring(0.4);
    }
  }, [rempli]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(300).delay(index * 40).springify()}
      style={animStyle}
    >
      <View style={[styles.dot, rempli && styles.dotRempli, estComplete && rempli && styles.dotComplete]}>
        {rempli && <Text style={styles.dotCheck}>✓</Text>}
      </View>
    </Animated.View>
  );
}

// Composant séparé pour éviter la violation Rules of Hooks (hooks dans if)
function BarreProgression({ nombreTampons, maxTampons }: { nombreTampons: number; maxTampons: number }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const estComplete = nombreTampons >= maxTampons;
  const progression = Math.min(nombreTampons / maxTampons, 1);
  const largeur = useSharedValue(0);

  useEffect(() => {
    largeur.value = withSpring(progression, { damping: 15, stiffness: 80 });
  }, [progression]);

  const barreStyle = useAnimatedStyle(() => ({ width: `${largeur.value * 100}%` as any }));

  return (
    <View style={styles.barreContainer}>
      <View style={styles.barreFond}>
        <Animated.View style={[styles.barreRemplissage, barreStyle, estComplete && styles.barreComplete]} />
      </View>
      <Text style={styles.barreTexte}>
        {nombreTampons}/{maxTampons} tampons{estComplete ? ' 🎉' : ''}
      </Text>
    </View>
  );
}

function TamponsVisuels({ nombreTampons, maxTampons }: { nombreTampons: number; maxTampons: number }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const estComplete = nombreTampons >= maxTampons;
  const dots = Array.from({ length: maxTampons }, (_, i) => i < nombreTampons);

  if (maxTampons > 12) {
    return <BarreProgression nombreTampons={nombreTampons} maxTampons={maxTampons} />;
  }

  return (
    <View style={styles.dotsContainer}>
      {dots.map((rempli, i) => (
        <DotTampon key={i} rempli={rempli} index={i} estComplete={estComplete} />
      ))}
    </View>
  );
}

function EtoileNote({ note, onSelect }: { note: number; onSelect: (n: number) => void }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.etoilesContainer}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onSelect(n)} hitSlop={8}>
          <Text style={[styles.etoile, n <= note && styles.etoileActive]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ModalHistorique({ carteId, commercantNom, visible, onClose }: {
  carteId: string;
  commercantNom: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [historique, setHistorique] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    apiClient.get(`/api/client/tampons/${carteId}/historique`)
      .then(res => setHistorique(Array.isArray(res.data) ? res.data : []))
      .catch(() => setHistorique([]))
      .finally(() => setLoading(false));
  }, [visible, carteId]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={FadeInDown.duration(400).springify()}
          style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalSurtitle}>Historique des visites</Text>
          <Text style={styles.modalTitle}>{commercantNom}</Text>

          {loading ? (
            <Text style={styles.historiqueEmpty}>Chargement...</Text>
          ) : historique.length === 0 ? (
            <Text style={styles.historiqueEmpty}>Aucun historique disponible</Text>
          ) : (
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {historique.map((date, i) => (
                <View key={i} style={styles.historiqueRow}>
                  <View style={styles.historiqueDot} />
                  <Text style={styles.historiqueDate}>{formatDate(date)}</Text>
                  <Text style={styles.historiqueTampon}>+1 tampon</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.historiqueCloseBtn} onPress={onClose}>
            <Text style={styles.historiqueCloseBtnText}>Fermer</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function CarteTampon({ tampon, index, onLaisserAvis, onShowHistorique }: {
  tampon: Tampon;
  index: number;
  onLaisserAvis: (id: string, nom: string) => void;
  onShowHistorique: (carteId: string, commercantNom: string) => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const estComplete = tampon.nombreTampons >= tampon.maxTampons;
  const [showConfetti, setShowConfetti] = useState(false);
  const prevComplete = useRef(false);

  useEffect(() => {
    if (estComplete && !prevComplete.current) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 900);
      return () => clearTimeout(t);
    }
    prevComplete.current = estComplete;
  }, [estComplete]);

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(index * 100).springify()}
      style={[styles.card, estComplete && styles.cardComplete]}
    >
      <Confetti visible={showConfetti} />
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onShowHistorique(tampon.carteId, tampon.commercant?.nom ?? 'Commerce')}
      >
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardCommerceIcon}>
              <Text style={styles.cardCommerceInitiale}>
                {(tampon.commercant?.nom ?? 'C').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{tampon.commercant?.nom ?? 'Commerce'}</Text>
              <Text style={styles.cardSubtitle}>{tampon.carteName}</Text>
            </View>
            {estComplete ? (
              <View style={styles.badgeComplete}>
                <Text style={styles.badgeCompleteText}>🎁 Dispo</Text>
              </View>
            ) : (
              <Text style={styles.cardChevron}>›</Text>
            )}
          </View>
        </TouchableOpacity>

        <TamponsVisuels nombreTampons={tampon.nombreTampons} maxTampons={tampon.maxTampons} />

        <View style={styles.cardFooter}>
          <Text style={styles.cardProgression}>
            {tampon.nombreTampons}/{tampon.maxTampons} tampons
            {estComplete ? ' — Récompense disponible !' : ''}
          </Text>
          {tampon.recompense != null && (
            <Text style={styles.recompenseTexte}>🎁 {tampon.recompense}€ offerts</Text>
          )}
        </View>

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
  useNotifications();

  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { token, logout, isLoading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const qrSize = Math.min(width * 0.5, 200);

  const [client, setClient] = useState<ClientProfil | null>(null);
  const [tampons, setTampons] = useState<Tampon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfil, setShowProfil] = useState(false);
  const [filtre, setFiltre] = useState<'tout' | 'actif' | 'complet'>('tout');
  const [avisModal, setAvisModal] = useState<AvisModal>({ visible: false, commercantId: '', commercantNom: '' });
  const [historiqueSelected, setHistoriqueSelected] = useState<{ carteId: string; commercantNom: string } | null>(null);
  const { toast, showToast, hideToast } = useToast();
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [envoyerAvis, setEnvoyerAvis] = useState(false);

  const chargerDonnees = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [profilRes, tamponsRes] = await Promise.all([
        apiClient.get('/api/client/profil'),
        apiClient.get('/api/client/tampons'),
      ]);
      setClient(profilRes.data);
      setTampons(tamponsRes.data);
      // Mise en cache pour mode offline
      await Promise.all([
        cache.set('client_profil', profilRes.data),
        cache.set('client_tampons', tamponsRes.data),
      ]);
    } catch {
      // Tentative depuis le cache si pas de réseau
      const [cachedProfil, cachedTampons] = await Promise.all([
        cache.getStale<ClientProfil>('client_profil'),
        cache.getStale<Tampon[]>('client_tampons'),
      ]);
      if (cachedProfil || cachedTampons) {
        if (cachedProfil) setClient(cachedProfil);
        if (cachedTampons) setTampons(cachedTampons);
        showToast('Données hors ligne — certaines informations peuvent être obsolètes', 'warning');
      } else {
        showToast('Impossible de charger vos données. Vérifiez votre connexion.', 'error');
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.replace('/login'); return; }
    chargerDonnees();
  }, [token, authLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    chargerDonnees(true);
  };

  const ouvrirAvis = async (commercantId: string, commercantNom: string) => {
    try {
      const res = await apiClient.get(`/api/client/commercant/${commercantId}`);
      const lienGoogle = res.data?.lienGoogle;
      if (lienGoogle && lienGoogle.startsWith('http')) {
        await Linking.openURL(lienGoogle);
        return;
      }
    } catch {
      // Pas de lien Google → modal interne
    }
    setNote(0);
    setCommentaire('');
    setAvisModal({ visible: true, commercantId, commercantNom });
  };

  const soumettreAvis = async () => {
    if (note === 0) {
      Alert.alert('Note manquante', 'Sélectionnez une note avant de publier.');
      return;
    }
    setEnvoyerAvis(true);
    try {
      await apiClient.post('/api/client/avis', {
        commercantId: avisModal.commercantId,
        note,
        commentaire,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Merci !', 'Votre avis a été publié avec succès 🎉');
      setAvisModal({ visible: false, commercantId: '', commercantNom: '' });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.response?.data?.message || "Impossible d'envoyer votre avis. Réessayez.";
      Alert.alert('Erreur', msg);
    }
    setEnvoyerAvis(false);
  };

  const nbTamponsTotal = tampons.reduce((s, t) => s + t.nombreTampons, 0);
  const nbCartesCompletes = tampons.filter(t => t.nombreTampons >= t.maxTampons).length;

  const tamponsFiltres = useMemo(() => {
    if (filtre === 'complet') return tampons.filter(t => t.nombreTampons >= t.maxTampons);
    if (filtre === 'actif') return tampons.filter(t => t.nombreTampons < t.maxTampons);
    return tampons;
  }, [tampons, filtre]);

  if (authLoading || loading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <DashboardClientLoader />
      </View>
    );
  }

  const FILTRES: { key: typeof filtre; label: string }[] = [
    { key: 'tout', label: 'Tout' },
    { key: 'actif', label: 'En cours' },
    { key: 'complet', label: '🎁 Complètes' },
  ];

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.white}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header coloré */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
          <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.headerTop}>
            <View>
              <Text style={styles.headerApp}>FidèlePro</Text>
              <Text style={styles.headerBonjour}>Bonjour, {client?.nom?.split(' ')[0]} 👋</Text>
            </View>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowProfil(true); }}
              accessibilityLabel="Profil"
              accessibilityRole="button"
            >
              <Text style={styles.avatarText}>{client?.nom ? initiales(client.nom) : '?'}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Stats rapides */}
          <Animated.View entering={FadeInDown.duration(600).delay(100).springify()} style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{tampons.length}</Text>
              <Text style={styles.statPillLabel}>cartes</Text>
            </View>
            <View style={styles.statPillDivider} />
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{nbTamponsTotal}</Text>
              <Text style={styles.statPillLabel}>tampons</Text>
            </View>
            <View style={styles.statPillDivider} />
            <View style={styles.statPill}>
              <Text style={styles.statPillValue}>{nbCartesCompletes}</Text>
              <Text style={styles.statPillLabel}>récompenses</Text>
            </View>
          </Animated.View>
        </View>

        {/* QR Code + cartes */}
        <View style={styles.body}>
          <Animated.View entering={FadeInDown.duration(600).delay(200).springify()} style={styles.qrCard}>
            <View style={styles.qrCardLeft}>
              <Text style={styles.qrCardTitle}>Mon QR Code</Text>
              <Text style={styles.qrCardSubtitle}>
                {"Présentez-le\nchez un commerçant"}
              </Text>
              <View style={styles.qrCardBadge}>
                <Text style={styles.qrCardBadgeText}>✓ Actif</Text>
              </View>
            </View>
            <View style={styles.qrCodeWrapper}>
              {client?.qrCode ? (
                <QRCode value={client.qrCode} size={qrSize} />
              ) : (
                <View style={[styles.qrCodeWrapper, { backgroundColor: theme.background }]}>
                  <Text style={styles.qrPlaceholderText}>Indisponible</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Cartes fidélité */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ma fidélité</Text>
            {tampons.length > 0 && (
              <View style={styles.filtreRow}>
                {FILTRES.map(f => (
                  <FiltrePill
                    key={f.key}
                    label={f.label}
                    actif={filtre === f.key}
                    theme={theme}
                    onPress={() => { Haptics.selectionAsync(); setFiltre(f.key); }}
                  />
                ))}
              </View>
            )}
          </View>

          {tampons.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(600).delay(300).springify()} style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>Aucun tampon pour le moment</Text>
              <Text style={styles.emptySubtitle}>
                {"Scanne ton QR code chez un commerçant pour commencer !"}
              </Text>
            </Animated.View>
          ) : tamponsFiltres.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>Aucune carte dans ce filtre</Text>
              <Text style={styles.emptySubtitle}>Essayez un autre filtre</Text>
            </Animated.View>
          ) : (
            tamponsFiltres.map((t, i) => (
              <CarteTampon
                key={t.carteId}
                tampon={t}
                index={i}
                onLaisserAvis={ouvrirAvis}
                onShowHistorique={(carteId, nom) => setHistoriqueSelected({ carteId, commercantNom: nom })}
              />
            ))
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Historique */}
      <ModalHistorique
        carteId={historiqueSelected?.carteId ?? ''}
        commercantNom={historiqueSelected?.commercantNom ?? ''}
        visible={historiqueSelected !== null}
        onClose={() => setHistoriqueSelected(null)}
      />

      {/* Modal Profil */}
      <Modal visible={showProfil} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.lg }]}
          >
            <View style={styles.modalHandle} />
            <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
              <View style={[styles.avatarContainer, { width: 64, height: 64, borderRadius: 32, marginBottom: spacing.md }]}>
                <Text style={[styles.avatarText, { fontSize: 24 }]}>{client?.nom ? initiales(client.nom) : '?'}</Text>
              </View>
              <Text style={styles.modalTitle}>{client?.nom ?? ''}</Text>
              <Text style={styles.modalSurtitle}>{tampons.length} carte{tampons.length !== 1 ? 's' : ''} de fidélité</Text>
            </View>
            <View style={[styles.historiqueRow, { justifyContent: 'space-around', borderBottomWidth: 0, paddingVertical: spacing.lg }]}>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.modalTitle, { fontSize: 28 }]}>{tampons.reduce((s, t) => s + t.nombreTampons, 0)}</Text>
                <Text style={styles.modalSurtitle}>tampons total</Text>
              </View>
              <View style={{ width: 1, backgroundColor: theme.border }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.modalTitle, { fontSize: 28 }]}>{tampons.filter(t => t.nombreTampons >= t.maxTampons).length}</Text>
                <Text style={styles.modalSurtitle}>récompenses</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.parametresButton}
              onPress={() => { setShowProfil(false); router.push('/profil'); }}
              accessibilityLabel="Paramètres du compte"
              accessibilityRole="button"
            >
              <Text style={styles.parametresButtonText}>⚙️ Paramètres</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.logoutButton, { marginTop: spacing.sm }]}
              onPress={() => { setShowProfil(false); setTimeout(logout, 300); }}
            >
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.historiqueCloseBtn} onPress={() => setShowProfil(false)}>
              <Text style={styles.historiqueCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={avisModal.visible} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.lg }]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalSurtitle}>Votre avis sur</Text>
            <Text style={styles.modalTitle}>{avisModal.commercantNom}</Text>

            <Text style={styles.modalLabel}>Note</Text>
            <EtoileNote note={note} onSelect={setNote} />

            <Text style={styles.modalLabel}>Commentaire (optionnel)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Partagez votre expérience..."
              placeholderTextColor={colors.textMuted}
              value={commentaire}
              onChangeText={setCommentaire}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAvisModal({ visible: false, commercantId: '', commercantNom: '' })}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, envoyerAvis && styles.submitDisabled]}
                onPress={soumettreAvis}
                disabled={envoyerAvis}
              >
                <Text style={styles.submitText}>{envoyerAvis ? 'Envoi...' : 'Publier'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Toast
        visible={!!toast}
        message={toast?.message ?? ''}
        type={toast?.type}
        onHide={hideToast}
      />
    </>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
    // Header
    header: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.xxxl,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    headerApp: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    headerBonjour: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.white,
      marginTop: 2,
    },
    avatarContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: 'bold',
    },
    statsRow: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: radius.xxl,
      padding: spacing.md,
      alignItems: 'center',
    },
    statPill: {
      flex: 1,
      alignItems: 'center',
    },
    statPillValue: {
      color: colors.white,
      fontSize: 20,
      fontWeight: 'bold',
    },
    statPillLabel: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 11,
      marginTop: 2,
    },
    statPillDivider: {
      width: 1,
      height: 28,
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
    // Body
    body: {
      padding: spacing.xxl,
      marginTop: -spacing.md,
    },
    // QR Card horizontale
    qrCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.card,
      padding: spacing.xxl,
      marginBottom: spacing.xxl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...shadow.cardElevated,
    },
    qrCardLeft: {
      flex: 1,
      marginRight: spacing.xl,
    },
    qrCardTitle: {
      fontSize: 17,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 6,
    },
    qrCardSubtitle: {
      fontSize: 13,
      color: theme.textMuted,
      lineHeight: 19,
      marginBottom: spacing.md,
    },
    qrCardBadge: {
      backgroundColor: '#e8f8f0',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      alignSelf: 'flex-start',
    },
    qrCardBadgeText: {
      color: colors.success,
      fontSize: 12,
      fontWeight: 'bold',
    },
    qrCodeWrapper: {
      padding: spacing.sm,
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    qrPlaceholderText: {
      color: theme.textMuted,
      fontSize: 12,
    },
    sectionHeader: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: spacing.md,
    },
    filtreRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    // Cartes tampons
    card: {
      backgroundColor: theme.surface,
      borderRadius: radius.xxl,
      padding: spacing.xl,
      marginBottom: spacing.md,
      ...shadow.card,
    },
    cardComplete: {
      borderWidth: 2,
      borderColor: colors.success,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    cardCommerceIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      flexShrink: 0,
    },
    cardCommerceInitiale: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.text,
    },
    cardSubtitle: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    badgeComplete: {
      backgroundColor: '#e8f8f0',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    badgeCompleteText: {
      color: colors.success,
      fontSize: 11,
      fontWeight: 'bold',
    },
    // Tampons visuels (dots)
    dotsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    dot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: theme.border,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotRempli: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dotComplete: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    dotCheck: {
      color: colors.white,
      fontSize: 13,
      fontWeight: 'bold',
    },
    // Barre progression (fallback)
    barreContainer: { width: '100%', marginBottom: spacing.md },
    barreFond: {
      height: 10,
      backgroundColor: theme.border,
      borderRadius: 5,
      overflow: 'hidden',
      marginBottom: 6,
    },
    barreRemplissage: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 5,
    },
    barreComplete: { backgroundColor: colors.success },
    barreTexte: { fontSize: 12, color: theme.textMuted },
    cardFooter: {
      gap: 4,
    },
    cardProgression: {
      fontSize: 12,
      color: theme.textMuted,
    },
    recompenseTexte: {
      fontSize: 13,
      color: colors.success,
      fontWeight: '600',
    },
    avisButton: {
      marginTop: spacing.md,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      alignItems: 'center',
    },
    avisButtonText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 14,
    },
    emptyContainer: {
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: radius.xxl,
      padding: spacing.huge,
      marginBottom: spacing.xxl,
      ...shadow.card,
    },
    emptyIcon: { fontSize: 48, marginBottom: spacing.md },
    emptyTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: spacing.sm,
    },
    emptySubtitle: {
      color: theme.textMuted,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 20,
    },
    parametresButton: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: radius.md,
      padding: 14,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    parametresButtonText: { color: colors.primary, fontSize: 15, fontWeight: '600' },
    logoutButton: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.error,
      borderRadius: radius.md,
      padding: 14,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: spacing.xxxl,
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: spacing.xl,
    },
    modalSurtitle: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: spacing.xxl,
      marginTop: 4,
    },
    modalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: spacing.sm,
    },
    etoilesContainer: {
      flexDirection: 'row',
      marginBottom: spacing.xl,
      gap: spacing.sm,
    },
    etoile: { fontSize: 38, color: theme.border },
    etoileActive: { color: colors.warning },
    modalInput: {
      backgroundColor: theme.surfaceSecondary,
      borderRadius: radius.lg,
      padding: 14,
      fontSize: 15,
      color: theme.text,
      marginBottom: spacing.xl,
      textAlignVertical: 'top',
      minHeight: 80,
    },
    modalButtons: { flexDirection: 'row', gap: spacing.md },
    cancelButton: {
      flex: 1,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: theme.surfaceSecondary,
      alignItems: 'center',
    },
    cancelText: { color: theme.text, fontWeight: 'bold', fontSize: 15 },
    submitButton: {
      flex: 1,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    submitDisabled: { opacity: 0.6 },
    submitText: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
    // Chevron carte tampon
    cardChevron: {
      fontSize: 22,
      color: theme.textMuted,
      fontWeight: '300',
      paddingLeft: spacing.sm,
    },
    // Modal historique
    historiqueEmpty: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      paddingVertical: spacing.xxl,
    },
    historiqueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      gap: spacing.md,
    },
    historiqueDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      flexShrink: 0,
    },
    historiqueDate: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
    },
    historiqueTampon: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '700',
    },
    historiqueCloseBtn: {
      marginTop: spacing.xl,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: radius.xl,
      padding: 14,
      alignItems: 'center',
    },
    historiqueCloseBtnText: {
      color: theme.text,
      fontWeight: 'bold',
      fontSize: 15,
    },
  });
}
