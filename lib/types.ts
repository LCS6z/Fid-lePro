/**
 * Interfaces TypeScript pour les réponses API FidèlePro.
 * Centralise les types partagés entre les screens et les services.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthResponse = {
  token: string;
  statut?: 'actif' | 'inactif' | 'suspendu' | 'résilié' | 'impayé';
};

// ─── Client ──────────────────────────────────────────────────────────────────

export type ClientProfil = {
  nom: string;
  qrCode: string;
};

export type TamponCommercant = {
  nom: string;
  id?: string;
};

export type Tampon = {
  carteId: string;
  carteName: string;
  commercant?: TamponCommercant;
  nombreTampons: number;
  maxTampons: number;
  recompense?: number | null;
};

export type CommercantInfo = {
  lienGoogle?: string | null;
};

// ─── Commerçant ──────────────────────────────────────────────────────────────

export type ClientCommercant = {
  nom: string;
  email: string;
  totalTampons: number;
  derniereScan: string | null;
};

export type ScanResult = {
  client?: { nom: string };
  totalTampons: number;
  recompense?: string | null;
};

// ─── Stripe ──────────────────────────────────────────────────────────────────

export type InscriptionCommercantResponse = {
  checkoutUrl: string;
};
