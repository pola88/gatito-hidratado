import { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: "Gatito Hidratado",
  slug: "gatito-hidratado",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "gatitohidratado",
  owner: "pola88",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0d1b2a"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
      backgroundColor: "#0d1b2a"
    },
    package: "com.gatitohidratado.app",
    versionCode: 1,
    predictiveBackGestureEnabled: false,
    permissions: [
      "RECEIVE_BOOT_COMPLETED",
      "SCHEDULE_EXACT_ALARM",
      "POST_NOTIFICATIONS"
    ]
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.gatitohidratado.app"
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#0d1b2a"
      }
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/android-icon-monochrome.png",
        color: "#60CFFF",
        defaultChannel: "water-reminders"
      }
    ],
    [
      "react-native-android-widget",
      {
        widgets: [
          {
            name: "WaterWidget",
            label: "Gatito Hidratado",
            description: "Seguí tu hidratación desde la pantalla de inicio",
            minWidth: "110dp",
            minHeight: "40dp",
            targetCellWidth: 2,
            targetCellHeight: 1,
            resizeMode: "none",
            updatePeriodMillis: 0,
          }
        ]
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    eas: {
      projectId: "7167a49c-9e63-434a-9936-ed8fd05092cf"
    }
  }
}

export default config
