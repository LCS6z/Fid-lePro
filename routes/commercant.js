const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verifierToken, verifierRole } = require('../middleware/auth')

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

module.exports = router