process.env.QR_CODE_PRIVATE_KEY = 'test-access-qr-private-key';

import pool from '../config/database';
import { generateSignedAccessQr } from '../services/access-qr.service';
import { verifyAccessScan } from '../services/access-control.service';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
    getConnection: jest.fn(),
  },
}));

describe('Access control service', () => {
  let connection: {
    beginTransaction: jest.Mock;
    commit: jest.Mock;
    rollback: jest.Mock;
    release: jest.Mock;
    query: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    connection = {
      beginTransaction: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      release: jest.fn(),
      query: jest.fn(),
    };
    (pool.getConnection as jest.Mock).mockResolvedValue(connection);
  });

  const participationRow = {
    id: 1,
    user_id: 3,
    event_id: 10,
    status: 'APPROVED',
    first_name: 'Charlie',
    last_name: 'Durand',
    email: 'charlie@test.local',
    avatar_url: null,
    event_name: 'Conference Tech',
    event_status: 'PUBLISHED',
    event_start_date: new Date('2000-01-01T00:00:00.000Z'),
    event_end_date: new Date('2100-01-01T00:00:00.000Z'),
  };

  const zoneRow = {
    id: 5,
    name: 'Hall Principal',
    event_id: 10,
  };

  const makeToken = async () => {
    const generated = await generateSignedAccessQr({
      id: 1,
      user_id: 3,
      event_id: 10,
    });
    return generated.token;
  };

  it('accepte un scan valide et cree un access_log valide', async () => {
    connection.query
      .mockResolvedValueOnce([[participationRow]])
      .mockResolvedValueOnce([[zoneRow]])
      .mockResolvedValueOnce([{ insertId: 50 }]);

    const result = await verifyAccessScan({
      token: await makeToken(),
      zoneId: 5,
      scannedBy: 1,
      ipAddress: '127.0.0.1',
    });

    expect(result.authorized).toBe(true);
    expect(result.statusCode).toBe(201);
    expect(result.participant_name).toBe('Charlie Durand');
    expect(connection.query).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO access_logs'),
      [1, 5, 1, '127.0.0.1'],
    );
    expect(connection.commit).toHaveBeenCalled();
  });

  it('refuse un scan avec signature invalide et journalise le refus', async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce([[{ id: 5 }]])
      .mockResolvedValueOnce([{ insertId: 51 }]);

    const result = await verifyAccessScan({
      token: 'invalid.jwt.token',
      zoneId: 5,
      scannedBy: 1,
    });

    expect(result.authorized).toBe(false);
    expect(result.statusCode).toBe(401);
    expect(pool.query).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO access_logs'),
      [null, 5, 1, 'QR invalide ou signature incorrecte', null],
    );
  });

  it('accepte plusieurs scans dans la meme zone et journalise chacun', async () => {
    connection.query
      .mockResolvedValueOnce([[participationRow]])
      .mockResolvedValueOnce([[zoneRow]])
      .mockResolvedValueOnce([{ insertId: 52 }]);

    const result = await verifyAccessScan({
      token: await makeToken(),
      zoneId: 5,
      scannedBy: 1,
    });

    expect(result.authorized).toBe(true);
    expect(result.statusCode).toBe(201);
    expect(result.id).toBe(52);
  });

  it('autorise une zone de l evenement sans attribution zone_access', async () => {
    connection.query
      .mockResolvedValueOnce([[participationRow]])
      .mockResolvedValueOnce([[zoneRow]])
      .mockResolvedValueOnce([{ insertId: 53 }]);

    const result = await verifyAccessScan({
      token: await makeToken(),
      zoneId: 5,
      scannedBy: 1,
    });

    expect(result.authorized).toBe(true);
    expect(result.statusCode).toBe(201);
  });

  it('refuse une zone qui ne correspond pas a l evenement du QR', async () => {
    connection.query
      .mockResolvedValueOnce([[participationRow]])
      .mockResolvedValueOnce([[{ ...zoneRow, event_id: 11 }]])
      .mockResolvedValueOnce([{ insertId: 54 }]);

    const result = await verifyAccessScan({
      token: await makeToken(),
      zoneId: 5,
      scannedBy: 1,
    });

    expect(result.authorized).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(result.reason).toBe('Zone invalide pour cet evenement');
  });

  it.each(['REJECTED', 'REVOKED', 'REFUSED'])('refuse une participation %s', async (status) => {
    connection.query
      .mockResolvedValueOnce([[{ ...participationRow, status }]])
      .mockResolvedValueOnce([{ insertId: 55 }]);

    const result = await verifyAccessScan({
      token: await makeToken(),
      zoneId: 5,
      scannedBy: 1,
    });

    expect(result.authorized).toBe(false);
    expect(result.statusCode).toBe(403);
    expect(result.reason).toBe('Participation non approuvee');
  });

  it.each(['DRAFT', 'COMPLETED', 'CANCELLED'])('refuse un evenement %s', async (eventStatus) => {
    connection.query
      .mockResolvedValueOnce([[{ ...participationRow, event_status: eventStatus }]])
      .mockResolvedValueOnce([{ insertId: 56 }]);

    const result = await verifyAccessScan({
      token: await makeToken(),
      zoneId: 5,
      scannedBy: 1,
    });

    expect(result.authorized).toBe(false);
    expect(result.reason).toBe('Evenement non accessible');
  });

  it('refuse un scan en dehors des dates de l evenement', async () => {
    connection.query
      .mockResolvedValueOnce([[
        {
          ...participationRow,
          event_start_date: new Date('2000-01-01T00:00:00.000Z'),
          event_end_date: new Date('2000-01-02T00:00:00.000Z'),
        },
      ]])
      .mockResolvedValueOnce([{ insertId: 57 }]);

    const result = await verifyAccessScan({
      token: await makeToken(),
      zoneId: 5,
      scannedBy: 1,
    });

    expect(result.authorized).toBe(false);
    expect(result.reason).toBe('Evenement hors de sa periode d acces');
  });
});
