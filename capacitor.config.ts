import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kr.portlink.driver',
  appName: 'PortLink Driver',
  webDir: 'native/web',
  server: {
    url: 'https://port-link-snowy.vercel.app/driver',
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false,
    // server.url 외 같은 호스트 다른 path(/login, /api 등) 진입 시 Capacitor가 Safari로 튕기는 것 방지.
    // (WebViewDelegationHandler.swift:96 — host match가 path-prefix 검사보다 먼저 통과)
    allowNavigation: ['port-link-snowy.vercel.app', 'portlink.kr', 'www.portlink.kr'],
  },
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
    backgroundColor: '#FF6B35',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#FF6B35',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashImmersive: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
