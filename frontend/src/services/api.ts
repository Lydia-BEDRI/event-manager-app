export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const AUTH_TOKEN_REFRESHED_EVENT = "auth:token-refreshed";
export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type SocketLike = {
  auth?: any;
  connected?: boolean;
  connect?: () => void;
  disconnect: () => void;
};

const AUTH_REFRESH_ENDPOINT = "/auth/refresh";
const AUTH_EXCLUDED_ENDPOINTS = [
  "/auth/login",
  "/auth/2fa/login/verify",
  "/auth/register",
  AUTH_REFRESH_ENDPOINT,
  "/auth/forgot-password",
  "/auth/reset-password",
];

let refreshPromise: Promise<string> | null = null;
const sockets = new Set<SocketLike>();

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = "Erreur API";
  let code: string | undefined;

  try {
    const data = await response.json();
    if (typeof data?.error === "string") {
      message = data.error;
    } else if (typeof data?.message === "string") {
      message = data.message;
    }
    code = typeof data?.code === "string" ? data.code : undefined;
  } catch {
    message = response.statusText || "Erreur API";
  }

  return new ApiError(message, response.status, code);
}

function authHeader(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function shouldRefresh(endpoint: string, retry: boolean): boolean {
  if (retry) {
    return false;
  }

  return !AUTH_EXCLUDED_ENDPOINTS.some((excludedEndpoint) =>
    endpoint.startsWith(excludedEndpoint),
  );
}

function notifyTokenRefreshed(accessToken: string) {
  window.dispatchEvent(
    new CustomEvent(AUTH_TOKEN_REFRESHED_EVENT, { detail: { accessToken } }),
  );
}

function expireSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  sockets.forEach((socket) => socket.disconnect());
  sockets.clear();
  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, {
      detail: { message: "Votre session a expiré. Veuillez vous reconnecter." },
    }),
  );
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    expireSession();
    throw new ApiError("Votre session a expiré. Veuillez vous reconnecter.", 401);
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}${AUTH_REFRESH_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await toApiError(response);
        }
        const data = await response.json();
        if (typeof data?.accessToken !== "string") {
          throw new ApiError("Réponse de rafraîchissement invalide.", 500);
        }
        localStorage.setItem("accessToken", data.accessToken);
        sockets.forEach((socket) => {
          socket.auth = { ...(socket.auth || {}), token: data.accessToken };
          if (socket.connected && socket.connect) {
            socket.disconnect();
            socket.connect();
          }
        });
        notifyTokenRefreshed(data.accessToken);
        return data.accessToken;
      })
      .catch((error) => {
        expireSession();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

async function request<T>(
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  token?: string,
  retry = false,
): Promise<T> {
  const effectiveToken = token || localStorage.getItem("accessToken") || undefined;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader(effectiveToken),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (response.status === 401 && shouldRefresh(endpoint, retry)) {
    const newAccessToken = await refreshAccessToken();
    return request<T>(method, endpoint, body, newAccessToken, true);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  return response.json();
}

export async function apiFetch(
  endpoint: string,
  init: RequestInit = {},
  retry = false,
): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem("accessToken");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && shouldRefresh(endpoint, retry)) {
    const newAccessToken = await refreshAccessToken();
    headers.set("Authorization", `Bearer ${newAccessToken}`);
    return apiFetch(endpoint, { ...init, headers }, true);
  }

  return response;
}

export async function apiBlob(endpoint: string, token?: string, retry = false): Promise<Blob> {
  const effectiveToken = token || localStorage.getItem("accessToken") || undefined;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: authHeader(effectiveToken),
  });

  if (response.status === 401 && shouldRefresh(endpoint, retry)) {
    const newAccessToken = await refreshAccessToken();
    return apiBlob(endpoint, newAccessToken, true);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(text || "Erreur lors de l'export.", response.status);
  }

  return response.blob();
}

export function registerSocket(socket: SocketLike): () => void {
  sockets.add(socket);
  const token = localStorage.getItem("accessToken");
  if (token) {
    socket.auth = { ...(socket.auth || {}), token };
  }
  return () => {
    sockets.delete(socket);
  };
}

export const api = {
  get: async <T>(endpoint: string, token?: string): Promise<T> => {
    return request<T>("GET", endpoint, undefined, token);
  },

  post: async <T>(
    endpoint: string,
    body: unknown,
    token?: string,
  ): Promise<T> => {
    return request<T>("POST", endpoint, body, token);
  },

  put: async <T>(
    endpoint: string,
    body: unknown,
    token?: string,
  ): Promise<T> => {
    return request<T>("PUT", endpoint, body, token);
  },

  patch: async <T>(
    endpoint: string,
    body: unknown,
    token?: string,
  ): Promise<T> => {
    return request<T>("PATCH", endpoint, body, token);
  },

  delete: async <T>(endpoint: string, token?: string): Promise<T> => {
    return request<T>("DELETE", endpoint, undefined, token);
  },
};
