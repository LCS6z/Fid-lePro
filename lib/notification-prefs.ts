import * as Notifications from 'expo-notifications';
import { authStorage } from '@/lib/auth-storage';
import { apiClient } from '@/lib/api';

export type NotifPrefKey =
  | 'notif_tampon_ajoute'    // client : tampon ajouté par un commerçant
  | 'notif_recompense'        // client : récompense disponible (carte complète)
  | 'notif_relance'           // client : relance d'un commerçant inactif
  | 'notif_stats_quotidiennes'; // commerçant : résumé quotidien d'activité

export const NOTIF_PREFS: { key: NotifPrefKey; label: string; description: string }[] = [
  {
    key: 'notif_tampon_ajoute',
    label: '💳 Nouveau tampon',
    description: 'Quand un commerçant vous ajoute un tampon',
  },
  {
    key: 'notif_recompense',
    label: '🎁 Récompense disponible',
    description: 'Quand votre carte est complète',
  },
  {
    key: 'notif_relance',
    label: '📣 Relances commerçants',
    description: 'Rappels des commerçants que vous visitez',
  },
  {
    key: 'notif_stats_quotidiennes',
    label: '📊 Stats quotidiennes',
    description: 'Résumé journalier de votre activité (commerçants)',
  },
];

/**
 * Lit toutes les préférences de notifications depuis SecureStore.
 * Par défaut tout est activé.
 */
export async function getNotifPrefs(): Promise<Record<NotifPrefKey, boolean>> {
  const results = await Promise.all(
    NOTIF_PREFS.map(async ({ key }) => {
      const val = await authStorage.getRaw(key);
      // null = jamais défini → activé par défaut
      return [key, val !== 'false'] as [NotifPrefKey, boolean];
    })
  );
  return Object.fromEntries(results) as Record<NotifPrefKey, boolean>;
}

/**
 * Sauvegarde une préférence localement et la synchronise avec l'API.
 */
export async function setNotifPref(key: NotifPrefKey, enabled: boolean): Promise<void> {
  await authStorage.setRaw(key, enabled ? 'true' : 'false');
  try {
    await apiClient.post('/api/notifications/preferences', { key, enabled });
  } catch {
    // Silencieux — la préférence est sauvée localement même si l'API échoue
  }
}

/**
 * Réinitialise le badge de l'app iOS à 0.
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
