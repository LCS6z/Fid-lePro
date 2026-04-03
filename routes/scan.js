const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verifierToken, verifierRole } = require('../middleware/auth')

const prisma = new PrismaClient()

// POST /api/scan — le commerçant scanne le QR code d'un client
router.post('/', verifierToken, verifierRole('commercant'), async (req, res) => {
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