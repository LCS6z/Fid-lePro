import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { colors, spacing } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

export default function CGV() {
  const { theme } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: theme.background },
    header: { backgroundColor: colors.primary, padding: spacing.xxl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    headerContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    headerIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    headerIconText: { fontSize: 26 },
    backButton: { marginBottom: spacing.md },
    backText: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
    title: { color: colors.white, fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
    subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
    content: { padding: spacing.xxl, paddingBottom: 48 },
    section: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginTop: spacing.xxl, marginBottom: spacing.sm },
    text: { fontSize: 14, color: theme.text, lineHeight: 22 },
    dateUpdate: { marginTop: spacing.huge, fontSize: 12, color: theme.textMuted, textAlign: 'center', fontStyle: 'italic' },
  }), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <Animated.View
        entering={FadeInUp.duration(600).springify()}
        style={[styles.header, { paddingTop: insets.top + spacing.lg }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'← Retour'}</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>📄</Text>
          </View>
          <View>
            <Text style={styles.title}>Conditions Générales</Text>
            <Text style={styles.title}>de Vente</Text>
            <Text style={styles.subtitle}>{'FidèlePro — Avril 2026'}</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()}>

          <Text style={styles.section}>1. Objet</Text>
          <Text style={styles.text}>
            {'Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre FidèlePro et tout commerçant souhaitant souscrire à ses services de fidélisation client.'}
          </Text>

          <Text style={styles.section}>2. Services proposés</Text>
          <Text style={styles.text}>
            {'FidèlePro met à disposition des commerçants une plateforme de fidélisation client comprenant : un tableau de bord de gestion, un système de tampons numériques via QR code, des statistiques clients, et un accès à une application mobile pour leurs clients.'}
          </Text>

          <Text style={styles.section}>3. Tarification</Text>
          <Text style={styles.text}>
            {"L'accès à la plateforme est soumis au paiement de :\n\n• Frais de mise en service : 150 € TTC (paiement unique à l'inscription)\n• Abonnement mensuel : 49 € TTC / mois\n\nLes prix sont indiqués en euros toutes taxes comprises."}
          </Text>

          <Text style={styles.section}>4. Durée et résiliation</Text>
          <Text style={styles.text}>
            {"L'abonnement est sans engagement de durée minimale. Le commerçant peut résilier à tout moment avec un préavis d'un (1) mois. L'accès à la plateforme est maintenu jusqu'à la fin de la période en cours après réception du préavis."}
          </Text>

          <Text style={styles.section}>5. Paiement</Text>
          <Text style={styles.text}>
            {"Les paiements sont effectués de manière sécurisée via Stripe. Les frais de mise en service sont prélevés une seule fois lors de l'inscription. L'abonnement mensuel est prélevé automatiquement chaque mois à date anniversaire."}
          </Text>

          <Text style={styles.section}>6. Obligations du commerçant</Text>
          <Text style={styles.text}>
            {"Le commerçant s'engage à :\n• Fournir des informations exactes lors de son inscription\n• Utiliser la plateforme conformément à son objet\n• Ne pas détourner les données clients à des fins commerciales non consenties\n• Respecter la réglementation en vigueur (RGPD, etc.)"}
          </Text>

          <Text style={styles.section}>7. Protection des données</Text>
          <Text style={styles.text}>
            {'FidèlePro collecte et traite les données personnelles conformément au Règlement Général sur la Protection des Données (RGPD). Les données sont hébergées en Europe et ne sont jamais revendues à des tiers.'}
          </Text>

          <Text style={styles.section}>8. Responsabilité</Text>
          <Text style={styles.text}>
            {"FidèlePro s'engage à assurer la disponibilité de la plateforme dans la mesure du possible. FidèlePro ne saurait être tenu responsable des interruptions de service liées à des causes extérieures (hébergeur, réseau, etc.)."}
          </Text>

          <Text style={styles.section}>9. Droit applicable</Text>
          <Text style={styles.text}>
            {"Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire."}
          </Text>

          <Text style={styles.section}>10. Contact</Text>
          <Text style={styles.text}>
            {'Pour toute question relative aux présentes CGV :\nEmail : contact@fidelepro.fr\nFidèlePro — France'}
          </Text>

          <Text style={styles.dateUpdate}>Dernière mise à jour : avril 2026</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

