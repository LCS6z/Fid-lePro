const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verifierToken, verifierRole } = require('../middleware/auth')

const prisma = new PrismaClient()

// Le commerçant scanne le QR code d'un client
router.post('/scanner', verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const { qrCode, carteId } = req.body

    // Trouver le client via son QR code
    const client = await prisma.client.findUnique({ where: { qrCode } })
    if (!client) return res.status(404).json({ message: 'Client introuvable' })

    // Vérifier que la carte appartient bien au commerçant
    const carte = await prisma.carte.findFirst({
      where: { id: carteId, commercantId: req.user.id }
    })
    if (!carte) return res.status(404).json({ message: 'Carte introuvable' })

    // Ajouter un tampon
    const tampon = await prisma.tampon.create({
      data: { clientId: client.id, carteId: carte.id }
    })

    // Compter les tampons du client sur cette carte
    const totalTampons = await prisma.tampon.count({
      where: { clientId: client.id, carteId: carte.id }
    })

    // Vérifier si récompense débloquée
    let recompense = null
    if (carte.maxTampons && totalTampons >= carte.maxTampons) {
      recompense = `Félicitations ! Récompense débloquée : ${carte.recompense}`
    }

    res.json({
      message: 'Tampon ajouté avec succès !',
      client: client.nom,
      totalTampons,
      recompense
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

module.exports = router