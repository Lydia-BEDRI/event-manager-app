import { Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { requireFreshPassword } from '../middlewares/requireFreshPassword';
import { generateAccessToken } from '../utils/jwt';
import pool from '../config/database';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Middleware authenticate', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = { headers: {} };
    mockRes = { status: statusMock, json: jsonMock } as any;
    mockNext = jest.fn();
  });

  it('rejette une requête sans header Authorization', () => {
    authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('rejette un header Authorization mal formé', () => {
    mockReq.headers = { authorization: 'InvalidFormat' };
    authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it('rejette un token invalide', () => {
    mockReq.headers = { authorization: 'Bearer invalid.token.value' };
    authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it('accepte un token valide et attache le user', () => {
    const payload = { userId: 1, role: 'PARTICIPANT' };
    const token = generateAccessToken(payload);
    mockReq.headers = { authorization: `Bearer ${token}` };

    authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user!.userId).toBe(1);
    expect(mockReq.user!.role).toBe('PARTICIPANT');
  });
});

describe('Middleware requireFreshPassword', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = { user: { userId: 1, role: 'PARTICIPANT' } };
    mockRes = { status: statusMock, json: jsonMock } as any;
    mockNext = jest.fn();
  });

  function daysAgo(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  it('accepte un mot de passe modifié il y a 59 jours', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([[{
      id: 1,
      is_active: true,
      password_updated_at: daysAgo(59),
    }]]);

    await requireFreshPassword(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('refuse un mot de passe modifié exactement il y a 60 jours', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([[{
      id: 1,
      is_active: true,
      password_updated_at: daysAgo(60),
    }]]);

    await requireFreshPassword(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ code: 'PASSWORD_EXPIRED' }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('refuse un mot de passe modifié il y a 61 jours', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([[{
      id: 1,
      is_active: true,
      password_updated_at: daysAgo(61),
    }]]);

    await requireFreshPassword(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ code: 'PASSWORD_EXPIRED' }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('refuse un compte désactivé', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce([[{
      id: 1,
      is_active: false,
      password_updated_at: daysAgo(1),
    }]]);

    await requireFreshPassword(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ code: 'ACCOUNT_INACTIVE' }));
    expect(mockNext).not.toHaveBeenCalled();
  });
});

describe('Middleware authorize', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock } as any;
    mockNext = jest.fn();
  });

  it('rejette si pas de user sur la requête', () => {
    mockReq = {};
    const middleware = authorize('ADMIN');
    middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it('rejette si le rôle ne correspond pas', () => {
    mockReq = { user: { userId: 1, role: 'PARTICIPANT' } };
    const middleware = authorize('ADMIN');
    middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(403);
  });

  it('accepte si le rôle correspond', () => {
    mockReq = { user: { userId: 1, role: 'ADMIN' } };
    const middleware = authorize('ADMIN');
    middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('accepte avec plusieurs rôles autorisés', () => {
    mockReq = { user: { userId: 1, role: 'SCANNER' } };
    const middleware = authorize('ADMIN', 'SCANNER');
    middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
