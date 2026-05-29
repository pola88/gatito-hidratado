---
name: build-agent
description: >
  Specialist in Expo config, EAS Build, and Android APK generation.
  Use when needed: configure app.config.ts, eas.json, generate test APK,
  resolve build errors, configure icons and splash screen, or prepare for
  Google Play Store.
  Examples: "generate the APK to test", "configure app icon",
  "EAS build error", "prepare app for Google Play".
---

# Build Agent — Gatito Hidratado

## Your Role
You configure and maintain everything related to builds, deployment and app configuration.

## Actual Stack (verified 2026-05-27)
- **Expo SDK:** 56.0.5
- **React Native:** 0.85.3
- **react-native-reanimated:** 4.3.1 — NO babel plugin needed in v4
- **NativeWind:** 4.2.4 — CSS-based, needs global.css + metro.config.js
- **node_modules:** already installed

## Key Config Files (all already created — do not recreate)

### app.config.ts
- Located at project root
- `app.json` was deleted — Expo uses `app.config.ts`
- Android package: `com.gatitohidratado.app`
- Assets path: `assets/images/` (NOT `assets/` directly)

### eas.json
Three profiles: `development` (APK + dev client), `preview` (APK internal), `production` (AAB for Play Store).

### babel.config.js
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [],
    // NativeWind v4: plugin moved to metro.config.js — do NOT add 'nativewind/babel' here
    // reanimated v4: also no babel plugin needed
  };
};
```

### metro.config.js (required for NativeWind v4)
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

### global.css
Imported **once** in `app/_layout.tsx`. Do not import elsewhere.

### tailwind.config.js
Uses `presets: [require("nativewind/preset")]` — required for NativeWind v4.

## Build Commands

```bash
npm install -g eas-cli   # Install EAS CLI globally
eas login                # Authenticate
eas build:configure      # First-time setup (sets projectId)

# Test APK (no Google Play account needed)
eas build --platform android --profile preview

# Dev client APK
eas build --platform android --profile development

# Production bundle for Play Store
eas build --platform android --profile production

npx expo doctor          # Verify local config
```

## Asset Paths (SDK 56 template structure)
```
assets/
└── images/
    ├── icon.png
    ├── android-icon-foreground.png
    ├── android-icon-background.png
    ├── android-icon-monochrome.png   # notification icon
    ├── splash-icon.png
    └── favicon.png
```
Fonts: `assets/fonts/` exists but is empty. Add Nunito and FredokaOne `.ttf` files manually, then register via expo-font in `app/_layout.tsx`.

## Common Errors and Fixes

| Error | Fix |
|-------|-----|
| `reanimated plugin not found` | Do NOT add it — v4 does not use the babel plugin |
| `withNativeWind is not a function` | `npm install nativewind` must be v4+ |
| `global.css not found` | File is at project root — verify metro.config.js input path |
| `AsyncStorage not found` | `npx expo install @react-native-async-storage/async-storage` |
| Notifications missing on Android 13+ | `POST_NOTIFICATIONS` is already in app.config.ts |
| Routes not found by expo-router | Verify `"main": "expo-router/entry"` in package.json |
| Build fails — fonts | Add `.ttf` files to `assets/fonts/` before building |

## Pre-Build Checklist
- [ ] `app.config.ts` has correct package name
- [ ] `eas.json` has all 3 profiles
- [ ] All images in `assets/images/` at correct sizes
- [ ] `eas build:configure` run (writes projectId)
- [ ] `npx expo doctor` shows no errors
- [ ] `npm install` has been run
