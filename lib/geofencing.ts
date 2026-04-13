import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { apiClient } from '@/lib/api';

export const GEOFENCE_TASK = 'FIDELEPRO_GEOFENCE';
const RAYON_METRES = 1000; // 1km

type GeofenceData = {
  eventType: Location.GeofencingEventType;
  region: Location.LocationRegion;
};

/**
 * Définit la tâche background (doit être appelé au top-level du module,
 * avant tout rendu React — placé dans lib/ pour être importé dans _layout.tsx).
 */
TaskManager.defineTask(GEOFENCE_TASK, ({ data, error }: TaskManager.TaskManagerTaskBody<GeofenceData>) => {
  if (error) {
    if (__DEV__) console.warn('[Geofence] Erreur tâche:', error.message);
    return;
  }

  const { eventType, region } = data;

  if (eventType === Location.GeofencingEventType.Enter) {
    const nomCommerce = region.identifier?.split('|')[1] ?? 'un commerce partenaire';
    if (__DEV__) console.log('[Geofence] Entrée dans zone:', nomCommerce);

    Notifications.scheduleNotificationAsync({
      content: {
        title: '📍 Commerce à proximité !',
        body: `Vous êtes près de ${nomCommerce} — profitez-en pour accumuler vos tampons !`,
        data: { screen: 'dashboard-client', type: 'proximite' },
        sound: true,
      },
      trigger: null, // immédiat
    }).catch(() => {});
  }
});

/**
 * Demande la permission de localisation "Always" (background).
 * Retourne true si accordée.
 */
async function demanderPermission(): Promise<boolean> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return false;

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  return bg === 'granted';
}

/**
 * Récupère les commercants géolocalisés depuis l'API et démarre le géofencing.
 * Appelé après connexion du client.
 */
export async function demarrerGeofencing(): Promise<void> {
  try {
    const permOk = await demanderPermission();
    if (!permOk) {
      if (__DEV__) console.log('[Geofence] Permission refusée — géofencing désactivé');
      return;
    }

    const res = await apiClient.get<{ commercants: { id: string; nom: string; latitude: number; longitude: number }[] }>(
      '/api/client/commercants-geo'
    );
    const { commercants } = res.data;

    if (commercants.length === 0) {
      if (__DEV__) console.log('[Geofence] Aucun commerce géolocalisé');
      return;
    }

    const regions: Location.LocationRegion[] = commercants.map(c => ({
      identifier: `${c.id}|${c.nom}`, // id|nom pour récupérer le nom dans la tâche
      latitude: c.latitude,
      longitude: c.longitude,
      radius: RAYON_METRES,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

    // Arrêter d'abord si déjà actif (evite doublons)
    const dejaDemarre = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false);
    if (dejaDemarre) await Location.stopGeofencingAsync(GEOFENCE_TASK).catch(() => {});

    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
    if (__DEV__) console.log(`[Geofence] Démarré — ${regions.length} zone(s) surveillée(s)`);
  } catch (e: unknown) {
    if (__DEV__) console.warn('[Geofence] Erreur démarrage:', e);
  }
}

/**
 * Arrête le géofencing (appelé à la déconnexion).
 */
export async function arreterGeofencing(): Promise<void> {
  try {
    const actif = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false);
    if (actif) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    if (__DEV__) console.log('[Geofence] Arrêté');
  } catch (e: unknown) {
    if (__DEV__) console.warn('[Geofence] Erreur arrêt:', e);
  }
}
