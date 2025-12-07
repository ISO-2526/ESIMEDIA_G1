import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.esimedia.mobile',
  appName: 'ESIMEDIA',
  webDir: 'build',
  
  // ⚡ ANDROID ONLY - No iOS support
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  
  server: {
    androidScheme: 'http',
    cleartext: true,
    hostname: '10.0.2.2',
    androidSchemeHttp: true
  },
  
  plugins: {
    CapacitorHttp: {
      enabled: true  // ✅ Usar XMLHttpRequest nativo para cookies
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#292B26',
      overlaysWebView: false
    },
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      androidSplashResourceName: 'splash',
      showSpinner: false
    }
  }
};

export default config;
