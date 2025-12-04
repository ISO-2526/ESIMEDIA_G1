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
      enabled: false  // ✅ Deshabilitar para que use XMLHttpRequest nativo (maneja cookies)
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
