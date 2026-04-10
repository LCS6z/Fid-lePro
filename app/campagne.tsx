import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
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
import { getApiMessage } from '@/lib/api-error';

const SUGGESTIONS = [
  { titre: '🎉 Offre spéciale', message: 'Profitez de -10% ce weekend sur présentation de votre carte fidélité !' },
  { titre: '🎁 Double tampons', message: 'Cette semaine seulement : chaque visite compte double !' },
  { titre: '📢 Nouveauté', message: 'Découvrez notre nouveau menu/collection — venez nous rendre visite !' },
];

export default function Campagne() {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async () => {
    if (!titre.trim() || !message.trim()) {
      Alert.alert('Champs manquants', 'Remplissez le titre et le message.');
      return;
    }
    Alert.alert(
      'Confirmer l\'envoi',
      `Envoyer "${titre}" à tous vos clients avec notifications actives ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer', style: 'default', onPress: async () => {
            setEnvoi(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              const res = await apiClient.post<{ nbEnvoyes: number }>('/api/commercant/campagne', { titre, message });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Campagne envoyée !', `${res.data.nbEnvoyes} client(s) notifié(s).`);
              setTitre(''); setMessage('');
            } catch (err) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Erreur', getApiMessage(err, 'Impossible d\'envoyer la campagne.'));
            }
            setEnvoi(false);
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerApp}>FidèlePro</Text>
          <Text style={styles.headerTitle}>Campagne notification</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: spacing.xxl, paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Suggestions */}
        <Animated.View entering={FadeInDown.duration(400).springify()}>
          <Text style={styles.sectionTitle}>Modèles rapides</Text>
          {SUGGESTIONS.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionCard}
              onPress={() => { Haptics.selectionAsync(); setTitre(s.titre); setMessage(s.message); }}
              activeOpacity={0.8}
            >
              <Text style={styles.suggestionTitre}>{s.titre}</Text>
              <Text style={styles.suggestionMsg} numberOfLines={2}>{s.message}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Formulaire */}
        <Animated.View entering={FadeInDown.duration(400).delay(150).springify()} style={styles.form}>
          <Text style={styles.sectionTitle}>Personnaliser</Text>

          <Text style={styles.label}>Titre</Text>
          <TextInput
            style={styles.input}
            value={titre}
            onChangeText={setTitre}
            placeholder="Ex : Offre spéciale weekend"
            placeholderTextColor={theme.placeholder}
            maxLength={50}
          />
          <Text style={styles.counter}>{titre.length}/50</Text>

          <Text style={[styles.label, { marginTop: spacing.md }]}>Message</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={message}
            onChangeText={setMessage}
            placeholder="Ex : Venez profiter de -10% ce weekend !"
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={4}
            maxLength={160}
          />
          <Text style={styles.counter}>{message.length}/160</Text>

          <TouchableOpacity
            style={[styles.sendBtn, envoi && styles.sendBtnDisabled]}
            onPress={envoyer}
            disabled={envoi}
            activeOpacity={0.85}
          >
            <Text style={styles.sendBtnText}>{envoi ? 'Envoi en cours...' : '📢 Envoyer à tous mes clients'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.xxl, paddingBottom: spacing.xl,
      borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
    headerApp: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.white },
    scroll: { flex: 1 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: spacing.md },
    suggestionCard: {
      backgroundColor: theme.surface, borderRadius: radius.xl,
      padding: spacing.lg, marginBottom: spacing.md, ...shadow.statCard,
      borderLeftWidth: 3, borderLeftColor: colors.primary,
    },
    suggestionTitre: { fontSize: 14, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
    suggestionMsg: { fontSize: 13, color: theme.textMuted },
    form: { marginTop: spacing.xl },
    label: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: spacing.sm },
    input: {
      backgroundColor: theme.surface, borderRadius: radius.lg,
      borderWidth: 1.5, borderColor: theme.border,
      padding: spacing.lg, fontSize: 15, color: theme.text,
    },
    inputMultiline: { height: 110, textAlignVertical: 'top' },
    counter: { fontSize: 11, color: theme.textMuted, textAlign: 'right', marginTop: 4 },
    sendBtn: {
      marginTop: spacing.xl, backgroundColor: colors.primary,
      borderRadius: radius.xl, padding: spacing.xl,
      alignItems: 'center', ...shadow.card,
    },
    sendBtnDisabled: { opacity: 0.6 },
    sendBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  });
}
