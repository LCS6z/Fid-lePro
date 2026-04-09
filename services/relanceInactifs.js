const cron = require('node-cron')
const { PrismaClient } = require('@prisma/client')
const { envoyerNotification } = require('./notification')

const prisma = new PrismaClient()

const JOURS_INACTIVITE = 15

/**
 * Trouve tous les clients inactifs depuis JOURS_INACTIVITE jours
 * et leur envoie une notif push de relance de la part du commerçant
 * chez qui ils ont le plus de tampons.
 *
 * Tourne chaque nuit à 10h00.
 */
async function relancerClientsInactifs() {
  console.log('[Cron] Relance clients inactifs — démarrage')

  const seuil = new Date()
  seuil.setDate(seuil.getDate() - JOURS_INACTIVITE)

  try {
    // Récupère tous les tampons plus récents que le seuil par client
    const clientsActifs = await prisma.tampon.groupBy({
      by: ['clientId'],
      where: { createdAt: { gte: seuil } },
    })
    const idsActifs = clientsActifs.map(c => c.clientId)

    // Récupère tous les clients avec FCM token qui ne sont PAS actifs
    const clients = await prisma.client.findMany({
      where: {
        fcmToken: { not: null },
        id: { notIn: idsActifs },
        tampons: { some: {} }, // au moins un tampon (client connu d'un commerçant)
      },
      select: {
        id: true,
        nom: true,
        fcmToken: true,
        tampons: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            carte: {
              include: {
                commercant: { select: { nom: true } }
              }
            }
          }
        }
      }
    })

    console.log(`[Cron] ${clients.length} client(s) inactif(s) à relancer`)

    let envoyes = 0
    for (const client of clients) {
      const dernierTampon = client.tampons[0]
      if (!dernierTampon) continue

      const nomCommercant = dernierTampon.carte.commercant.nom

      try {
        await envoyerNotification(
          client.fcmToken,
          '📣 Ça fait un moment !',
          `${nomCommercant} vous attend — revenez accumuler vos tampons.`,
          { screen: 'dashboard-client', type: 'relance' }
        )
        envoyes++
      } catch (e) {
        console.warn(`[Cron] Échec notif client ${client.id}:`, e.message)
      }
    }

    console.log(`[Cron] Relance terminée — ${envoyes}/${clients.length} notifs envoyées`)
  } catch (err) {
    console.error('[Cron] Erreur relance inactifs:', err.message)
  }
}

/**
 * Démarre le cron — chaque jour à 10h00.
 */
function demarrerCronRelance() {
  cron.schedule('0 10 * * *', relancerClientsInactifs, {
    timezone: 'Europe/Paris',
  })
  console.log('[Cron] Relance clients inactifs planifiée — chaque jour à 10h00 (Paris)')
}

module.exports = { demarrerCronRelance, relancerClientsInactifs }
