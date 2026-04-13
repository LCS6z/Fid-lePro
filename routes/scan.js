const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const { PrismaClient } = require('@prisma/client')
const { verifierToken, verifierRole } = require('../middleware/auth')
const { envoyerNotification } = require('../services/notification')

const prisma = new PrismaClient()

const limiterScan = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: 'Trop de scans. Attendez une minute.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /api/scan — le commerçant scanne le QR code d'un client
router.post('/', limiterScan, verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const { qrCode } = req.body
    const commercantId = req.user.id

    // Trouver le client via son QR code
    const client = await prisma.client.findUnique({ where: { qrCode } })
    if (!client) return res.status(404).json({ message: 'Client introuvable' })

    // Trouver la première carte active du commerçant
    const carte = await prisma.carte.findFirst({
      where: { commercantId }
    })
    if (!carte) return res.status(404).json({ message: 'Aucune carte fidélité configurée' })

    // Ajouter un tampon
    await prisma.tampon.create({
      data: { clientId: client.id, carteId: carte.id }
    })

    // Compter les tampons du client sur cette carte
    const totalTampons = await prisma.tampon.count({
      where: { clientId: client.id, carteId: carte.id }
    })

    // Vérifier si récompense débloquée
    let recompense = null
    if (carte.maxTampons && totalTampons >= carte.maxTampons) {
      recompense = `Récompense débloquée : ${carte.recompense}€ !`
    }

    // Notif push au client (fire-and-forget)
    if (client.fcmToken) {
      const commercant = await prisma.commercant.findUnique({
        where: { id: commercantId },
        select: { nom: true }
      })
      if (recompense) {
        envoyerNotification(
          client.fcmToken,
          '🎁 Récompense disponible !',
          `Carte complète chez ${commercant.nom} — votre récompense de ${carte.recompense}€ vous attend !`,
          { screen: 'dashboard-client', type: 'recompense_dispo' }
        ).catch(() => {})
      } else {
        envoyerNotification(
          client.fcmToken,
          '✅ Tampon ajouté !',
          `${commercant.nom} vous a ajouté un tampon (${totalTampons}/${carte.maxTampons ?? '?'}).`,
          { screen: 'dashboard-client', type: 'tampon_ajoute' }
        ).catch(() => {})
      }
    }

    res.json({
      message: 'Tampon ajouté avec succès !',
      client: { nom: client.nom },
      totalTampons,
      recompense
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

module.exports = router