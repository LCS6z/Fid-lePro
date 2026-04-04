const admin = require('firebase-admin')

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY)
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const envoyerNotification = async (fcmToken, titre, message) => {
  await admin.messaging().send({
    token: fcmToken,
    notification: { title: titre, body: message }
  })
}

const envoyerNotificationMultiple = async (tokens, titre, message) => {
  if (tokens.length === 0) return 0
  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title: titre, body: message }
  })
  return response.successCount
}

module.exports = { envoyerNotification, envoyerNotificationMultiple }