import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.eventmanager.kiosk',
  appName: 'EventManager Kiosk',
  webDir: 'build',
  server: {
    androidScheme: 'http'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
