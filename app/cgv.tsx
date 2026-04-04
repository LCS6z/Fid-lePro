import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const VIOLET = '#6637ee';
const BLANC = '#ffffff';
const GRIS = '#f5f5f5';
const GRIS_TEXTE = '#333333';
const GRIS_CLAIR = '#888888';

export default function CGV() {
  return (
    <View style={styles.wrapper}>
      <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.retour}>
          <Text style={styles.retourTexte}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.titre}>Conditions Générales de Vente</Text>
        <Text style={styles.sousTitre}>FidèlePro — Version en vigueur</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.contenu} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600).delay(200).springify()}>

          <Text style={styles.section}>1. Objet</Text>
          <Text style={styles.texte}>
            Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre FidèlePro et tout commerçant souhaitant souscrire à ses services de fidélisation client.
          </Text>

          <Text style={styles.section}>2. Services proposés</Text>
          <Text style={styles.texte}>
            FidèlePro met à disposition des commerçants une plateforme de fidélisation client comprenant : un tableau de bord de gestion, un système de tampons numériques via QR code, des statistiques clients, et un accès à une application mobile pour leurs clients.
          </Text>

          <Text style={styles.section}>3. Tarification</Text>
          <Text style={styles.texte}>
            L'accès à la plateforme est soumis au paiement de :{'\n\n'}
            • Frais de mise en service : 150 € TTC (paiement unique à l'inscription){'\n'}
            • Abonnement mensuel : 49 € TTC / mois{'\n\n'}
            Les prix sont indiqués en euros toutes taxes comprises.
          </Text>

          <Text style={styles.section}>4. Durée et résiliation</Text>
          <Text style={styles.texte}>
            L'abonnement est sans engagement de durée minimale. Le commerçant peut résilier à tout moment avec un préavis d'un (1) mois. L'accès à la plateforme est maintenu jusqu'à la fin de la période en cours après réception du préavis.
          </Text>

          <Text style={styles.section}>5. Paiement</Text>
          <Text style={styles.texte}>
            Les paiements sont effectués de manière sécurisée via Stripe. Les frais de mise en service sont prélevés une seule fois lors de l'inscription. L'abonnement mensuel est prélevé automatiquement chaque mois à date anniversaire.
          </Text>

          <Text style={styles.section}>6. Obligations du commerçant</Text>
          <Text style={styles.texte}>
            Le commerçant s'engage à :{'\n'}
            • Fournir des informations exactes lors de son inscription{'\n'}
            • Utiliser la plateforme conformément à son objet{'\n'}
            • Ne pas détourner les données clients à des fins commerciales non consenties{'\n'}
            • Respecter la réglementation en vigueur (RGPD, etc.)
          </Text>

          <Text style={styles.section}>7. Protection des données</Text>
          <Text style={styles.texte}>
            FidèlePro collecte et traite les données personnelles conformément au Règlement Général sur la Protection des Données (RGPD). Les données sont hébergées en Europe et ne sont jamais revendues à des tiers.
          </Text>

          <Text style={styles.section}>8. Responsabilité</Text>
          <Text style={styles.texte}>
            FidèlePro s'engage à assurer la disponibilité de la plateforme dans la mesure du possible. FidèlePro ne saurait être tenu responsable des interruptions de service liées à des causes extérieures (hébergeur, réseau, etc.).
          </Text>

          <Text style={styles.section}>9. Droit applicable</Text>
          <Text style={styles.texte}>
            Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire.
          </Text>

          <Text style={styles.section}>10. Contact</Text>
          <Text style={styles.texte}>
            Pour toute question relative aux présentes CGV :{'\n'}
            Email : contact@fidelepro.fr{'\n'}
            FidèlePro — France
          </Text>

          <Text style={styles.dateMAJ}>Dernière mise à jour : avril 2026</Text>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: GRIS,
  },
  header: {
    backgroundColor: VIOLET,
    padding: 24,
    paddingTop: 60,
  },
  retour: {
    marginBottom: 12,
  },
  retourTexte: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
  },
  titre: {
    color: BLANC,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sousTitre: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  contenu: {
    padding: 24,
    paddingBottom: 48,
  },
  section: {
    fontSize: 16,
    fontWeight: 'bold',
    color: VIOLET,
    marginTop: 24,
    marginBottom: 8,
  },
  texte: {
    fontSize: 14,
    color: GRIS_TEXTE,
    lineHeight: 22,
  },
  dateMAJ: {
    marginTop: 32,
    fontSize: 12,
    color: GRIS_CLAIR,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});