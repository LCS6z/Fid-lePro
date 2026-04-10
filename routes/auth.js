const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const { PrismaClient } = require('@prisma/client')
const { v4: uuidv4 } = require('uuid')
const prisma = new PrismaClient()
const { envoyerBienvenueClient } = require('../services/email')

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

    const token = jwt.sign(
      { id: client.id, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ message: 'Connexion réussie', token, role: 'client' })
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

    const token = jwt.sign(
      { id: commercant.id, role: 'commercant' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Connexion réussie',
      token,
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

module.exports = router