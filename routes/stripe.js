const express = require('express')
const router = express.Router()
const Stripe = require('stripe')
const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
const prisma = new PrismaClient()

// POST /api/stripe/inscription-commercant
router.post('/inscription-commercant', async (req, res) => {
  const { nom, email, password, telephone, adresse } = req.body

  if (!nom || !email || !password) {
    return res.status(400).json({ erreur: 'Nom, email et mot de passe obligatoires' })
  }

  try {
    const existant = await prisma.commercant.findUnique({ where: { email } })
    if (existant) {
      return res.status(400).json({ erreur: 'Cet email est déjà utilisé' })
    }

    const hash = await bcrypt.hash(password, 10)

    const stripeCustomer = await stripe.customers.create({
      email,
      name: nom,
      phone: telephone || undefined,
    })

    const commercant = await prisma.commercant.create({
      data: {
        nom,
        email,
        password: hash,
        telephone: telephone || null,
        adresse: adresse || null,
        stripeCustomerId: stripeCustomer.id,
        statutAbonnement: 'inactif',
        stripeSetupPaid: false,
      },
    })

    // Étape 1 : paiement one-shot 150€
    // Après paiement réussi, le webhook crée l'abonnement 49€/mois
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Frais de mise en service FidèlePro' },
            unit_amount: 15000,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          commercantId: commercant.id,
          type: 'setup_fee',
        },
      },
      metadata: {
        commercantId: commercant.id,
        type: 'setup_fee',
      },
      success_url: `${process.env.FRONTEND_URL}/inscription-success`,
      cancel_url: `${process.env.FRONTEND_URL}/inscription-annulee`,
    })

    res.status(201).json({
      message: 'Compte créé, redirection vers le paiement',
      checkoutUrl: session.url,
      commercantId: commercant.id,
    })

  } catch (err) {
    console.error('Erreur inscription commerçant:', err)
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

// POST /api/stripe/webhook
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature invalide:', err.message)
    return res.status(400).json({ erreur: 'Webhook invalide' })
  }

  // Paiement 150€ réussi → activer le compte + créer abonnement 49€/mois dans 30 jours
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    if (session.metadata.type === 'setup_fee') {
      const commercantId = session.metadata.commercantId

      try {
        const commercant = await prisma.commercant.findUnique({
          where: { id: commercantId },
        })

        if (!commercant) {
          console.error('Commerçant introuvable:', commercantId)
          return res.json({ reçu: true })
        }

        // Créer l'abonnement 49€/mois avec démarrage dans 30 jours
        const abonnement = await stripe.subscriptions.create({
          customer: commercant.stripeCustomerId,
          items: [
            {
              price_data: {
                currency: 'eur',
                product_data: { name: 'Abonnement FidèlePro mensuel' },
                unit_amount: 4900,
                recurring: { interval: 'month' },
              },
            },
          ],
          billing_cycle_anchor: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          proration_behavior: 'none',
        })

        // Activer le compte commerçant
        await prisma.commercant.update({
          where: { id: commercantId },
          data: {
            statutAbonnement: 'actif',
            stripeSetupPaid: true,
            stripeSubscriptionId: abonnement.id,
          },
        })

        console.log(`Commerçant ${commercantId} activé, abonnement démarré dans 30 jours`)

      } catch (err) {
        console.error('Erreur activation commerçant:', err)
      }
    }
  }

  // Paiement mensuel échoué
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object
    const customerId = invoice.customer

    try {
      await prisma.commercant.updateMany({
        where: { stripeCustomerId: customerId },
        data: { statutAbonnement: 'impayé' },
      })
      console.log(`Commerçant ${customerId} marqué impayé`)
    } catch (err) {
      console.error('Erreur mise à jour impayé:', err)
    }
  }

  // Abonnement résilié
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    const customerId = subscription.customer

    try {
      await prisma.commercant.updateMany({
        where: { stripeCustomerId: customerId },
        data: { statutAbonnement: 'résilié' },
      })
      console.log(`Commerçant ${customerId} résilié`)
    } catch (err) {
      console.error('Erreur résiliation:', err)
    }
  }

  res.json({ reçu: true })
})
// POST /api/stripe/setup-sepa
router.post('/setup-sepa', async (req, res) => {
  const { commercantId } = req.body

  if (!commercantId) {
    return res.status(400).json({ erreur: 'commercantId obligatoire' })
  }

  try {
    const commercant = await prisma.commercant.findUnique({
      where: { id: commercantId },
    })

    if (!commercant) {
      return res.status(404).json({ erreur: 'Commerçant introuvable' })
    }

    if (!commercant.stripeCustomerId) {
      return res.status(400).json({ erreur: 'Aucun client Stripe associé' })
    }

    // Session pour collecter l'IBAN via Stripe
    const session = await stripe.checkout.sessions.create({
      customer: commercant.stripeCustomerId,
      payment_method_types: ['sepa_debit'],
      mode: 'setup',
      success_url: `${process.env.FRONTEND_URL}/sepa-success`,
      cancel_url: `${process.env.FRONTEND_URL}/sepa-annulee`,
    })

    res.json({ setupUrl: session.url })

  } catch (err) {
    console.error('Erreur setup SEPA:', err)
    res.status(500).json({ erreur: 'Erreur serveur' })
  }
})

module.exports = router