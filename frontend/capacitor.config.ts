import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.esimedia.mobile',
  appName: 'Esimedia Mobile',
  webDir: 'build',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
