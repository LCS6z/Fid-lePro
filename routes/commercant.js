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

// POST /api/commercant/valider-recompense — valide la récompense d'un client et remet sa carte à zéro
router.post('/valider-recompense', verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const { clientId, carteId } = req.body
    if (!clientId || !carteId) return res.status(400).json({ message: 'clientId et carteId requis' })

    const carte = await prisma.carte.findFirst({
      where: { id: carteId, commercantId: req.user.id }
    })
    if (!carte) return res.status(404).json({ message: 'Carte introuvable' })

    const totalTampons = await prisma.tampon.count({ where: { clientId, carteId } })
    if (!carte.maxTampons || totalTampons < carte.maxTampons) {
      return res.status(400).json({ message: 'Carte pas encore complète' })
    }

    // Enregistre la récompense validée + supprime les tampons (remise à zéro)
    await prisma.$transaction([
      prisma.recompenseValidee.create({ data: { clientId, carteId } }),
      prisma.tampon.deleteMany({ where: { clientId, carteId } }),
    ])

    // Notif push au client
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { fcmToken: true, nom: true }
    })
    if (client?.fcmToken) {
      const commercant = await prisma.commercant.findUnique({
        where: { id: req.user.id },
        select: { nom: true }
      })
      await envoyerNotification(
        client.fcmToken,
        '🎁 Récompense validée !',
        `${commercant.nom} a validé votre récompense. Votre carte repart de zéro, bonne continuation !`,
        { screen: 'dashboard-client', type: 'recompense_validee' }
      ).catch(() => {})
    }

    res.json({ message: 'Récompense validée, carte remise à zéro' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/commercant/stats — statistiques avancées (30j + récap mensuel)
router.get('/stats', verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const commercantId = req.user.id
    const maintenant = new Date()
    const debut30j = new Date(maintenant); debut30j.setDate(debut30j.getDate() - 30)
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)

    const cartes = await prisma.carte.findMany({ where: { commercantId }, select: { id: true } })
    const carteIds = cartes.map(c => c.id)

    const [scans30j, scansMois, totalScans, recompensesMois] = await Promise.all([
      // Scans des 30 derniers jours groupés par jour
      prisma.tampon.findMany({
        where: { carteId: { in: carteIds }, createdAt: { gte: debut30j } },
        select: { createdAt: true, clientId: true },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.tampon.count({ where: { carteId: { in: carteIds }, createdAt: { gte: debutMois } } }),
      prisma.tampon.count({ where: { carteId: { in: carteIds } } }),
      prisma.recompenseValidee.count({ where: { carteId: { in: carteIds }, createdAt: { gte: debutMois } } }),
    ])

    // Grouper par jour sur 30j
    const parJour = {}
    scans30j.forEach(t => {
      const jour = t.createdAt.toISOString().slice(0, 10)
      if (!parJour[jour]) parJour[jour] = { scans: 0, clients: new Set() }
      parJour[jour].scans++
      parJour[jour].clients.add(t.clientId)
    })

    const courbe30j = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(maintenant); d.setDate(d.getDate() - (29 - i))
      const key = d.toISOString().slice(0, 10)
      return { date: key, scans: parJour[key]?.scans ?? 0, clients: parJour[key]?.clients.size ?? 0 }
    })

    const clientsUniques30j = new Set(scans30j.map(t => t.clientId)).size

    res.json({
      courbe30j,
      recap: {
        scansMois,
        clientsUniques30j,
        recompensesMois,
        totalScans,
      }
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/commercant/export-clients — export CSV des clients
router.get('/export-clients', verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const commercantId = req.user.id

    const cartes = await prisma.carte.findMany({
      where: { commercantId },
      include: {
        tampons: { include: { client: true }, orderBy: { createdAt: 'desc' } }
      }
    })

    const clientsMap = {}
    cartes.forEach(carte => {
      carte.tampons.forEach(t => {
        if (!clientsMap[t.clientId]) {
          clientsMap[t.clientId] = {
            nom: t.client.nom,
            email: t.client.email,
            telephone: t.client.telephone ?? '',
            totalTampons: 0,
            derniereScan: t.createdAt,
          }
        }
        clientsMap[t.clientId].totalTampons++
        if (t.createdAt > clientsMap[t.clientId].derniereScan) {
          clientsMap[t.clientId].derniereScan = t.createdAt
        }
      })
    })

    const lignes = [
      'Nom,Email,Telephone,Tampons totaux,Dernier scan',
      ...Object.values(clientsMap).map(c =>
        `"${c.nom}","${c.email}","${c.telephone}",${c.totalTampons},"${c.derniereScan.toLocaleDateString('fr-FR')}"`
      )
    ]

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="clients-fidelepro.csv"')
    res.send('\uFEFF' + lignes.join('\n')) // BOM UTF-8 pour Excel
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// POST /api/commercant/campagne — envoie une notif à tous ses clients
router.post('/campagne', verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const { titre, message } = req.body
    if (!titre || !message) return res.status(400).json({ message: 'titre et message requis' })

    const cartes = await prisma.carte.findMany({
      where: { commercantId: req.user.id },
      include: { tampons: { include: { client: { select: { id: true, fcmToken: true } } } } }
    })

    const tokensMap = {}
    cartes.forEach(carte => {
      carte.tampons.forEach(t => {
        if (t.client.fcmToken) tokensMap[t.client.id] = t.client.fcmToken
      })
    })
    const tokens = Object.values(tokensMap)
    if (tokens.length === 0) return res.status(400).json({ message: 'Aucun client avec notifications activées' })

    const { envoyerNotificationMultiple } = require('../services/notification')
    const nbEnvoyes = await envoyerNotificationMultiple(tokens, titre, message, { screen: 'dashboard-client', type: 'campagne' })

    res.json({ message: `Campagne envoyée à ${nbEnvoyes} client(s)`, nbEnvoyes })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/commercant/clients-recompenses — clients avec carte complète en attente de validation
router.get('/clients-recompenses', verifierToken, verifierRole('commercant'), async (req, res) => {
  try {
    const commercantId = req.user.id

    const cartes = await prisma.carte.findMany({
      where: { commercantId },
      include: {
        tampons: { include: { client: { select: { id: true, nom: true, email: true } } } }
      }
    })

    const enAttente = []
    cartes.forEach(carte => {
      if (!carte.maxTampons) return
      const parClient = {}
      carte.tampons.forEach(t => {
        if (!parClient[t.clientId]) parClient[t.clientId] = { client: t.client, count: 0 }
        parClient[t.clientId].count++
      })
      Object.values(parClient).forEach(({ client, count }) => {
        if (count >= carte.maxTampons) {
          enAttente.push({ clientId: client.id, nom: client.nom, email: client.email, carteId: carte.id, carteName: carte.nom, recompense: carte.recompense })
        }
      })
    })

    res.json({ enAttente })
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