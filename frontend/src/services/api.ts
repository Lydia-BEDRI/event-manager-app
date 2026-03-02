const BASE_URL = 'http://localhost:5000/api';

export const api = {
  get: async <T>(endpoint: string, token?: string): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur API');
    }

    return response.json();
  },

  post: async <T>(endpoint: string, body: unknown, token?: string): Promise<T> => { // ← Changé ici
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur API');
    }

    return response.json();
  },

  put: async <T>(endpoint: string, body: unknown, token?: string): Promise<T> => { // ← Changé ici
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur API');
    }

    return response.json();
  },

  patch: async <T>(endpoint: string, body: unknown, token?: string): Promise<T> => { // ← Changé ici
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur API');
    }

    return response.json();
  },

  delete: async <T>(endpoint: string, token?: string): Promise<T> => {
    console.log('API DELETE appelé:', endpoint);
    console.log('Token fourni:', token ? 'Oui' : 'Non');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    console.log('Headers envoyés:', headers);
    const url = `${BASE_URL}${endpoint}`;
    console.log('URL complète:', url);

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    console.log('Statut de la réponse:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('Erreur API:', error);
      throw new Error(error.message || 'Erreur API');
    }

    const result = await response.json();
    console.log('Réponse API:', result);
    return result;
  },
};