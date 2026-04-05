import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth';
import { clientAPI, Progression } from '../../services/api';
import { Colors } from '../../constants/colors';

export default function ProfilScreen() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState({ cartes: 0, tampons: 0, cashback: 0 });

  useEffect(() => {
    clientAPI.getProgression().then((data: Progression[]) => {
      const totalTampons = data.reduce((acc, p) => acc + p.tamponsActuels, 0);
      setStats({ cartes: data.length, tampons: totalTampons, cashback: 0 });
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (!user) return null;

  const initial = user.nom?.charAt(0).toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[Colors.primaryDark, Colors.primary]}
          style={styles.header}
        >
          <Animated.View entering={FadeIn.duration(500)} style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            </View>
            <Text style={styles.name}>{user.nom}</Text>
            <Text style={styles.email}>{user.email}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatItem value={stats.cartes} label="Cartes" />
              <View style={styles.statDivider} />
              <StatItem value={stats.tampons} label="Tampons" />
              <View style={styles.statDivider} />
              <StatItem value={stats.cashback} label="Cashback" />
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Infos */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.card}>
            <Text style={styles.cardTitle}>Mes informations</Text>
            <InfoRow
              icon="person-outline"
              label="Nom complet"
              value={user.nom}
            />
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={user.email}
            />
            {user.telephone && (
              <InfoRow
                icon="phone-portrait-outline"
                label="Téléphone"
                value={user.telephone}
              />
            )}
          </Animated.View>

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.card}>
            <Text style={styles.cardTitle}>Mon compte</Text>

            <MenuItem
              icon="qr-code-outline"
              label="Mon QR Code"
              onPress={() => router.push('/(tabs)/qrcode')}
              color={Colors.primary}
            />
            <MenuItem
              icon="card-outline"
              label="Mes cartes de fidélité"
              onPress={() => router.push('/(tabs)')}
              color={Colors.primary}
            />
            <MenuItem
              icon="star-outline"
              label="Laisser un avis"
              onPress={() => router.push('/(tabs)/avis')}
              color={Colors.accent}
            />
          </Animated.View>

          {/* Déconnexion */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.85}
            >
              <Ionicons name="log-out-outline" size={20} color={Colors.error} />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.version}>FidèlePro v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    marginBottom: 14,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 14,
    alignSelf: 'stretch',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    padding: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
});
