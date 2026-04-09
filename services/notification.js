const admin = require('firebase-admin')

if (!admin.apps.length && process.env.FIREBASE_KEY) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

/**
 * Détecte si le token est un Expo Push Token (dev avec Expo Go)
 * ou un token FCM natif (build standalone).
 */
const isExpoToken = (token) => token && token.startsWith('ExponentPushToken[')

/**
 * Envoie via l'API Expo Push (pour les tokens Expo Go)
 */
const envoyerViaExpo = async (tokens, titre, message, data = {}) => {
  const messages = (Array.isArray(tokens) ? tokens : [tokens]).map(token => ({
    to: token,
    title: titre,
    body: message,
    data,
    sound: 'default',
    badge: 1,
  }))

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(messages),
  })

  const result = await response.json()
  const tickets = Array.isArray(result.data) ? result.data : [result.data]
  return tickets.filter(t => t.status === 'ok').length
}

/**
 * Envoie via Firebase Admin SDK (pour les tokens FCM natifs — builds prod)
 */
const envoyerViaFirebase = async (tokens, titre, message, data = {}) => {
  if (!admin.apps.length) throw new Error('Firebase non initialisé (FIREBASE_KEY manquant)')
  const tokenList = Array.isArray(tokens) ? tokens : [tokens]

  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  )

  if (tokenList.length === 1) {
    await admin.messaging().send({
      token: tokenList[0],
      notification: { title: titre, body: message },
      data: stringData,
    })
    return 1
  }

  const response = await admin.messaging().sendEachForMulticast({
    tokens: tokenList,
    notification: { title: titre, body: message },
    data: stringData,
  })
  return response.successCount
}

/**
 * Envoie une notification à un token (Expo ou FCM natif).
 */
const envoyerNotification = async (token, titre, message, data = {}) => {
  if (isExpoToken(token)) {
    await envoyerViaExpo(token, titre, message, data)
  } else {
    await envoyerViaFirebase(token, titre, message, data)
  }
}

/**
 * Envoie une notification à plusieurs tokens (mixte Expo + FCM supporté).
 */
const envoyerNotificationMultiple = async (tokens, titre, message, data = {}) => {
  if (tokens.length === 0) return 0

  const expoTokens = tokens.filter(isExpoToken)
  const fcmTokens = tokens.filter(t => !isExpoToken(t))

  let count = 0
  if (expoTokens.length > 0) count += await envoyerViaExpo(expoTokens, titre, message, data)
  if (fcmTokens.length > 0) count += await envoyerViaFirebase(fcmTokens, titre, message, data)
  return count
}

module.exports = { envoyerNotification, envoyerNotificationMultiple }
