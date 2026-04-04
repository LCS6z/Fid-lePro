const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verifierToken, verifierRole } = require('../middleware/auth')

const prisma = new PrismaClient()

// GET /api/client/profil
router.get('/profil', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.user.id },
      select: { id: true, nom: true, email: true, qrCode: true, createdAt: true }
    })
    if (!client) return res.status(404).json({ message: 'Client introuvable' })
    res.json(client)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/client/tampons
router.get('/tampons', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const clientId = req.user.id

    const tampons = await prisma.tampon.findMany({
      where: { clientId },
      include: {
        carte: {
          include: { commercant: true }
        }
      }
    })

    const groupes = {}
    tampons.forEach(tampon => {
      const carteId = tampon.carteId
      if (!groupes[carteId]) {
        groupes[carteId] = {
          carteId,
          carteName: tampon.carte.nom,
          commercant: { nom: tampon.carte.commercant.nom, id: tampon.carte.commercant.id },
          nombreTampons: 0,
          maxTampons: tampon.carte.maxTampons || 10,
          recompense: tampon.carte.recompense || null,
        }
      }
      groupes[carteId].nombreTampons++
    })

    res.json(Object.values(groupes))
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/client/commercant/:id
router.get('/commercant/:id', verifierToken, async (req, res) => {
  try {
    const commercant = await prisma.commercant.findUnique({
      where: { id: req.params.id },
      select: { id: true, nom: true, lienGoogle: true }
    })
    if (!commercant) return res.status(404).json({ message: 'Introuvable' })
    res.json(commercant)
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/client/progression
router.get('/progression', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const clientId = req.user.id

    const tampons = await prisma.tampon.findMany({
      where: { clientId },
      include: {
        carte: {
          include: { commercant: true }
        }
      }
    })

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

// POST /api/client/avis
router.post('/avis', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const { commercantId, note, commentaire } = req.body

    if (note < 1 || note > 5) {
      return res.status(400).json({ message: 'La note doit être entre 1 et 5' })
    }

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

// GET /api/client/avis/:commercantId
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
// POST /api/client/fcm-token
router.post('/fcm-token', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const { fcmToken } = req.body
    await prisma.client.update({
      where: { id: req.user.id },
      data: { fcmToken }
    })
    res.json({ message: 'Token FCM enregistré' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})
module.exports = router