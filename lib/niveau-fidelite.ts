import type { NiveauFidelite } from './types';

const NIVEAUX = [
  { min: 0,  max: 9,   label: 'Nouveau',   emoji: '🌱', couleur: '#95a5a6' },
  { min: 10, max: 29,  label: 'Bronze',    emoji: '🥉', couleur: '#cd7f32' },
  { min: 30, max: 99,  label: 'Argent',    emoji: '🥈', couleur: '#aaa9ad' },
  { min: 100, max: Infinity, label: 'Or', emoji: '🥇', couleur: '#f39c12' },
];

export function getNiveauFidelite(totalTampons: number): NiveauFidelite {
  const idx = NIVEAUX.findIndex(n => totalTampons >= n.min && totalTampons <= n.max);
  const niveau = NIVEAUX[idx];
  const suivant = NIVEAUX[idx + 1] ?? null;

  return {
    label: niveau.label,
    emoji: niveau.emoji,
    couleur: niveau.couleur,
    prochainNiveau: suivant ? suivant.label : null,
    tamponsRestants: suivant ? suivant.min - totalTampons : null,
  };
}
