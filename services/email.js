const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'FidèlePro <onboarding@resend.dev>'

// Email de bienvenue client
const envoyerBienvenueClient = async (email, nom) => {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Bienvenue sur FidèlePro ! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6637ee, #9b59b6); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">FidèlePro</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Votre fidélité récompensée</p>
        </div>
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Bonjour ${nom} ! 👋</h2>
          <p style="color: #666; line-height: 1.6;">
            Bienvenue sur FidèlePro ! Votre compte client est maintenant actif.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Vous pouvez dès maintenant scanner votre QR code dans nos commerces partenaires pour commencer à cumuler vos tampons et débloquer des récompenses.
          </p>
          <div style="text-align: center; margin-top: 32px;">
            <div style="background: #6637ee; color: white; padding: 16px 32px; border-radius: 12px; display: inline-block; font-weight: bold; font-size: 16px;">
              🎯 Commencer à fidéliser
            </div>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">
            FidèlePro — Votre programme de fidélité digital
          </p>
        </div>
      </div>
    `
  })
}

// Email de bienvenue commerçant
const envoyerBienvenueCommercant = async (email, nom) => {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Bienvenue sur FidèlePro — Votre compte est actif ! 🏪',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6637ee, #9b59b6); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">FidèlePro</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Espace Commerçant</p>
        </div>
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Bonjour ${nom} ! 🎉</h2>
          <p style="color: #666; line-height: 1.6;">
            Votre compte commerçant FidèlePro est maintenant <strong>actif</strong>. Vous pouvez commencer à fidéliser vos clients dès maintenant.
          </p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; margin: 24px 0;">
            <h3 style="color: #333; margin-top: 0;">Votre abonnement :</h3>
            <p style="color: #666; margin: 4px 0;">✅ Frais de mise en service : 150€ (réglés)</p>
            <p style="color: #666; margin: 4px 0;">📅 Abonnement mensuel : 49€/mois</p>
            <p style="color: #666; margin: 4px 0;">🔓 Sans engagement — résiliation avec 1 mois de préavis</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">
            FidèlePro — Votre programme de fidélité digital
          </p>
        </div>
      </div>
    `
  })
}

// Email confirmation paiement
const envoyerConfirmationPaiement = async (email, nom, montant) => {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Confirmation de paiement FidèlePro ✅',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6637ee, #9b59b6); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">FidèlePro</h1>
        </div>
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px;">
          <h2 style="color: #333;">Paiement confirmé ✅</h2>
          <p style="color: #666;">Bonjour ${nom},</p>
          <p style="color: #666; line-height: 1.6;">
            Nous confirmons la réception de votre paiement de <strong>${montant}€</strong>.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">
            FidèlePro — Votre programme de fidélité digital
          </p>
        </div>
      </div>
    `
  })
}

// Email échec paiement
const envoyerEchecPaiement = async (email, nom) => {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Problème de paiement FidèlePro ⚠️',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #e74c3c; padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">FidèlePro</h1>
        </div>
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px;">
          <h2 style="color: #333;">Échec de paiement ⚠️</h2>
          <p style="color: #666;">Bonjour ${nom},</p>
          <p style="color: #666; line-height: 1.6;">
            Nous n'avons pas pu prélever votre abonnement mensuel. Veuillez mettre à jour vos informations de paiement pour continuer à accéder à FidèlePro.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">
            FidèlePro — Votre programme de fidélité digital
          </p>
        </div>
      </div>
    `
  })
}

// Email code réinitialisation mot de passe
const envoyerCodeReset = async (email, nom, code) => {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Réinitialisation de votre mot de passe FidèlePro 🔐',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6637ee, #9b59b6); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">FidèlePro</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Réinitialisation du mot de passe</p>
        </div>
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Bonjour ${nom} 👋</h2>
          <p style="color: #666; line-height: 1.6;">Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code :</p>
          <div style="background: #f5f0ff; border: 2px solid #6637ee; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <div style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #6637ee;">${code}</div>
          </div>
          <p style="color: #999; font-size: 13px; line-height: 1.6;">Ce code est valable <strong>15 minutes</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">FidèlePro — Votre programme de fidélité digital</p>
        </div>
      </div>
    `
  })
}

module.exports = {
  envoyerBienvenueClient,
  envoyerBienvenueCommercant,
  envoyerConfirmationPaiement,
  envoyerEchecPaiement,
  envoyerCodeReset,
}