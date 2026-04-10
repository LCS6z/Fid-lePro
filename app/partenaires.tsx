import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, radius, shadow, spacing } from '@/constants/colors';
import type { Theme } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { apiClient } from '@/lib/api';
import type { CategoriePartenaires, Partenaire } from '@/lib/types';

const EMOJIS_CATEGORIE: Record<string, string> = {
  Restauration: '🍽️',
  Beauté: '💅',
  Sport: '🏋️',
  Bien_être: '🧘',
  Shopping: '🛍️',
  Santé: '🏥',
  Loisirs: '🎉',
  Services: '🔧',
  Autres: '🏪',
};

function emojiCategorie(cat: string): string {
  return EMOJIS_CATEGORIE[cat] ?? '🏪';
}

function CartePartenaire({ partenaire, index }: { partenaire: Partenaire; index: number }) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const ouvrirTel = () => {
    if (!partenaire.telephone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${partenaire.telephone}`);
  };

  const ouvrirMaps = () => {
    if (!partenaire.adresse) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(partenaire.adresse)}`);
  };

  const ouvrirAvis = () => {
    if (!partenaire.lienGoogle) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(partenaire.lienGoogle);
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 60).springify()}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{partenaire.nom.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNom} numberOfLines={1}>{partenaire.nom}</Text>
          {partenaire.adresse ? (
            <Text style={styles.cardAdresse} numberOfLines={1}>📍 {partenaire.adresse}</Text>
          ) : null}
        </View>
        <View style={styles.badgePartenaire}>
          <Text style={styles.badgePartenaireText}>Partenaire</Text>
        </View>
      </View>

      {partenaire.description ? (
        <Text style={styles.cardDescription}>{partenaire.description}</Text>
      ) : null}

      {partenaire.horaires ? (
        <View style={styles.horairesRow}>
          <Text style={styles.horairesIcon}>🕐</Text>
          <Text style={styles.horairesText}>{partenaire.horaires}</Text>
        </View>
      ) : null}

      {(partenaire.telephone || partenaire.adresse || partenaire.lienGoogle) ? (
        <View style={styles.actions}>
          {partenaire.telephone ? (
            <TouchableOpacity style={styles.actionBtn} onPress={ouvrirTel}>
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionText}>Appeler</Text>
            </TouchableOpacity>
          ) : null}
          {partenaire.adresse ? (
            <TouchableOpacity style={styles.actionBtn} onPress={ouvrirMaps}>
              <Text style={styles.actionIcon}>🗺️</Text>
              <Text style={styles.actionText}>Itinéraire</Text>
            </TouchableOpacity>
          ) : null}
          {partenaire.lienGoogle ? (
            <TouchableOpacity style={styles.actionBtn} onPress={ouvrirAvis}>
              <Text style={styles.actionIcon}>⭐</Text>
              <Text style={styles.actionText}>Avis</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function Partenaires() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<CategoriePartenaires[]>([]);
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [categorieActive, setCategorieActive] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<{ categories: CategoriePartenaires[]; total: number }>('/api/client/partenaires')
      .then(res => setCategories(res.data.categories))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const categoriesFiltrees = useMemo(() => {
    const q = recherche.toLowerCase().trim();
    return categories
      .filter(c => !categorieActive || c.nom === categorieActive)
      .map(c => ({
        ...c,
        commerces: q
          ? c.commerces.filter(p =>
              p.nom.toLowerCase().includes(q) ||
              p.description?.toLowerCase().includes(q) ||
              p.adresse?.toLowerCase().includes(q)
            )
          : c.commerces,
      }))
      .filter(c => c.commerces.length > 0);
  }, [categories, recherche, categorieActive]);

  const nomsCategories = useMemo(() => categories.map(c => c.nom), [categories]);

  let itemIndex = 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerApp}>FidèlePro</Text>
          <Text style={styles.headerTitle}>Commerces partenaires</Text>
        </View>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un commerce..."
          placeholderTextColor={theme.placeholder}
          value={recherche}
          onChangeText={setRecherche}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {recherche.length > 0 && (
          <TouchableOpacity onPress={() => setRecherche('')} hitSlop={8}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres catégories */}
      {nomsCategories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtresRow}
        >
          <TouchableOpacity
            style={[styles.filtrePill, !categorieActive && styles.filtrePillActif]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategorieActive(null); }}
          >
            <Text style={[styles.filtrePillText, !categorieActive && styles.filtrePillTextActif]}>
              Tous
            </Text>
          </TouchableOpacity>
          {nomsCategories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filtrePill, categorieActive === cat && styles.filtrePillActif]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategorieActive(cat === categorieActive ? null : cat); }}
            >
              <Text style={[styles.filtrePillText, categorieActive === cat && styles.filtrePillTextActif]}>
                {emojiCategorie(cat)} {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Liste */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.xxl, paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyTitle}>Chargement...</Text>
          </Animated.View>
        ) : categoriesFiltrees.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏪</Text>
            <Text style={styles.emptyTitle}>Aucun commerce trouvé</Text>
            <Text style={styles.emptySubtitle}>De nouveaux partenaires arrivent bientôt !</Text>
          </Animated.View>
        ) : (
          categoriesFiltrees.map(cat => (
            <View key={cat.nom} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEmoji}>{emojiCategorie(cat.nom)}</Text>
                <Text style={styles.sectionTitle}>{cat.nom}</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{cat.commerces.length}</Text>
                </View>
              </View>
              {cat.commerces.map(p => (
                <CartePartenaire key={p.id} partenaire={p} index={itemIndex++} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xxl,
      paddingBottom: spacing.xl,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
    headerApp: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceSecondary,
      borderRadius: radius.xl,
      marginHorizontal: spacing.xxl,
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
      borderWidth: 1.5,
      borderColor: theme.border,
      gap: spacing.sm,
    },
    searchIcon: { fontSize: 15 },
    searchInput: { flex: 1, paddingVertical: spacing.md, fontSize: 15, color: theme.text },
    searchClear: { fontSize: 13, color: theme.textMuted, fontWeight: '600' },
    filtresRow: {
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    filtrePill: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 6,
      borderRadius: radius.circle,
      backgroundColor: theme.surfaceSecondary,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    filtrePillActif: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filtrePillText: { fontSize: 13, fontWeight: '600', color: theme.textMuted },
    filtrePillTextActif: { color: colors.white },
    scroll: { flex: 1 },
    section: { marginBottom: spacing.xxl },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionEmoji: { fontSize: 20 },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: theme.text, flex: 1 },
    sectionBadge: {
      backgroundColor: colors.primary + '20',
      borderRadius: radius.circle,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    sectionBadgeText: { color: colors.primary, fontSize: 12, fontWeight: 'bold' },
    card: {
      backgroundColor: theme.surface,
      borderRadius: radius.card,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...shadow.card,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      flexShrink: 0,
    },
    avatarText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
    cardInfo: { flex: 1, minWidth: 0 },
    cardNom: { fontSize: 15, fontWeight: 'bold', color: theme.text },
    cardAdresse: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
    badgePartenaire: {
      backgroundColor: colors.success + '20',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      flexShrink: 0,
    },
    badgePartenaireText: { color: colors.success, fontSize: 10, fontWeight: 'bold' },
    horairesRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    horairesIcon: { fontSize: 13 },
    horairesText: { fontSize: 12, color: theme.textMuted, flex: 1 },
    cardDescription: {
      fontSize: 13,
      color: theme.textMuted,
      lineHeight: 19,
      marginBottom: spacing.md,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
      paddingTop: spacing.md,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: theme.surfaceSecondary,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
    },
    actionIcon: { fontSize: 14 },
    actionText: { fontSize: 12, fontWeight: '600', color: theme.text },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: spacing.huge * 2,
    },
    emptyIcon: { fontSize: 48, marginBottom: spacing.md },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: spacing.sm },
    emptySubtitle: { fontSize: 13, color: theme.textMuted, textAlign: 'center' },
  });
}
