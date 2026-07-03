import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.myapp',
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
