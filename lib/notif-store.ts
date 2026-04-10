import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'notifs_inbox';
const MAX = 50;

export type NotifItem = {
  id: string;
  title: string;
  body: string;
  receivedAt: string;
  lu: boolean;
};

export const notifStore = {
  async getAll(): Promise<NotifItem[]> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async ajouter(title: string, body: string): Promise<void> {
    try {
      const existing = await notifStore.getAll();
      const item: NotifItem = {
        id: Date.now().toString(),
        title: title || 'FidèlePro',
        body: body || '',
        receivedAt: new Date().toISOString(),
        lu: false,
      };
      const updated = [item, ...existing].slice(0, MAX);
      await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    } catch {}
  },

  async marquerLues(): Promise<void> {
    try {
      const existing = await notifStore.getAll();
      const updated = existing.map(n => ({ ...n, lu: true }));
      await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    } catch {}
  },

  async getNbNonLues(): Promise<number> {
    const all = await notifStore.getAll();
    return all.filter(n => !n.lu).length;
  },

  async vider(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  },
};
