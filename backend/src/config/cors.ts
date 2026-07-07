const DEFAULT_ORIGIN = 'http://localhost:3000';

export function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || DEFAULT_ORIGIN;

  return configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
