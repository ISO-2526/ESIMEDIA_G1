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
    },
    Keyboard: {
      resize: 'body', // Esto hace que la web se encoja al salir el teclado
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
