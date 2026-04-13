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
// GET /api/client/partenaires — liste des commerçants partenaires groupés par catégorie
router.get('/partenaires', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const partenaires = await prisma.commercant.findMany({
      where: { estPartenaire: true },
      select: {
        id: true,
        nom: true,
        categorie: true,
        description: true,
        adresse: true,
        telephone: true,
        lienGoogle: true,
        horaires: true,
      },
      orderBy: [{ categorie: 'asc' }, { nom: 'asc' }]
    })

    // Grouper par catégorie
    const grouped = partenaires.reduce((acc, p) => {
      const cat = p.categorie || 'Autres'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(p)
      return acc
    }, {})

    const categories = Object.entries(grouped).map(([nom, commerces]) => ({
      nom,
      commerces
    }))

    res.json({ categories, total: partenaires.length })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/client/parrainage — code de parrainage + stats
router.get('/parrainage', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.user.id },
      select: { codeParrainage: true }
    })
    const nbFilleuls = await prisma.client.count({ where: { parrainId: req.user.id } })
    res.json({ codeParrainage: client?.codeParrainage, nbFilleuls })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// POST /api/client/valider-parrainage — appliquer un code parrain après inscription
router.post('/valider-parrainage', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ message: 'Code requis' })

    const client = await prisma.client.findUnique({ where: { id: req.user.id } })
    if (client?.parrainId) return res.status(400).json({ message: 'Vous avez déjà utilisé un code parrain' })

    const parrain = await prisma.client.findUnique({ where: { codeParrainage: code.toUpperCase() } })
    if (!parrain) return res.status(404).json({ message: 'Code parrain invalide' })
    if (parrain.id === req.user.id) return res.status(400).json({ message: 'Vous ne pouvez pas utiliser votre propre code' })

    await prisma.client.update({ where: { id: req.user.id }, data: { parrainId: parrain.id } })
    res.json({ message: 'Code parrain appliqué avec succès !' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// PATCH /api/client/profil — met à jour nom et téléphone
router.patch('/profil', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const { nom, telephone } = req.body
    const data = {}
    if (nom && nom.trim()) data.nom = nom.trim()
    if (telephone !== undefined) data.telephone = telephone || null

    const client = await prisma.client.update({
      where: { id: req.user.id },
      data,
      select: { id: true, nom: true, email: true, telephone: true, qrCode: true }
    })
    res.json({ message: 'Profil mis à jour', client })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/client/recompenses — historique des récompenses validées
router.get('/recompenses', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const recompenses = await prisma.recompenseValidee.findMany({
      where: { clientId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        carte: {
          select: { nom: true, recompense: true, commercant: { select: { nom: true } } }
        }
      }
    })
    res.json({ recompenses })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/client/commercants-geo — coords des commerçants où le client a des tampons
router.get('/commercants-geo', verifierToken, verifierRole('client'), async (req, res) => {
  try {
    const tampons = await prisma.tampon.findMany({
      where: { clientId: req.user.id },
      select: {
        carte: {
          select: {
            commercant: {
              select: { id: true, nom: true, latitude: true, longitude: true }
            }
          }
        }
      }
    })

    const seen = new Set()
    const commercants = []
    for (const t of tampons) {
      const c = t.carte.commercant
      if (!seen.has(c.id) && c.latitude && c.longitude) {
        seen.add(c.id)
        commercants.push(c)
      }
    }

    res.json({ commercants })
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