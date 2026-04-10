const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const { verifierToken, verifierRole } = require('../middleware/auth')

const prisma = new PrismaClient()

// GET /api/admin/stats — statistiques globales
router.get('/stats', verifierToken, verifierRole('admin'), async (req, res) => {
  try {
    const totalClients = await prisma.client.count()
    const totalCommercants = await prisma.commercant.count()
    const commercantsActifs = await prisma.commercant.count({ where: { statutAbonnement: 'actif' } })
    const totalScans = await prisma.tampon.count()

    res.json({ totalClients, totalCommercants, commercantsActifs, totalScans })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/admin/commercants — liste tous les commerçants
router.get('/commercants', verifierToken, verifierRole('admin'), async (req, res) => {
  try {
    const commercants = await prisma.commercant.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        adresse: true,
        statutAbonnement: true,
        stripeSetupPaid: true,
        createdAt: true,
        _count: { select: { cartes: true } }
      }
    })
    res.json({ commercants })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/admin/clients — liste tous les clients
router.get('/clients', verifierToken, verifierRole('admin'), async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nom: true,
        email: true,
        telephone: true,
        createdAt: true,
        _count: { select: { tampons: true } }
      }
    })
    res.json({ clients })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/admin/scans — historique global des scans
router.get('/scans', verifierToken, verifierRole('admin'), async (req, res) => {
  try {
    const scans = await prisma.tampon.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        client: { select: { nom: true, email: true } },
        carte: {
          include: { commercant: { select: { nom: true } } }
        }
      }
    })
    res.json({ scans })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// PATCH /api/admin/commercant/:id/statut — changer le statut d'un commerçant
router.patch('/commercant/:id/statut', verifierToken, verifierRole('admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { statut } = req.body

    const statutsValides = ['actif', 'inactif', 'suspendu', 'résilié']
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' })
    }

    const commercant = await prisma.commercant.update({
      where: { id },
      data: { statutAbonnement: statut }
    })

    res.json({ message: `Statut mis à jour : ${statut}`, commercant })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// DELETE /api/admin/commercant/:id — supprimer un commerçant
router.delete('/commercant/:id', verifierToken, verifierRole('admin'), async (req, res) => {
  try {
    const { id } = req.params
    await prisma.commercant.delete({ where: { id } })
    res.json({ message: 'Commerçant supprimé' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// DELETE /api/admin/client/:id — supprimer un client
router.delete('/client/:id', verifierToken, verifierRole('admin'), async (req, res) => {
  try {
    const { id } = req.params
    await prisma.client.delete({ where: { id } })
    res.json({ message: 'Client supprimé' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// PATCH /api/admin/commercant/:id/partenaire — gérer le statut partenaire
router.patch('/commercant/:id/partenaire', verifierToken, verifierRole('admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { estPartenaire, categorie, description, horaires } = req.body
    const commercant = await prisma.commercant.update({
      where: { id },
      data: {
        ...(estPartenaire !== undefined && { estPartenaire }),
        ...(categorie !== undefined && { categorie }),
        ...(description !== undefined && { description }),
        ...(horaires !== undefined && { horaires }),
      },
      select: { id: true, nom: true, estPartenaire: true, categorie: true, description: true, horaires: true }
    })
    res.json({ message: 'Partenaire mis à jour', commercant })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

// GET /api/admin/recompenses — historique global des récompenses validées
router.get('/recompenses', verifierToken, verifierRole('admin'), async (req, res) => {
  try {
    const recompenses = await prisma.recompenseValidee.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        client: { select: { nom: true, email: true } },
        carte: { include: { commercant: { select: { nom: true } } } }
      }
    })
    res.json({ recompenses, total: recompenses.length })
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', erreur: err.message })
  }
})

module.exports = router