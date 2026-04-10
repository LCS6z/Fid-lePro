const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const { PrismaClient } = require('@prisma/client')
const { v4: uuidv4 } = require('uuid')
const prisma = new PrismaClient()
const { verifierToken } = require('../middleware/auth')
const { envoyerBienvenueClient, envoyerCodeReset } = require('../services/email')

// Max 10 tentatives de connexion par IP toutes les 15 minutes
const limiterConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Max 5 inscriptions par IP par heure
const limiterInscription = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Trop d\'inscriptions depuis cette adresse. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Inscription client
router.post('/inscription/client', limiterInscription, async (req, res) => {
  try {
    const { nom, email, password } = req.body

    const existant = await prisma.client.findUnique({ where: { email } })
    if (existant) return res.status(400).json({ message: 'Email déjà utilisé' })

    const hash = await bcrypt.hash(password, 10)
    const qrCode = uuidv4()

    const client = await prisma.client.create({
      data: { nom, email, password: hash, qrCode }
    })

    try {
      await envoyerBienvenueClient(email, nom)
    } catch (e) {
      console.log('Erreur email bienvenue client:', e)
    }

    res.json({ message: 'Compte créé avec succès', client })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// Connexion client
router.post('/connexion/client', limiterConnexion, async (req, res) => {
  try {
    const { email, password } = req.body

    const client = await prisma.client.findUnique({ where: { email } })
    if (!client) return res.status(400).json({ message: 'Email ou mot de passe incorrect' })

    const valide = await bcrypt.compare(password, client.password)
    if (!valide) return res.status(400).json({ message: 'Email ou mot de passe incorrect' })

    const token = jwt.sign({ id: client.id, role: 'client' }, process.env.JWT_SECRET, { expiresIn: '1h' })
    const refreshToken = uuidv4()
    await prisma.client.update({ where: { id: client.id }, data: { refreshToken } })

    res.json({ message: 'Connexion réussie', token, refreshToken, role: 'client' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// Connexion commerçant
router.post('/connexion/commercant', limiterConnexion, async (req, res) => {
  try {
    const { email, password } = req.body

    const commercant = await prisma.commercant.findUnique({ where: { email } })
    if (!commercant) return res.status(400).json({ message: 'Email ou mot de passe incorrect' })

    const valide = await bcrypt.compare(password, commercant.password)
    if (!valide) return res.status(400).json({ message: 'Email ou mot de passe incorrect' })

    if (commercant.statutAbonnement === 'inactif') {
      return res.status(403).json({
        message: 'Votre compte est en attente de paiement.',
        statut: 'inactif'
      })
    }

    if (commercant.statutAbonnement === 'suspendu') {
      return res.status(403).json({
        message: 'Votre compte est suspendu. Contactez le support.',
        statut: 'suspendu'
      })
    }

    if (commercant.statutAbonnement === 'résilié') {
      return res.status(403).json({
        message: 'Votre abonnement est résilié.',
        statut: 'résilié'
      })
    }

    if (commercant.statutAbonnement === 'impayé') {
      return res.status(403).json({
        message: 'Votre abonnement est impayé. Veuillez régulariser votre situation.',
        statut: 'impayé'
      })
    }

    const token = jwt.sign({ id: commercant.id, role: 'commercant' }, process.env.JWT_SECRET, { expiresIn: '1h' })
    const refreshToken = uuidv4()
    await prisma.commercant.update({ where: { id: commercant.id }, data: { refreshToken } })

    res.json({
      message: 'Connexion réussie',
      token,
      refreshToken,
      role: 'commercant',
      commercant: {
        id: commercant.id,
        nom: commercant.nom,
        email: commercant.email,
        statutAbonnement: commercant.statutAbonnement
      }
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// Connexion admin
router.post('/connexion/admin', limiterConnexion, async (req, res) => {
  try {
    const { email, password } = req.body

    const admin = await prisma.admin.findUnique({ where: { email } })
    if (!admin) return res.status(400).json({ message: 'Email ou mot de passe incorrect' })

    const valide = await bcrypt.compare(password, admin.password)
    if (!valide) return res.status(400).json({ message: 'Email ou mot de passe incorrect' })

    const token = jwt.sign(
      { id: admin.id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Connexion réussie',
      token,
      role: 'admin',
      admin: { id: admin.id, nom: admin.nom, email: admin.email }
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// POST /api/auth/refresh — renouvelle le token d'accès via le refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken requis' })

    // Chercher client ou commerçant avec ce refreshToken
    const client = await prisma.client.findUnique({ where: { refreshToken } })
    const commercant = !client ? await prisma.commercant.findUnique({ where: { refreshToken } }) : null

    if (!client && !commercant) {
      return res.status(401).json({ message: 'Refresh token invalide ou expiré' })
    }

    const user = client || commercant
    const role = client ? 'client' : 'commercant'

    // Nouveau access token (1h) + rotation du refresh token
    const newToken = jwt.sign({ id: user.id, role }, process.env.JWT_SECRET, { expiresIn: '1h' })
    const newRefreshToken = uuidv4()

    if (client) {
      await prisma.client.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } })
    } else {
      await prisma.commercant.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } })
    }

    res.json({ token: newToken, refreshToken: newRefreshToken })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// POST /api/auth/mdp-oublie — envoie un code de reset par email
router.post('/mdp-oublie', rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { message: 'Trop de tentatives.' } }), async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email requis' })

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiry = new Date(Date.now() + 15 * 60 * 1000)

    // Chercher client ou commerçant
    const client = await prisma.client.findUnique({ where: { email } })
    const commercant = !client ? await prisma.commercant.findUnique({ where: { email } }) : null

    if (client) {
      await prisma.client.update({ where: { email }, data: { resetCode: code, resetCodeExpiry: expiry } })
      try { await envoyerCodeReset(email, client.nom, code) } catch (e) { console.log('Email reset:', e) }
    } else if (commercant) {
      await prisma.commercant.update({ where: { email }, data: { resetCode: code, resetCodeExpiry: expiry } })
      try { await envoyerCodeReset(email, commercant.nom, code) } catch (e) { console.log('Email reset:', e) }
    }
    // Toujours répondre 200 pour ne pas exposer si l'email existe
    res.json({ message: 'Si cet email est enregistré, un code vous a été envoyé.' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// POST /api/auth/verifier-code — vérifie le code reset
router.post('/verifier-code', async (req, res) => {
  try {
    const { email, code } = req.body
    if (!email || !code) return res.status(400).json({ message: 'Email et code requis' })

    const client = await prisma.client.findUnique({ where: { email } })
    const commercant = !client ? await prisma.commercant.findUnique({ where: { email } }) : null
    const user = client || commercant

    if (!user || user.resetCode !== code || !user.resetCodeExpiry || new Date() > user.resetCodeExpiry) {
      return res.status(400).json({ message: 'Code invalide ou expiré' })
    }
    res.json({ message: 'Code valide' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// POST /api/auth/reinitialiser-mdp — réinitialise le mot de passe
router.post('/reinitialiser-mdp', async (req, res) => {
  try {
    const { email, code, nouveauMotDePasse } = req.body
    if (!email || !code || !nouveauMotDePasse) return res.status(400).json({ message: 'Données manquantes' })
    if (nouveauMotDePasse.length < 8) return res.status(400).json({ message: 'Mot de passe trop court (8 caractères minimum)' })

    const client = await prisma.client.findUnique({ where: { email } })
    const commercant = !client ? await prisma.commercant.findUnique({ where: { email } }) : null
    const user = client || commercant

    if (!user || user.resetCode !== code || !user.resetCodeExpiry || new Date() > user.resetCodeExpiry) {
      return res.status(400).json({ message: 'Code invalide ou expiré' })
    }

    const hash = await bcrypt.hash(nouveauMotDePasse, 10)
    if (client) {
      await prisma.client.update({ where: { email }, data: { password: hash, resetCode: null, resetCodeExpiry: null } })
    } else {
      await prisma.commercant.update({ where: { email }, data: { password: hash, resetCode: null, resetCodeExpiry: null } })
    }
    res.json({ message: 'Mot de passe réinitialisé avec succès' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// POST /api/auth/changer-mdp — change le mot de passe (authentifié)
router.post('/changer-mdp', verifierToken, async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body
    if (!ancienMotDePasse || !nouveauMotDePasse) return res.status(400).json({ message: 'Données manquantes' })
    if (nouveauMotDePasse.length < 8) return res.status(400).json({ message: 'Mot de passe trop court (8 caractères minimum)' })

    const { id, role } = req.user
    let user
    if (role === 'client') user = await prisma.client.findUnique({ where: { id } })
    else if (role === 'commercant') user = await prisma.commercant.findUnique({ where: { id } })
    else return res.status(403).json({ message: 'Non autorisé' })

    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })

    const valide = await bcrypt.compare(ancienMotDePasse, user.password)
    if (!valide) return res.status(400).json({ message: 'Mot de passe actuel incorrect' })

    const hash = await bcrypt.hash(nouveauMotDePasse, 10)
    if (role === 'client') await prisma.client.update({ where: { id }, data: { password: hash } })
    else await prisma.commercant.update({ where: { id }, data: { password: hash } })

    res.json({ message: 'Mot de passe modifié avec succès' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// DELETE /api/auth/compte — supprime le compte (authentifié)
router.delete('/compte', verifierToken, async (req, res) => {
  try {
    const { id, role } = req.user

    if (role === 'client') {
      await prisma.$transaction([
        prisma.avis.deleteMany({ where: { clientId: id } }),
        prisma.recompenseValidee.deleteMany({ where: { clientId: id } }),
        prisma.tampon.deleteMany({ where: { clientId: id } }),
        prisma.cashback.deleteMany({ where: { clientId: id } }),
        prisma.client.delete({ where: { id } }),
      ])
    } else if (role === 'commercant') {
      const cartes = await prisma.carte.findMany({ where: { commercantId: id }, select: { id: true } })
      const carteIds = cartes.map(c => c.id)
      await prisma.$transaction([
        prisma.recompenseValidee.deleteMany({ where: { carteId: { in: carteIds } } }),
        prisma.tampon.deleteMany({ where: { carteId: { in: carteIds } } }),
        prisma.cashback.deleteMany({ where: { carteId: { in: carteIds } } }),
        prisma.carte.deleteMany({ where: { commercantId: id } }),
        prisma.avis.deleteMany({ where: { commercantId: id } }),
        prisma.commercant.delete({ where: { id } }),
      ])
    } else {
      return res.status(403).json({ message: 'Non autorisé' })
    }

    res.json({ message: 'Compte supprimé avec succès' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

module.exports = router