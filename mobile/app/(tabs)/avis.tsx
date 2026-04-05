import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clientAPI, Progression } from '../../services/api';
import { Colors } from '../../constants/colors';

export default function AvisScreen() {
  const [progressions, setProgressions] = useState<Progression[]>([]);
  const [selectedCommercant, setSelectedCommercant] = useState<Progression | null>(null);
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    clientAPI.getProgression().then((data) => {
      const uniques = Array.from(
        new Map(data.map((p) => [p.commercantId, p])).values()
      );
      setProgressions(uniques);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!selectedCommercant) {
      Alert.alert('Sélectionnez un commerçant', 'Choisissez d\'abord un commerçant.');
      return;
    }
    if (note === 0) {
      Alert.alert('Note requise', 'Donnez une note de 1 à 5 étoiles.');
      return;
    }
    setSubmitting(true);
    try {
      await clientAPI.submitAvis(selectedCommercant.commercantId, note, commentaire);
      setSuccess(true);
      setNote(0);
      setCommentaire('');
      setSelectedCommercant(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible d\'envoyer l\'avis.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.header}
      >
        <Animated.View entering={FadeIn.duration(500)}>
          <Text style={styles.headerTitle}>Laisser un avis</Text>
          <Text style={styles.headerSubtitle}>Partagez votre expérience</Text>
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {success && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <Text style={styles.successText}>Avis envoyé avec succès !</Text>
            </Animated.View>
          )}

          {/* Choix commerçant */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Commerçant</Text>
            {loading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : progressions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Scannez d'abord des tampons chez un commerçant.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.commercantScroll}>
                {progressions.map((p) => (
                  <TouchableOpacity
                    key={p.commercantId}
                    style={[
                      styles.commercantChip,
                      selectedCommercant?.commercantId === p.commercantId && styles.commercantChipSelected,
                    ]}
                    onPress={() => setSelectedCommercant(p)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.commercantChipText,
                        selectedCommercant?.commercantId === p.commercantId && styles.commercantChipTextSelected,
                      ]}
                    >
                      {p.commercant}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Animated.View>

          {/* Étoiles */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Note</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <StarButton
                  key={star}
                  star={star}
                  active={star <= note}
                  onPress={() => setNote(star)}
                />
              ))}
            </View>
            {note > 0 && (
              <Text style={styles.noteLabel}>
                {['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent !'][note]}
              </Text>
            )}
          </Animated.View>

          {/* Commentaire */}
          <Animated.View entering={FadeInDown.delay(300).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>Commentaire (optionnel)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Partagez votre expérience..."
              placeholderTextColor={Colors.textMuted}
              value={commentaire}
              onChangeText={setCommentaire}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{commentaire.length}/500</Text>
          </Animated.View>

          {/* Bouton */}
          <Animated.View entering={FadeInDown.delay(400).duration(500)}>
            <TouchableOpacity
              style={[styles.submitButton, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={18} color="#fff" />
                    <Text style={styles.submitText}>Envoyer mon avis</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StarButton({
  star,
  active,
  onPress,
}: {
  star: number;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.3, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Ionicons
          name={active ? 'star' : 'star-outline'}
          size={38}
          color={active ? Colors.accent : Colors.border}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  section: {
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  commercantScroll: {
    marginHorizontal: -4,
  },
  commercantChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: Colors.surfaceSecondary,
  },
  commercantChipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  commercantChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  commercantChipTextSelected: {
    color: '#fff',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  textArea: {
    minHeight: 100,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: 6,
  },
  emptyState: {
    padding: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitGradient: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
