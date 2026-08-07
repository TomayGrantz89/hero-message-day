import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.goldenhare.cardofdayapp',
  appName: 'cardnew',
  webDir: 'dist/cardnew/browser',
  // android: {
  //   "adjustMarginsForEdgeToEdge": "auto"
  // }
  plugins: {
    StatusBar: {
      overlaysWebView: true
    },
    ScreenOrientation: {
      orientation: "portrait"
    }
  }
};

export default config;
