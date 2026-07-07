/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import PresenceVerificationPage from '../PresenceVerificationPage';
import { getAllZones } from '../../../services/zone.service';
import { verifyPresence } from '../../../services/participation.service';
import { useAuth } from '../../../contexts/AuthContext';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

jest.mock('../../../services/zone.service');
jest.mock('../../../services/participation.service');
jest.mock('../../../contexts/AuthContext');
jest.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android' },
}));
jest.mock('@capacitor-mlkit/barcode-scanning', () => ({
  BarcodeFormat: { QrCode: 'QR_CODE' },
  BarcodeScanner: {
    isSupported: jest.fn(),
    requestPermissions: jest.fn(),
    scan: jest.fn(),
  },
}));

describe('PresenceVerificationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: { role: 'ADMIN' } });
    (getAllZones as jest.Mock).mockResolvedValue([
      {
        id: 7,
        event_id: 1,
        name: 'Entrée principale',
        capacity: 100,
        created_at: '2026-07-07T10:00:00Z',
      },
    ]);
    (BarcodeScanner.isSupported as jest.Mock).mockResolvedValue({ supported: true });
    (BarcodeScanner.requestPermissions as jest.Mock).mockResolvedValue({ camera: 'granted' });
    (BarcodeScanner.scan as jest.Mock).mockResolvedValue({
      barcodes: [{ rawValue: 'signed-qr-token' }],
    });
    (verifyPresence as jest.Mock).mockResolvedValue({
      authorized: true,
      is_valid: true,
      participant: {
        id: 12,
        fullName: 'Camille Martin',
        email: 'camille@example.com',
        avatarUrl: null,
      },
      event: { id: 1, name: 'Conférence annuelle' },
      zone: { id: 7, name: 'Entrée principale' },
      scanned_at: '2026-07-07T12:00:00Z',
    });
  });

  it('attend la confirmation de l’administrateur et conserve le résultat jusqu’au prochain scan', async () => {
    render(<PresenceVerificationPage />);

    const zoneSelect = await screen.findByLabelText('Zone');
    fireEvent.change(zoneSelect, { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Scanner caméra' }));

    expect(await screen.findByText('QR code détecté')).toBeInTheDocument();
    expect(screen.getByDisplayValue('signed-qr-token')).toBeInTheDocument();
    expect(verifyPresence).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et valider la présence' }));

    await waitFor(() => {
      expect(verifyPresence).toHaveBeenCalledWith('signed-qr-token', 7);
    });
    expect(await screen.findByText('Accès autorisé')).toBeInTheDocument();
    expect(screen.getByText('Camille Martin')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Scanner un autre QR code' }));

    expect(screen.queryByText('Accès autorisé')).not.toBeInTheDocument();
    expect(screen.getByText('En attente d’un scan')).toBeInTheDocument();
  });
});
