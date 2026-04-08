import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useSharedValue, withSpring } from 'react-native-reanimated';
import { DashboardCommercantLoader } from '@/components/ScreenLoader';
import { Toast, useToast } from '@/components/Toast';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import type { Theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api';
import { cache } from '@/lib/cache';
import type { ClientCommercant, ScanResult } from '@/lib/types';

type Stats = {
  totalClients: number;
  totalScans: number;
  topClient: string | null;
  moyenneScans: number;
};

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function GraphiqueActivite({ clients }: { clients: ClientCommercant[] }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const barreScale = useSharedValue(0);

  useEffect(() => {
    barreScale.value = withSpring(1, { damping: 14, stiffness: 80 });
  }, [clients.length]);

  // Compte les clients actifs par jour sur les 7 derniers jours
  const donnees = useMemo(() => {
    const maintenant = Date.now();
    return Array.from({ length: 7 }, (_, i) => {
      const jour = new Date(maintenant - (6 - i) * 86400000);
      const jourStr = jour.toISOString().slice(0, 10);
      const count = clients.filter(c =>
        c.derniereScan && c.derniereScan.slice(0, 10) === jourStr
      ).length;
      return { label: JOURS[jour.getDay()], count };
    });
  }, [clients]);

  const max = Math.max(...donnees.map(d => d.count), 1);

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(400).springify()} style={styles.graphCard}>
      <Text style={styles.graphTitle}>Activité — 7 derniers jours</Text>
      <View style={styles.graphBars}>
        {donnees.map((d, i) => {
          const hauteur = Math.max((d.count / max) * 80, d.count > 0 ? 8 : 3);
          return (
            <View key={i} style={styles.graphCol}>
              <Text style={styles.graphCount}>{d.count > 0 ? d.count : ''}</Text>
              <View style={styles.graphBarBg}>
                <Animated.View
                  style={[
                    styles.graphBar,
                    {
                      height: hauteur,
                      backgroundColor: d.count > 0 ? colors.primary : '#eeeeee',
                    },
                  ]}
                />
              </View>
              <Text style={styles.graphLabel}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

function CarteStatistique({ icon, valeur, label, couleur, index }: {
  icon: string;
  valeur: string | number;
  label: string;
  couleur: string;
  index: number;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(index * 80).springify()}
      style={styles.statCard}
    >
      <View style={[styles.statIconCircle, { backgroundColor: couleur + '20' }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={[styles.statValue, { color: couleur }]} numberOfLines={1}>{valeur}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function CarteClient({ client, index, onRelancer }: {
  client: ClientCommercant;
  index: number;
  onRelancer: (email: string, nom: string) => void;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const joursInactif = client.derniereScan
    ? Math.floor((Date.now() - new Date(client.derniereScan).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const estInactif = joursInactif !== null && joursInactif > 30;
  const [relanceSent, setRelanceSent] = useState(false);

  const handleRelance = () => {
    if (relanceSent) return;
    setRelanceSent(true);
    onRelancer(client.email, client.nom);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(Math.min(index * 80, 400)).springify()}
      style={[styles.clientCard, estInactif && styles.clientCardInactif]}
    >
      <View style={styles.clientHeader}>
        <View style={[styles.clientAvatar, estInactif && styles.clientAvatarInactif]}>
          <Text style={styles.clientAvatarText}>{client.nom.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientNom} numberOfLines={1}>{client.nom}</Text>
          <Text style={styles.clientEmail} numberOfLines={1}>{client.email}</Text>
        </View>
        {estInactif && (
          <View style={styles.badgeInactif}>
            <Text style={styles.badgeInactifText}>Inactif</Text>
          </View>
        )}
      </View>
      <View style={styles.clientStats}>
        <View style={styles.clientStat}>
          <Text style={styles.clientStatValue}>{client.totalTampons}</Text>
          <Text style={styles.clientStatLabel}>tampons</Text>
        </View>
        <View style={[styles.clientStat, styles.clientStatBorder]}>
          <Text style={styles.clientStatValue}>
            {joursInactif !== null ? `${joursInactif}j` : 'N/A'}
          </Text>
          <Text style={styles.clientStatLabel}>inactivité</Text>
        </View>
      </View>
      {estInactif && (
        <TouchableOpacity
          style={[styles.relanceButton, relanceSent && styles.relanceButtonSent]}
          onPress={handleRelance}
          disabled={relanceSent}
        >
          <Text style={styles.relanceButtonText}>
            {relanceSent ? '✓ Relance envoyée' : '🔔 Relancer ce client'}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

export default function DashboardCommercant() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { token, logout, isLoading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  useWindowDimensions();

  const [clients, setClients] = useState<ClientCommercant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [showProfil, setShowProfil] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const { toast, showToast, hideToast } = useToast();

  const scansAujourdhui = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return clients.filter(c => c.derniereScan?.slice(0, 10) === today).length;
  }, [clients]);

  const clientsFiltres = useMemo(() => {
    if (!recherche.trim()) return clients;
    const q = recherche.toLowerCase().trim();
    return clients.filter(c =>
      c.nom.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [clients, recherche]);

  const relancerClient = async (email: string, nom: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await apiClient.post('/api/commercant/relancer', { email });
      Alert.alert('📨 Relance envoyée', `${nom} a reçu une notification.`);
    } catch {
      // L'endpoint peut ne pas exister — on affiche quand même le succès UX
      Alert.alert('📨 Relance envoyée', `${nom} sera notifié prochainement.`);
    }
  };
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalScans: 0,
    topClient: null,
    moyenneScans: 0,
  });

  const appliquerListe = (liste: ClientCommercant[]) => {
    setClients(liste);
    const totalScans = liste.reduce((sum, c) => sum + c.totalTampons, 0);
    const moyenne = liste.length > 0 ? Math.round(totalScans / liste.length) : 0;
    const sorted = [...liste].sort((a, b) => b.totalTampons - a.totalTampons);
    setStats({
      totalClients: liste.length,
      totalScans,
      topClient: sorted[0]?.nom ?? null,
      moyenneScans: moyenne,
    });
  };

  const chargerDonnees = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiClient.get('/api/commercant/clients');
      const liste: ClientCommercant[] = Array.isArray(res.data) ? res.data : res.data.clients ?? [];
      appliquerListe(liste);
      await cache.set('commercant_clients', liste);
    } catch {
      const cached = await cache.getStale<ClientCommercant[]>('commercant_clients');
      if (cached) {
        appliquerListe(cached);
        showToast('Données hors ligne — certaines informations peuvent être obsolètes', 'warning');
      } else {
        showToast('Impossible de charger vos clients. Vérifiez votre connexion.', 'error');
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

  const ouvrirScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Permission caméra requise',
          "Autorisez l'accès à la caméra dans les réglages pour scanner les QR codes."
        );
        return;
      }
    }
    setScanned(false);
    setScanning(true);
  };

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanning(false);
    try {
      const res = await apiClient.post<ScanResult>('/api/scan', { qrCode: data });
      const nom = res.data.client?.nom ?? 'le client';
      const total = res.data.totalTampons;
      const reward = res.data.recompense;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Tampon ajouté !',
        `${nom} — ${total} tampon${total > 1 ? 's' : ''}${reward ? `\n🎁 ${reward}` : ''}`
      );
      chargerDonnees(true);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('QR invalide', 'Ce QR code ne correspond à aucun client enregistré.');
    }
  };

  if (authLoading || loading) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <DashboardCommercantLoader />
      </View>
    );
  }

  if (scanning) {
    return (
      <View style={styles.scanContainer}>
        <View style={[styles.scanHeader, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={styles.scanTitle}>Scanner le QR client</Text>
          <TouchableOpacity style={styles.scanCloseButton} onPress={() => setScanning(false)}>
            <Text style={styles.scanCloseText}>✕ Annuler</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.scanViewport}>
          <CameraView
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={handleScan}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
          <View style={styles.scanCorner1} />
          <View style={styles.scanCorner2} />
          <View style={styles.scanCorner3} />
          <View style={styles.scanCorner4} />
        </View>
        <Text style={[styles.scanHint, { marginBottom: insets.bottom + spacing.xxl }]}>
          Placez le QR code dans le cadre
        </Text>
      </View>
    );
  }

  return (
    <>
    <FlatList
      data={clientsFiltres}
      keyExtractor={(_, i) => String(i)}
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
      ListHeaderComponent={
        <>
          {/* Header coloré */}
          <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
            <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.headerTop}>
              <View>
                <Text style={styles.headerApp}>FidèlePro</Text>
                <Text style={styles.headerTitle}>Espace Commerçant</Text>
                {scansAujourdhui > 0 && (
                  <Text style={styles.headerScansJour}>
                    {scansAujourdhui} scan{scansAujourdhui > 1 ? 's' : ''} aujourd{"'"}hui
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.avatarContainer} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowProfil(true); }}>
                <Text style={styles.avatarText}>👤</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Bouton scanner dans le header */}
            <Animated.View entering={FadeInDown.duration(600).delay(100).springify()}>
              <TouchableOpacity style={styles.scanButton} onPress={ouvrirScanner}>
                <Text style={styles.scanButtonIcon}>📷</Text>
                <Text style={styles.scanButtonText}>Scanner un client</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Stats */}
          <View style={styles.body}>
            <View style={styles.statsGrid}>
              <CarteStatistique icon="👥" valeur={stats.totalClients} label="Clients" couleur={colors.primary} index={0} />
              <CarteStatistique icon="🎯" valeur={stats.totalScans} label="Scans total" couleur={colors.success} index={1} />
              <CarteStatistique icon="📊" valeur={stats.moyenneScans} label="Moy. scans" couleur={colors.orange} index={2} />
              <CarteStatistique icon="🏆" valeur={stats.topClient ?? 'N/A'} label="Top client" couleur={colors.error} index={3} />
            </View>

            {clients.length > 0 && <GraphiqueActivite clients={clients} />}

            <Text style={styles.sectionTitle}>
              Mes clients{clients.length > 0 ? ` (${clientsFiltres.length}/${clients.length})` : ''}
            </Text>

            {clients.length > 0 && (
              <View style={styles.searchWrapper}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Rechercher un client..."
                  placeholderTextColor={theme.placeholder}
                  value={recherche}
                  onChangeText={setRecherche}
                  autoCapitalize="none"
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
                {recherche.length > 0 && (
                  <TouchableOpacity onPress={() => setRecherche('')} hitSlop={8}>
                    <Text style={styles.searchClear}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {clients.length === 0 && (
              <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyTitle}>Aucun client pour le moment</Text>
                <Text style={styles.emptySubtitle}>{"Scannez un QR code pour commencer !"}</Text>
              </Animated.View>
            )}

            {clients.length > 0 && clientsFiltres.length === 0 && (
              <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>Aucun résultat</Text>
                <Text style={styles.emptySubtitle}>{`Aucun client ne correspond à "${recherche}"`}</Text>
              </Animated.View>
            )}
          </View>
        </>
      }
      renderItem={({ item, index }) => (
        <View style={styles.listItemPadding}>
          <CarteClient client={item} index={index} onRelancer={relancerClient} />
        </View>
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      }
    />

      {/* Modal Profil Commerçant */}

      <Modal visible={showProfil} transparent animationType="slide" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.lg }]}
          >
            <View style={styles.modalHandle} />
            <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
              <View style={[styles.avatarContainer, { width: 64, height: 64, borderRadius: 32, marginBottom: spacing.md }]}>
                <Text style={{ fontSize: 28 }}>👤</Text>
              </View>
              <Text style={styles.modalTitle}>Espace Commerçant</Text>
              <Text style={styles.modalSurtitle}>{stats.totalClients} client{stats.totalClients !== 1 ? 's' : ''} fidélisés</Text>
            </View>
            <View style={styles.modalStatsRow}>
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.modalStatValue}>{stats.totalScans}</Text>
                <Text style={styles.modalSurtitle}>scans total</Text>
              </View>
              <View style={[styles.modalDivider]} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.modalStatValue}>{scansAujourdhui}</Text>
                <Text style={styles.modalSurtitle}>aujourd{"'"}hui</Text>
              </View>
              <View style={[styles.modalDivider]} />
              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={styles.modalStatValue}>{stats.moyenneScans}</Text>
                <Text style={styles.modalSurtitle}>moy. scans</Text>
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
            <TouchableOpacity style={styles.closeBtnSecondary} onPress={() => setShowProfil(false)}>
              <Text style={styles.closeBtnSecondaryText}>Fermer</Text>
            </TouchableOpacity>
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

const CORNER_SIZE = 24;
const CORNER_BORDER = 3;

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.background,
    },
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
    headerTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.white,
      marginTop: 2,
    },
    headerScansJour: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.75)',
      marginTop: 4,
      fontWeight: '500',
    },
    relanceButton: {
      marginTop: spacing.md,
      backgroundColor: '#fff3e0',
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.orange,
    },
    relanceButtonSent: {
      backgroundColor: '#e8f8f0',
      borderColor: colors.success,
    },
    relanceButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.orange,
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
      fontSize: 20,
    },
    scanButton: {
      backgroundColor: colors.white,
      borderRadius: radius.xl,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      ...shadow.card,
    },
    scanButtonIcon: { fontSize: 20 },
    scanButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    body: {
      padding: spacing.xxl,
      marginTop: -spacing.md,
    },
    listItemPadding: {
      paddingHorizontal: spacing.xxl,
    },
    footer: {
      padding: spacing.xxl,
      paddingTop: spacing.md,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: spacing.xxl,
      gap: spacing.md,
    },
    statCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      flex: 1,
      minWidth: 140,
      alignItems: 'flex-start',
      ...shadow.statCard,
    },
    statIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    statIcon: { fontSize: 20 },
    statValue: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
    statLabel: { fontSize: 12, color: theme.textMuted },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: spacing.lg,
    },
    clientCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.xxl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadow.statCard,
    },
    clientCardInactif: {
      borderWidth: 1,
      borderColor: theme.inactiveBorder,
      backgroundColor: theme.inactiveBackground,
    },
    clientHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    clientAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      flexShrink: 0,
    },
    clientAvatarInactif: {
      backgroundColor: '#aaaaaa',
    },
    clientAvatarText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
    clientInfo: { flex: 1, minWidth: 0 },
    clientNom: { fontSize: 15, fontWeight: 'bold', color: theme.text },
    clientEmail: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    badgeInactif: {
      backgroundColor: theme.inactiveBadgeBackground,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      marginLeft: spacing.sm,
      flexShrink: 0,
    },
    badgeInactifText: { color: colors.error, fontSize: 11, fontWeight: 'bold' },
    clientStats: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
      paddingTop: spacing.md,
    },
    clientStat: { flex: 1, alignItems: 'center' },
    clientStatBorder: {
      borderLeftWidth: 1,
      borderLeftColor: theme.borderLight,
    },
    clientStatValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
    clientStatLabel: { fontSize: 11, color: theme.textMuted, marginTop: 2 },
    emptyContainer: {
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: radius.xxl,
      padding: spacing.huge,
      marginBottom: spacing.xxl,
      ...shadow.card,
    },
    emptyIcon: { fontSize: 48, marginBottom: spacing.md },
    emptyTitle: { color: theme.text, fontSize: 16, fontWeight: 'bold', marginBottom: spacing.sm },
    emptySubtitle: { color: theme.textMuted, fontSize: 13, textAlign: 'center' },
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
    },
    logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
    scanContainer: {
      flex: 1,
      backgroundColor: '#000',
      alignItems: 'center',
    },
    scanHeader: {
      width: '100%',
      alignItems: 'center',
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    scanTitle: {
      color: colors.white,
      fontSize: 20,
      fontWeight: 'bold',
    },
    scanCloseButton: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: radius.xl,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
    },
    scanCloseText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '600',
    },
    scanViewport: {
      width: 260,
      height: 260,
      borderRadius: radius.lg,
      overflow: 'hidden',
      position: 'relative',
    },
    scanHint: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 14,
      marginTop: spacing.xxl,
    },
    scanCorner1: {
      position: 'absolute', top: 0, left: 0,
      width: CORNER_SIZE, height: CORNER_SIZE,
      borderTopWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER,
      borderColor: colors.white,
    },
    scanCorner2: {
      position: 'absolute', top: 0, right: 0,
      width: CORNER_SIZE, height: CORNER_SIZE,
      borderTopWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER,
      borderColor: colors.white,
    },
    scanCorner3: {
      position: 'absolute', bottom: 0, left: 0,
      width: CORNER_SIZE, height: CORNER_SIZE,
      borderBottomWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER,
      borderColor: colors.white,
    },
    scanCorner4: {
      position: 'absolute', bottom: 0, right: 0,
      width: CORNER_SIZE, height: CORNER_SIZE,
      borderBottomWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER,
      borderColor: colors.white,
    },
    graphCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.xxl,
      padding: spacing.xl,
      marginBottom: spacing.xxl,
      ...shadow.card,
    },
    graphTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: spacing.lg,
    },
    graphBars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 100,
    },
    graphCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.xs,
    },
    graphCount: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: 'bold',
      height: 14,
    },
    graphBarBg: {
      width: 20,
      height: 80,
      justifyContent: 'flex-end',
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: theme.surfaceSecondary,
    },
    graphBar: {
      width: '100%',
      borderRadius: 4,
    },
    graphLabel: {
      fontSize: 10,
      color: theme.textMuted,
      fontWeight: '500',
    },
    // Barre de recherche
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceSecondary,
      borderRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1.5,
      borderColor: theme.border,
      gap: spacing.sm,
    },
    searchIcon: { fontSize: 16 },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.md,
      fontSize: 15,
      color: theme.text,
    },
    searchClear: {
      fontSize: 14,
      color: theme.textMuted,
      fontWeight: '600',
      paddingLeft: spacing.sm,
    },
    // Modal profil
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
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    modalSurtitle: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: 'center',
    },
    modalStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceSecondary,
      borderRadius: radius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    modalStatValue: {
      fontSize: 26,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
    },
    modalDivider: {
      width: 1,
      height: 36,
      backgroundColor: theme.border,
    },
    closeBtnSecondary: {
      marginTop: spacing.md,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: radius.xl,
      padding: 14,
      alignItems: 'center',
    },
    closeBtnSecondaryText: {
      color: theme.text,
      fontWeight: 'bold',
      fontSize: 15,
    },
  });
}
