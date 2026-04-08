import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Supprime les console.error React liés aux crashs volontaires en test
const originalError = console.error.bind(console);
beforeAll(() => {
  console.error = (msg: unknown, ...args: unknown[]) => {
    if (typeof msg === 'string' && msg.includes('The above error occurred')) return;
    if (typeof msg === 'string' && msg.includes('ErrorBoundary')) return;
    originalError(msg, ...args);
  };
});
afterAll(() => { console.error = originalError; });

// Variable module-level : reste true pendant tout le cycle de rendu initial de React
let shouldCrash = true;
function ControlledCrash() {
  if (shouldCrash) throw new Error('Crash de test');
  return <>{null}</>;
}

function SafeChild() {
  return <>{null}</>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => { shouldCrash = true; });

  it('affiche les enfants normalement si aucune erreur', () => {
    shouldCrash = false;
    render(
      <ErrorBoundary>
        <SafeChild />
      </ErrorBoundary>
    );
    expect(screen.queryByText('Une erreur est survenue')).toBeNull();
  });

  it('affiche l écran d erreur si un enfant crash', () => {
    shouldCrash = true;
    render(
      <ErrorBoundary>
        <ControlledCrash />
      </ErrorBoundary>
    );
    expect(screen.getByText('Une erreur est survenue')).toBeTruthy();
    expect(screen.getByText('Réessayer')).toBeTruthy();
  });

  it('affiche le fallback custom si fourni', () => {
    shouldCrash = true;
    const Fallback = () => <>{null}</>;
    render(
      <ErrorBoundary fallback={<Fallback />}>
        <ControlledCrash />
      </ErrorBoundary>
    );
    expect(screen.queryByText('Une erreur est survenue')).toBeNull();
  });

  it('réessaye et réaffiche les enfants après Réessayer', () => {
    shouldCrash = true;
    render(
      <ErrorBoundary>
        <ControlledCrash />
      </ErrorBoundary>
    );
    expect(screen.getByText('Réessayer')).toBeTruthy();

    // On désactive le crash avant d'appuyer sur Réessayer
    shouldCrash = false;
    fireEvent.press(screen.getByText('Réessayer'));
    expect(screen.queryByText('Une erreur est survenue')).toBeNull();
  });
});
