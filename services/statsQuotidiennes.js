const cron = require('node-cron')
const { PrismaClient } = require('@prisma/client')
const { envoyerNotification } = require('./notification')

const prisma = new PrismaClient()

/**
 * Envoie à chaque commerçant actif un récap des stats du jour :
 * - Nombre de scans aujourd'hui
 * - Nombre de clients uniques aujourd'hui
 * - Nombre de récompenses validées aujourd'hui
 *
 * Tourne chaque soir à 20h00 (heure de Paris).
 */
async function envoyerStatsQuotidiennes() {
  console.log('[Cron] Stats quotidiennes — démarrage')

  const debutJour = new Date()
  debutJour.setHours(0, 0, 0, 0)

  try {
    const commercants = await prisma.commercant.findMany({
      where: { fcmToken: { not: null } },
      select: { id: true, nom: true, fcmToken: true }
    })

    console.log(`[Cron] ${commercants.length} commerçant(s) avec token FCM`)

    let envoyes = 0
    for (const commercant of commercants) {
      try {
        const cartes = await prisma.carte.findMany({
          where: { commercantId: commercant.id },
          select: { id: true }
        })
        const carteIds = cartes.map(c => c.id)
        if (carteIds.length === 0) continue

        const [tamponsJour, recompensesJour] = await Promise.all([
          prisma.tampon.findMany({
            where: { carteId: { in: carteIds }, createdAt: { gte: debutJour } },
            select: { clientId: true }
          }),
          prisma.recompenseValidee.count({
            where: { carteId: { in: carteIds }, createdAt: { gte: debutJour } }
          })
        ])

        if (tamponsJour.length === 0) continue // rien à signaler si pas d'activité

        const scansJour = tamponsJour.length
        const clientsUniques = new Set(tamponsJour.map(t => t.clientId)).size

        const lignes = [
          `${scansJour} tampon${scansJour > 1 ? 's' : ''} ajouté${scansJour > 1 ? 's' : ''}`,
          `${clientsUniques} client${clientsUniques > 1 ? 's' : ''} unique${clientsUniques > 1 ? 's' : ''}`,
          recompensesJour > 0 ? `${recompensesJour} récompense${recompensesJour > 1 ? 's' : ''} validée${recompensesJour > 1 ? 's' : ''}` : null,
        ].filter(Boolean).join(' · ')

        await envoyerNotification(
          commercant.fcmToken,
          '📊 Récap du jour',
          lignes,
          { screen: 'dashboard-commercant', type: 'stats_quotidiennes' }
        )
        envoyes++
      } catch (e) {
        console.warn(`[Cron] Échec stats commerçant ${commercant.id}:`, e.message)
      }
    }

    console.log(`[Cron] Stats quotidiennes terminées — ${envoyes}/${commercants.length} notifs envoyées`)
  } catch (err) {
    console.error('[Cron] Erreur stats quotidiennes:', err.message)
  }
}

function demarrerCronStats() {
  cron.schedule('0 20 * * *', envoyerStatsQuotidiennes, {
    timezone: 'Europe/Paris',
  })
  console.log('[Cron] Stats quotidiennes planifiées — chaque jour à 20h00 (Paris)')
}

module.exports = { demarrerCronStats, envoyerStatsQuotidiennes }
