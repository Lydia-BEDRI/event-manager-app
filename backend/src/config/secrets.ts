import fs from 'fs';

export function readSecretFromFile(envVarName: string): string | undefined {
  const filePath = process.env[envVarName];

  if (!filePath) {
    return undefined;
  }

  try {
    return fs.readFileSync(filePath, 'utf8').trim();
  } catch (error) {
    console.warn(`Unable to read secret file for ${envVarName}:`, error);
    return undefined;
  }
}
