const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verifierToken, verifierRole } = require('../middleware/auth')
const { envoyerNotification } = require('../services/notification')

const prisma = new PrismaClient()

// Créer une carte de fidélité
router.post('/carte', verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const { nom, type, maxTampons, recompense } = req.body

    const carte = await prisma.carte.create({
      data: {
        nom,
        type,
        maxTampons: parseInt(maxTampons),
        recompense: parseFloat(recompense),
        commercantId: req.user.id
      }
    })

    res.json({ message: 'Carte créée avec succès !', carte })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})
// Le commerçant voit tous ses clients et leurs tampons
router.get('/clients', verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const commercantId = req.user.id

    // Récupérer toutes les cartes du commerçant
    const cartes = await prisma.carte.findMany({
      where: { commercantId },
      include: {
        tampons: {
          include: { client: true }
        }
      }
    })

    // Construire les stats par client
    const clientsMap = {}
    cartes.forEach(carte => {
      carte.tampons.forEach(tampon => {
        const clientId = tampon.clientId
        if (!clientsMap[clientId]) {
          clientsMap[clientId] = {
            nom: tampon.client.nom,
            email: tampon.client.email,
            totalTampons: 0,
            derniereScan: null
          }
        }
        clientsMap[clientId].totalTampons++
        if (!clientsMap[clientId].derniereScan || tampon.createdAt > clientsMap[clientId].derniereScan) {
          clientsMap[clientId].derniereScan = tampon.createdAt
        }
      })
    })

    // Trier par nombre de tampons
    const clients = Object.values(clientsMap).sort((a, b) => b.totalTampons - a.totalTampons)

    res.json({ clients })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// Sauvegarde le FCM token du commerçant (pour les notifs stats quotidiennes)
router.post('/fcm-token', verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const { fcmToken } = req.body
    if (!fcmToken) return res.status(400).json({ message: 'fcmToken requis' })

    await prisma.commercant.update({
      where: { id: req.user.id },
      data: { fcmToken }
    })

    res.json({ message: 'Token FCM enregistré' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// Envoie une notification push de relance à un client inactif
router.post('/relancer', verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email requis' })

    const commercantId = req.user.id

    // Vérifie que ce client a bien un tampon chez ce commerçant
    const tampon = await prisma.tampon.findFirst({
      where: {
        carte: { commercantId },
        client: { email }
      },
      include: {
        client: { select: { nom: true, fcmToken: true } }
      }
    })

    if (!tampon) {
      return res.status(404).json({ message: 'Client introuvable pour ce commerçant' })
    }

    if (!tampon.client.fcmToken) {
      return res.status(200).json({ message: 'Client sans notifications activées', sent: false })
    }

    const commercant = await prisma.commercant.findUnique({
      where: { id: commercantId },
      select: { nom: true }
    })

    await envoyerNotification(
      tampon.client.fcmToken,
      '📣 Votre commerçant vous manque !',
      `${commercant.nom} vous invite à revenir pour accumuler vos tampons.`,
      { screen: 'dashboard-client', type: 'relance' }
    )

    res.json({ message: 'Notification envoyée', sent: true })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

module.exports = router