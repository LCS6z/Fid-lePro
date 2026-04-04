const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verifierToken, verifierRole } = require('../middleware/auth')
const { envoyerNotificationMultiple } = require('../services/notification')

const prisma = new PrismaClient()

router.post('/envoyer', verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const { titre, message } = req.body
    const commercantId = req.user.id

    if (!titre || !message) {
      return res.status(400).json({ message: 'Titre et message obligatoires' })
    }

    const cartes = await prisma.carte.findMany({
      where: { commercantId },
      include: {
        tampons: {
          include: {
            client: {
              select: { id: true, fcmToken: true }
            }
          }
        }
      }
    })

    const tokensMap = {}
    cartes.forEach(carte => {
      carte.tampons.forEach(tampon => {
        if (tampon.client.fcmToken) {
          tokensMap[tampon.client.id] = tampon.client.fcmToken
        }
      })
    })

    const tokens = Object.values(tokensMap)

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'Aucun client avec notifications activées' })
    }

    const nbEnvoyes = await envoyerNotificationMultiple(tokens, titre, message)

    res.json({
      message: `Notification envoyée à ${nbEnvoyes} client(s)`,
      nbEnvoyes
    })

  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

module.exports = router