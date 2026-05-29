# Gatito Hidratado 💧🐱

A React Native mobile app that helps build the habit of drinking water through a virtual cat that reacts to your hydration level. The more water you drink, the happier the cat gets.

Built as a personal project to explore the modern React Native ecosystem — animations, local notifications, persistent state, and a clean architecture that separates concerns between UI, logic, and data.

---

## Features

- **Reactive cat companion** — 4 mood states (happy, normal, thirsty, sleeping) driven by hydration progress and time since last drink
- **Smart notifications** — reminders scheduled from the last time you drank, not fixed times. Drinking water resets the timer automatically
- **Daily goal calculation** — personalized based on weight, sex, weather, and activity level
- **Streak tracking** — consecutive days reaching ≥80% of the daily goal
- **Drink history** — per-entry log with timestamps, 7-day visual history with completion bars
- **Configurable reminders** — wake/sleep window, interval (manual or auto-recommended), live preview of scheduled times
- **Animated UI** — bounce on drink, floating zZz for sleeping state, water drop particles, sound pop labels

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React Native 0.85 + Expo SDK 56 | Managed workflow, fast iteration, EAS Build |
| Language | TypeScript 6 (strict) | Full type safety, no `any` |
| Navigation | Expo Router 4 (file-based) | Collocated routes, typed navigation |
| State | Zustand v5 | Minimal boilerplate, selector-based subscriptions |
| Persistence | AsyncStorage + Zustand `persist` middleware | Automatic hydration, no manual serialization |
| Animations | react-native-reanimated v4 | UI thread animations, no babel plugin needed in v4 |
| Styling | NativeWind v4 (TailwindCSS) | Utility classes with full TypeScript support |
| Notifications | expo-notifications | Local scheduling with DATE triggers |
| Dates | date-fns v4 | Tree-shakeable, named imports only |
| Build | EAS Build | Cloud builds, no local Android/iOS toolchain required |

---

## Architecture

```
gatito-agua/
├── app/                    # Expo Router screens (file-based routing)
│   └── (tabs)/
│       ├── index.tsx       # Main screen — cat, progress, drink button
│       ├── stats.tsx       # History, streak, today's entry log
│       └── settings.tsx    # Profile, goal config, notification scheduling
├── components/
│   ├── cat/                # CatDisplay, WaterDrops animation
│   └── water/              # GlassProgressBar
├── hooks/
│   ├── useWaterTracker.ts  # Derives today's progress from store
│   ├── useCatMood.ts       # Mood state machine, updates every 60s
│   ├── useStreak.ts        # Streak logic against persisted history
│   └── useNotifications.ts # Permission handling, smart scheduling
├── stores/
│   └── waterStore.ts       # Zustand store — single source of truth
├── types/index.ts          # WaterEntry, DayRecord, UserSettings
├── constants/              # Cat config, water config, notification messages
└── utils/
    ├── waterGoal.ts        # Goal calculation + recommended interval
    └── dateHelpers.ts
```

**Key design decisions:**

- **No business logic in components** — screens only call hooks and render. All derivations live in `hooks/`, all mutations in the Zustand store.
- **Selector discipline** — Zustand selectors return primitives or stable references to avoid infinite render loops. `new Date()` is never constructed inside a selector.
- **Local-only notifications** — no server, no Firebase. The full scheduling logic runs on-device using `expo-notifications` DATE triggers. When the user drinks, all pending notifications are cancelled and rescheduled from the current time.
- **Day reset on mount** — `useWaterTracker` checks on every app open if the date changed and archives the previous day before starting a fresh record.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start

# Run on iOS simulator (requires Xcode)
npx expo run:ios

# Run on Android emulator or device
npx expo start --android
```

### Generate an APK (Android)

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

EAS builds in the cloud — no local Android SDK required. The `preview` profile produces an APK you can install directly on any Android device.

---

## Notification Logic

Reminders are scheduled dynamically based on the last drink, not fixed daily slots:

1. User drinks → cancel all pending notifications → schedule from `now + interval` through the rest of the day (+ tomorrow's window), up to 25 notifications
2. User saves settings → same rescheduling, anchored to the last recorded drink (or now if none today)
3. Interval is configurable (15–240 min) with a recommended value auto-calculated to distribute the daily glass goal evenly across the active window

---

## Cat Mood System

| Mood | Condition | Animation |
|------|-----------|-----------|
| 😺 Happy | Progress ≥ 70% | Bounce, sparkles |
| 🐱 Normal | 40–69% | Soft idle |
| 😿 Thirsty | < 40% or > 90 min since last drink | Pulse scale loop |
| 🐱 Sleeping | < 15% | Slow breathe, floating zZz |

Mood updates every 60 seconds via `setInterval` inside `useCatMood`.
