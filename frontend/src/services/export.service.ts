import { apiBlob } from './api';

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  eventId?: string;
  zoneId?: string;
  role?: string;
}

const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const buildQueryParams = (filters: ExportFilters): string => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.append(key, value);
    }
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const fetchBlob = async (endpoint: string): Promise<Blob> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.');
  }

  return apiBlob(endpoint, token);
};

export const exportService = {
  async exportEvents(filters: ExportFilters = {}): Promise<void> {
    const queryParams = buildQueryParams(filters);
    const blob = await fetchBlob(`/export/events${queryParams}`);
    downloadFile(blob, `events_${Date.now()}.csv`);
  },

  async exportParticipations(filters: ExportFilters = {}): Promise<void> {
    const queryParams = buildQueryParams(filters);
    const blob = await fetchBlob(`/export/participations${queryParams}`);
    downloadFile(blob, `participations_${Date.now()}.csv`);
  },

  async exportAccessLogs(filters: ExportFilters = {}): Promise<void> {
    const queryParams = buildQueryParams(filters);
    const blob = await fetchBlob(`/export/access-logs${queryParams}`);
    downloadFile(blob, `access_logs_${Date.now()}.csv`);
  },

  async exportUsers(filters: ExportFilters = {}): Promise<void> {
    const queryParams = buildQueryParams(filters);
    const blob = await fetchBlob(`/export/users${queryParams}`);
    downloadFile(blob, `users_${Date.now()}.csv`);
  },

  async exportZones(filters: ExportFilters = {}): Promise<void> {
    const queryParams = buildQueryParams(filters);
    const blob = await fetchBlob(`/export/zones${queryParams}`);
    downloadFile(blob, `zones_${Date.now()}.csv`);
  },

  async exportStatistics(): Promise<void> {
    const blob = await fetchBlob('/export/statistics');
    downloadFile(blob, `statistics_${Date.now()}.csv`);
  },

  async exportComplete(filters: ExportFilters = {}): Promise<void> {
    const queryParams = buildQueryParams(filters);
    const blob = await fetchBlob(`/export/complete${queryParams}`);
    downloadFile(blob, `export_complet_${Date.now()}.csv`);
  }
};
