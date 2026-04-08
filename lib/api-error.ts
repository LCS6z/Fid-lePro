/**
 * Extrait le message d'erreur d'une réponse Axios.
 * Évite les cast `err: any` dans les catch.
 */
export function getApiMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object'
  ) {
    const data = err.response.data as Record<string, unknown>;
    // Certaines routes utilisent `message`, d'autres `erreur`
    if (typeof data.message === 'string') return data.message;
    if (typeof data.erreur === 'string') return data.erreur;
  }
  return fallback;
}

/**
 * Extrait le statut d'une erreur Axios (ex: 'inactif', 'suspendu').
 */
export function getApiStatus(err: unknown): string | undefined {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object' &&
    'statut' in err.response.data
  ) {
    const statut = (err.response.data as Record<string, unknown>).statut;
    return typeof statut === 'string' ? statut : undefined;
  }
  return undefined;
}
