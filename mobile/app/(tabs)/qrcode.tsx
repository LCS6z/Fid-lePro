import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Share } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { Colors } from '../../constants/colors';

export default function QRCodeScreen() {
  const { user } = useAuthStore();
  const scanBorder = useSharedValue(0);

  useEffect(() => {
    scanBorder.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanBorder.value * 180 }],
    opacity: 0.6 + scanBorder.value * 0.4,
  }));

  const handleShare = async () => {
    if (!user?.qrCode) return;
    await Share.share({
      message: `Mon code fidélité FidèlePro : ${user.qrCode}`,
    });
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.primary]}
        style={styles.header}
      >
        <Animated.View entering={FadeIn.duration(500)}>
          <Text style={styles.headerTitle}>Mon QR Code</Text>
          <Text style={styles.headerSubtitle}>
            Présentez ce code chez vos commerçants
          </Text>
        </Animated.View>
      </LinearGradient>

      <View style={styles.content}>
        {/* QR Card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600).springify()}
          style={styles.qrCard}
        >
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.nom?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.userName}>{user.nom}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>

          {/* QR code with scan line animation */}
          <View style={styles.qrWrapper}>
            <View style={styles.qrContainer}>
              <QRCode
                value={user.qrCode}
                size={180}
                color={Colors.text}
                backgroundColor="#fff"
              />
              {/* Scan line */}
              <Animated.View style={[styles.scanLine, scanLineStyle]} />
            </View>

            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>

          <Text style={styles.qrHint}>
            Le commerçant scanne ce QR code pour valider votre tampon
          </Text>

          {/* Code texte */}
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Code</Text>
            <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode="middle">
              {user.qrCode}
            </Text>
          </View>

          {/* Bouton partager */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.shareButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="share-outline" size={18} color="#fff" />
              <Text style={styles.shareButtonText}>Partager mon code</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Info */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.infoCard}
        >
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoText}>
            Ce QR code est unique et personnel. Ne le partagez qu'avec vos commerçants de confiance.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  qrCard: {
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  qrWrapper: {
    position: 'relative',
    padding: 12,
    marginBottom: 16,
  },
  qrContainer: {
    overflow: 'hidden',
    borderRadius: 8,
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
    top: 0,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: Colors.primary,
    borderWidth: 2.5,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  qrHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    alignSelf: 'stretch',
    gap: 10,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  codeValue: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  shareButton: {
    alignSelf: 'stretch',
    borderRadius: 14,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

// Fix: Platform import
import { Platform } from 'react-native';
