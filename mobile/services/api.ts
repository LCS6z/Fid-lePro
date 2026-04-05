import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Erreur serveur');
  }
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  client: {
    id: string;
    nom: string;
    email: string;
    telephone?: string;
    qrCode: string;
  };
}

export interface RegisterPayload {
  nom: string;
  email: string;
  password: string;
  telephone: string;
  dateNaissance: string;
}

export const authAPI = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/connexion/client', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: RegisterPayload) =>
    request<LoginResponse>('/api/auth/inscription/client', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── Client ──────────────────────────────────────────────────────────────────

export interface Profil {
  id: string;
  nom: string;
  email: string;
  telephone?: string;
  dateNaissance?: string;
  qrCode: string;
  createdAt: string;
}

export interface Tampon {
  id: string;
  carteId: string;
  createdAt: string;
  carte: {
    id: string;
    nom: string;
    maxTampons: number;
    recompense: string;
    commercant: { id: string; nom: string };
  };
}

export interface Progression {
  carteId: string;
  nomCarte: string;
  commercant: string;
  commercantId: string;
  type: string;
  maxTampons: number;
  tamponsActuels: number;
  recompense: string;
  pourcentage: number;
}

export interface Avis {
  id: string;
  note: number;
  commentaire: string;
  createdAt: string;
  client: { nom: string };
}

export const clientAPI = {
  getProfil: () => request<Profil>('/api/client/profil'),

  getTampons: () => request<Tampon[]>('/api/client/tampons'),

  getProgression: () => request<Progression[]>('/api/client/progression'),

  getCommercant: (id: string) =>
    request<{ id: string; nom: string; adresse?: string; lienGoogle?: string }>(
      `/api/client/commercant/${id}`
    ),

  submitAvis: (commercantId: string, note: number, commentaire: string) =>
    request('/api/client/avis', {
      method: 'POST',
      body: JSON.stringify({ commercantId, note, commentaire }),
    }),

  getAvis: (commercantId: string) =>
    request<Avis[]>(`/api/client/avis/${commercantId}`),

  updateFcmToken: (fcmToken: string) =>
    request('/api/client/fcm-token', {
      method: 'POST',
      body: JSON.stringify({ fcmToken }),
    }),
};
