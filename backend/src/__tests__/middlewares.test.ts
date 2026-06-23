import { Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { generateAccessToken } from '../utils/jwt';

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
    const payload = { userId: 1, email: 'test@test.com', role: 'PARTICIPANT' };
    const token = generateAccessToken(payload);
    mockReq.headers = { authorization: `Bearer ${token}` };

    authenticate(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user!.userId).toBe(1);
    expect(mockReq.user!.role).toBe('PARTICIPANT');
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
    mockReq = { user: { userId: 1, email: 'test@test.com', role: 'PARTICIPANT' } };
    const middleware = authorize('ADMIN');
    middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(statusMock).toHaveBeenCalledWith(403);
  });

  it('accepte si le rôle correspond', () => {
    mockReq = { user: { userId: 1, email: 'admin@test.com', role: 'ADMIN' } };
    const middleware = authorize('ADMIN');
    middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('accepte avec plusieurs rôles autorisés', () => {
    mockReq = { user: { userId: 1, email: 'scanner@test.com', role: 'SCANNER' } };
    const middleware = authorize('ADMIN', 'SCANNER');
    middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
