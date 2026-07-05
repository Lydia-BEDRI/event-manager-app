export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = "Erreur API";

  try {
    const data = await response.json();
    if (typeof data?.error === "string") {
      message = data.error;
    } else if (typeof data?.message === "string") {
      message = data.message;
    }
  } catch {
    message = response.statusText || "Erreur API";
  }

  return new ApiError(message, response.status);
}

export const api = {
  get: async <T>(endpoint: string, token?: string): Promise<T> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    return response.json();
  },

  post: async <T>(
    endpoint: string,
    body: unknown,
    token?: string,
  ): Promise<T> => {
    // ← Changé ici
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    return response.json();
  },

  put: async <T>(
    endpoint: string,
    body: unknown,
    token?: string,
  ): Promise<T> => {
    // ← Changé ici
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    return response.json();
  },

  patch: async <T>(
    endpoint: string,
    body: unknown,
    token?: string,
  ): Promise<T> => {
    // ← Changé ici
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    return response.json();
  },

  delete: async <T>(endpoint: string, token?: string): Promise<T> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    return response.json();
  },
};
