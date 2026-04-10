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

export type ClientRecompense = {
  clientId: string;
  nom: string;
  email: string;
  carteId: string;
  carteName: string;
  recompense: number | null;
};

export type StatsCourbe = {
  date: string;
  scans: number;
  clients: number;
};

export type StatsAvancees = {
  courbe30j: StatsCourbe[];
  recap: {
    scansMois: number;
    clientsUniques30j: number;
    recompensesMois: number;
    totalScans: number;
  };
};

export type ScanResult = {
  client?: { nom: string };
  totalTampons: number;
  recompense?: string | null;
};

// ─── Partenaires ─────────────────────────────────────────────────────────────

export type Partenaire = {
  id: string;
  nom: string;
  categorie: string | null;
  description: string | null;
  adresse: string | null;
  telephone: string | null;
  lienGoogle: string | null;
  horaires: string | null;
};

export type CategoriePartenaires = {
  nom: string;
  commerces: Partenaire[];
};

// ─── Récompenses ─────────────────────────────────────────────────────────────

export type RecompenseValidee = {
  id: string;
  createdAt: string;
  carte: {
    nom: string;
    recompense: number | null;
    commercant: { nom: string };
  };
};

export type NiveauFidelite = {
  label: string;
  emoji: string;
  couleur: string;
  prochainNiveau: string | null;
  tamponsRestants: number | null;
};

// ─── Stripe ──────────────────────────────────────────────────────────────────

export type InscriptionCommercantResponse = {
  checkoutUrl: string;
};
