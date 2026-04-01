const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verifierToken, verifierRole } = require('../middleware/auth')

const prisma = new PrismaClient()

// Le client voit sa progression sur toutes ses cartes
router.get('/progression', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const clientId = req.user.id

    // Récupérer tous les tampons du client groupés par carte
    const tampons = await prisma.tampon.findMany({
      where: { clientId },
      include: {
        carte: {
          include: { commercant: true }
        }
      }
    })

    // Grouper par carte
    const progression = {}
    tampons.forEach(tampon => {
      const carteId = tampon.carteId
      if (!progression[carteId]) {
        progression[carteId] = {
          carte: tampon.carte.nom,
          commerce: tampon.carte.commercant.nom,
          totalTampons: 0,
          maxTampons: tampon.carte.maxTampons,
          recompense: tampon.carte.recompense
        }
      }
      progression[carteId].totalTampons++
    })

    res.json({ progression: Object.values(progression) })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

module.exports = router