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
// Le client laisse un avis sur un commerce
router.post('/avis', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const { commercantId, note, commentaire } = req.body

    // Vérifier que la note est entre 1 et 5
    if (note < 1 || note > 5) {
      return res.status(400).json({ message: 'La note doit être entre 1 et 5' })
    }

    // Vérifier que le client a déjà scanné dans ce commerce
    const tampons = await prisma.tampon.findFirst({
      where: {
        clientId: req.user.id,
        carte: { commercantId }
      },
      include: { carte: true }
    })

    if (!tampons) {
      return res.status(400).json({ message: 'Vous devez avoir scanné au moins une fois dans ce commerce pour laisser un avis' })
    }

    // Créer l'avis
    const avis = await prisma.avis.create({
      data: {
        note,
        commentaire,
        clientId: req.user.id,
        commercantId
      }
    })

    res.json({ message: 'Avis publié avec succès !', avis })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// Voir les avis d'un commerce
router.get('/avis/:commercantId', async (req, res) => {
  try {
    const { commercantId } = req.params

    const avis = await prisma.avis.findMany({
      where: { commercantId },
      include: { client: { select: { nom: true } } },
      orderBy: { createdAt: 'desc' }
    })

    const moyenneNote = avis.length > 0
      ? (avis.reduce((sum, a) => sum + a.note, 0) / avis.length).toFixed(1)
      : 0

    res.json({ avis, moyenneNote, totalAvis: avis.length })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})
module.exports = router