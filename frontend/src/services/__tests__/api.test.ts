import {
  api,
  ApiError,
  AUTH_SESSION_EXPIRED_EVENT,
  AUTH_TOKEN_REFRESHED_EVENT,
} from '../api';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('api refresh token handling', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('utilise directement un access token valide', async () => {
    localStorage.setItem('accessToken', 'valid-access-token');
    fetchMock.mockResolvedValueOnce(jsonResponse({ events: [] }));

    await expect(api.get('/events')).resolves.toEqual({ events: [] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      'Bearer valid-access-token',
    );
  });

  it('rafraîchit un access token expiré puis rejoue la requête initiale', async () => {
    localStorage.setItem('accessToken', 'expired-access-token');
    const refreshed = jest.fn();
    window.addEventListener(AUTH_TOKEN_REFRESHED_EVENT, refreshed);

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Token expiré.' }, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'new-access-token' }))
      .mockResolvedValueOnce(jsonResponse({ events: ['ok'] }));

    await expect(api.get('/events')).resolves.toEqual({ events: ['ok'] });

    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:5000/api/auth/refresh');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      credentials: 'include',
    });
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(
      'Bearer new-access-token',
    );
    expect(refreshed).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_TOKEN_REFRESHED_EVENT, refreshed);
  });

  it('supprime les tokens et signale la session expirée si le refresh est invalide', async () => {
    localStorage.setItem('accessToken', 'expired-access-token');
    const expired = jest.fn();
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, expired);

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Token expiré.' }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: 'Refresh token invalide.' }, 401));

    await expect(api.get('/events')).rejects.toBeInstanceOf(ApiError);

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(expired).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, expired);
  });

  it('ne lance qu’un refresh pour plusieurs 401 simultanés', async () => {
    localStorage.setItem('accessToken', 'expired-access-token');
    let resolveRefresh: (response: Response) => void = () => undefined;
    const refreshResponse = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Token expiré.' }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: 'Token expiré.' }, 401))
      .mockReturnValueOnce(refreshResponse)
      .mockResolvedValueOnce(jsonResponse({ first: true }))
      .mockResolvedValueOnce(jsonResponse({ second: true }));

    const firstRequest = api.get('/events');
    const secondRequest = api.get('/zones');
    await Promise.resolve();
    resolveRefresh(jsonResponse({ accessToken: 'new-access-token' }));

    await expect(Promise.all([firstRequest, secondRequest])).resolves.toEqual([
      { first: true },
      { second: true },
    ]);

    const refreshCalls = fetchMock.mock.calls.filter(
      ([url]) => url === 'http://localhost:5000/api/auth/refresh',
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it('rejoue la requête initiale une seule fois', async () => {
    localStorage.setItem('accessToken', 'expired-access-token');

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Token expiré.' }, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'new-access-token' }))
      .mockResolvedValueOnce(jsonResponse({ events: [] }));

    await api.get('/events');

    const eventCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith('/events'),
    );
    expect(eventCalls).toHaveLength(2);
  });

  it('évite une boucle infinie si la requête rejouée retourne encore 401', async () => {
    localStorage.setItem('accessToken', 'expired-access-token');

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Token expiré.' }, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'new-access-token' }))
      .mockResolvedValueOnce(jsonResponse({ error: 'Toujours expiré.' }, 401));

    await expect(api.get('/events')).rejects.toMatchObject({ status: 401 });

    const refreshCalls = fetchMock.mock.calls.filter(
      ([url]) => url === 'http://localhost:5000/api/auth/refresh',
    );
    expect(refreshCalls).toHaveLength(1);
  });
});
