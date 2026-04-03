const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

const SETUP_FEE_AMOUNT = 15000; // 150€ en centimes
const MONTHLY_PRICE_ID = null;  // on le remplace juste après

// POST /api/stripe/inscription-commercant
router.post('/inscription-commercant', async (req, res) => {
  const { nom, email, password, telephone, adresse } = req.body;

  if (!nom || !email || !password) {
    return res.status(400).json({ erreur: 'Nom, email et mot de passe obligatoires' });
  }

  try {
    // Vérifier si email déjà utilisé
    const existant = await prisma.commercant.findUnique({ where: { email } });
    if (existant) {
      return res.status(400).json({ erreur: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hash = await bcrypt.hash(password, 10);

    // Créer le client Stripe
    const stripeCustomer = await stripe.customers.create({
      email,
      name: nom,
      phone: telephone || undefined,
    });

    // Créer le commerçant en base (statut inactif)
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
    });

    // Créer une session Stripe Checkout (150€ + abonnement 49€/mois)
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Frais de mise en service FidèlePro' },
            unit_amount: SETUP_FEE_AMOUNT,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Abonnement FidèlePro mensuel' },
            unit_amount: 4900,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      metadata: { commercantId: commercant.id },
      success_url: `${process.env.FRONTEND_URL}/inscription-success`,
      cancel_url: `${process.env.FRONTEND_URL}/inscription-annulee`,
    });

    res.status(201).json({
      message: 'Compte créé, redirection vers le paiement',
      checkoutUrl: session.url,
      commercantId: commercant.id,
    });

  } catch (err) {
    console.error('Erreur inscription commerçant:', err);
    res.status(500).json({ erreur: 'Erreur serveur' });
  }
});

module.exports = router;