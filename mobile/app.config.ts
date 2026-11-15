import type { ExpoConfig } from 'expo/config';

type Variant = 'development' | 'preview' | 'production';

// Each variant gets its own application id, so a development build, a
// preview build and the released app can sit side by side on one phone.
const variant = (process.env.APP_VARIANT ?? 'production') as Variant;

const names: Record<Variant, string> = {
  development: 'UoWM (dev)',
  preview: 'UoWM (preview)',
  production: 'UoWM Companion',
};

const idSuffix: Record<Variant, string> = {
  development: '.dev',
  preview: '.preview',
  production: '',
};

const applicationId = `io.github.michadasis.uowmcompanion${idSuffix[variant]}`;

const config: ExpoConfig = {
  name: names[variant],
  slug: 'uowm-companion',
  version: '0.1.0',
  scheme: 'uowmcompanion',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/icon.png',
  android: {
    package: applicationId,
    adaptiveIcon: {
      backgroundColor: '#2B2168',
      foregroundImage: './assets/adaptive-icon-foreground.png',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
    },
  },
  ios: {
    bundleIdentifier: applicationId,
    supportsTablet: false,
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F7F6F2',
        image: './assets/splash-icon.png',
        imageWidth: 120,
        dark: {
          backgroundColor: '#121116',
          image: './assets/splash-icon.png',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
