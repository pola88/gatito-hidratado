# 🐱 Gatito Hidratado — Project Context

## What is this?
A **React Native + Expo** mobile app for Android (and iOS) that helps build the habit of drinking water through a virtual cat that reacts to the user's hydration level.

## Tech Stack
- **Framework:** React Native 0.85.3 with Expo SDK 56
- **Language:** TypeScript 6 (strict)
- **Navigation:** Expo Router 56 (file-based routing)
- **Notifications:** expo-notifications ~56.0.14
- **Storage:** AsyncStorage 2.2.0 (@react-native-async-storage/async-storage)
- **Animations:** react-native-reanimated **v4.3.1** — no babel plugin, uses react-native-worklets
- **UI:** NativeWind **v4** + TailwindCSS 3 — requires `global.css` + `metro.config.js`
- **Global state:** Zustand v5
- **Dates:** date-fns v4
- **Build:** EAS Build for Android APK

## Project Structure
```
gatito-agua/
├── app/                    # Expo Router - screens
│   ├── (tabs)/
│   │   ├── _layout.tsx     # Tab navigator (3 tabs)
│   │   ├── index.tsx       # Main screen (cat)
│   │   ├── stats.tsx       # Statistics
│   │   └── settings.tsx    # Settings
│   ├── _layout.tsx         # Root layout — imports global.css
│   ├── +not-found.tsx
│   └── modal.tsx
├── components/
│   ├── cat/
│   │   ├── CatDisplay.tsx  # Animated cat
│   │   └── WaterDrops.tsx  # Drop animation
│   ├── water/
│   │   ├── WaterButton.tsx # Main "I drank water" button
│   │   ├── WaterLevel.tsx  # Level bar
│   │   └── GlassGrid.tsx   # Glass grid
│   └── ui/                 # Generic components
├── hooks/
│   ├── useWaterTracker.ts  # Main hydration logic
│   ├── useNotifications.ts # Reminders
│   ├── useCatMood.ts       # Cat state
│   └── useStreak.ts        # Daily streak
├── stores/
│   └── waterStore.ts       # Zustand store (persist + AsyncStorage)
├── types/
│   └── index.ts            # WaterEntry, DayRecord, UserSettings
├── constants/
│   ├── catConfig.ts        # Cat config (emojis, messages, thresholds)
│   ├── waterConfig.ts      # Daily goal, glass size, etc.
│   └── notificationMessages.ts  # Push message strings by cat state
├── utils/
│   ├── waterGoal.ts        # calculateDailyGoal()
│   └── dateHelpers.ts
├── assets/
│   ├── fonts/              # Nunito + FredokaOne (add manually)
│   └── images/             # icon.png, splash-icon.png, android-icon-*.png
├── global.css              # @tailwind directives — imported once in _layout.tsx
├── app.config.ts           # Expo config (replaces app.json)
├── eas.json                # Build profiles (development/preview/production)
├── babel.config.js         # babel-preset-expo + nativewind/babel
├── metro.config.js         # withNativeWind wrapper (required for NativeWind v4)
└── tailwind.config.js      # Tailwind config with project color palette
```

## Development Rules

### Always
- Strict TypeScript — no `any`
- Functional components with hooks
- Separate logic (hooks/stores) from presentation (components)
- Test on a physical Android device or emulator before considering something done
- Animations with `react-native-reanimated` v4 (useSharedValue, useAnimatedStyle, withSpring, withSequence)
- Import `global.css` only once, in `app/_layout.tsx`

### Never
- No extensive inline `StyleSheet.create` — prefer NativeWind classes
- No business logic inside visual components
- No sensitive data in AsyncStorage without encryption
- No hardcoded user-facing strings — use constants files
- **Never** add `react-native-reanimated/plugin` to babel.config.js — v4 does not need it

### reanimated v4 Notes
- v4 uses `react-native-worklets` under the hood — no babel plugin required
- API is the same: `useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`, `withSequence`, `withRepeat`
- `runOnJS` and `runOnUI` still work the same way

### NativeWind v4 Notes
- Requires `global.css` (with `@tailwind` directives) imported in root `_layout.tsx`
- Requires `metro.config.js` wrapping with `withNativeWind`
- Requires `nativewind/preset` in `tailwind.config.js` presets
- **Do NOT add `nativewind/babel` to babel.config.js** — in v4 el plugin se movió a metro.config.js

### Commits
Format: `type(scope): description`
Types: `feat`, `fix`, `style`, `refactor`, `test`, `chore`
Example: `feat(cat): add thirsty animation with shake effect`

## Cat States
| State      | Water level | Emoji | Behavior                        |
|------------|-------------|-------|---------------------------------|
| `happy`    | ≥ 70%       | 😺    | Bounces, glows, sparkles        |
| `normal`   | 40–69%      | 🐱    | Soft idle                       |
| `thirsty`  | 15–39%      | 😿    | Shakes, red pulse               |
| `sleeping` | < 15%       | 😴    | Barely moves, darkened          |

## Available Sub-Agents
See `.claude/agents/` for specialized agents:
- `ui-agent.md` — Visual components and animations
- `logic-agent.md` — Hooks, stores and business logic
- `notifications-agent.md` — Reminder system
- `build-agent.md` — Build, EAS and Expo config
- `ux-writer-agent.md` — UX flows, copy and microcopy (EN + ES)

## How to Start a Task
1. Visual task → delegate to `ui-agent`
2. Logic/data task → delegate to `logic-agent`
3. Notifications → delegate to `notifications-agent`
4. Build/config → delegate to `build-agent`
5. Any text the user will see → delegate to `ux-writer-agent`
6. Cross-domain tasks → use sub-agents in parallel

## Security

### Permissions — request only what's needed
The app uses exactly these Android permissions and no more:
- `POST_NOTIFICATIONS` — reminders
- `SCHEDULE_EXACT_ALARM` — precise scheduling
- `RECEIVE_BOOT_COMPLETED` — reschedule on device reboot

Never add `ACCESS_FINE_LOCATION`, `READ_CONTACTS`, `CAMERA` or any other permission
not strictly required. Unnecessary permissions trigger Google Play warnings and erode user trust.

### AsyncStorage
AsyncStorage is **not encrypted**. It's acceptable for this app since we only store
hydration habits, weight and name — no credentials or payment data.
If the app ever adds login or syncs to a backend, migrate sensitive fields to
`expo-secure-store` instead.

### Never store or hardcode
- API keys or tokens of any kind
- Passwords
- The EAS `projectId` is public and fine to commit, but `google-service-account.json` must
  stay out of the repo (already in `.gitignore`)

### If a backend is added in the future
- Use HTTPS only — no plain HTTP requests
- Never log personal data (weight, name) to the console in production
- Validate and sanitize any user input before sending to a server

## Useful Commands
```bash
npx expo start                                  # Dev server
npx expo start --android                        # Open on Android
eas build --platform android --profile preview  # Test APK
npx expo install                                # Install SDK-compatible deps
```