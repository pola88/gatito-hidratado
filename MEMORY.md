# Project Memory — Gatito Hidratado

> Updated by Claude. Sub-agents read this at the start of each task.
> Keep under 200 lines — archive completed items to `docs/history.md`.

## Current Status
**Phase:** Source code complete — ready to test on Android  
**Last updated:** 2026-05-27

## Done
- [x] Expo SDK 56 scaffolded (tabs template)
- [x] `package.json` name fixed to `gatito-hidratado`
- [x] All dependencies installed (see Stack below)
- [x] `app.config.ts` (replaces `app.json`), `eas.json`, `babel.config.js`, `metro.config.js`, `global.css`, `tailwind.config.js`
- [x] `types/index.ts` — WaterEntry, DayRecord, UserSettings, CatMood
- [x] `stores/waterStore.ts` — Zustand v5 persist + AsyncStorage
- [x] `hooks/useWaterTracker.ts`, `useCatMood.ts`, `useStreak.ts`, `useNotifications.ts`
- [x] `utils/waterGoal.ts` (calculateDailyGoal), `utils/dateHelpers.ts`
- [x] `constants/catConfig.ts`, `waterConfig.ts`, `notificationMessages.ts`
- [x] `components/cat/CatDisplay.tsx` (4 mood animations), `WaterDrops.tsx`
- [x] `components/water/WaterButton.tsx`, `WaterLevel.tsx`, `GlassGrid.tsx`
- [x] `app/(tabs)/index.tsx` (main screen), `stats.tsx`, `settings.tsx`
- [x] `app/_layout.tsx` (imports global.css), `app/(tabs)/_layout.tsx` (3 tabs)
- [x] CLAUDE.md, MEMORY.md, all 4 agents updated
- [x] Template files removed (two.tsx, EditScreenInfo, etc.)

## Pending (in order)
1. Add font files to `assets/fonts/` (Nunito-Regular.ttf, Nunito-Bold.ttf, FredokaOne-Regular.ttf)
2. Run `npx expo start --android` and test on device/emulator
3. Register with EAS: `eas build:configure` (sets real projectId)
4. Generate preview APK: `eas build --platform android --profile preview`

## Actual Stack (verified)
| Package | Version |
|---------|---------|
| Expo SDK | 56.0.5 |
| React Native | 0.85.3 |
| react-native-reanimated | 4.3.1 |
| NativeWind | 4.2.4 |
| TailwindCSS | 3.4.19 |
| Zustand | 5.0.13 |
| date-fns | 4.3.0 |
| expo-notifications | 56.0.14 |
| AsyncStorage | 2.2.0 |
| TypeScript | 6.0.3 |

## Critical Technical Decisions
- **reanimated v4**: No babel plugin needed. Uses `react-native-worklets` internally. API unchanged.
- **NativeWind v4**: CSS-based approach. Needs `global.css` + `metro.config.js` + `nativewind/preset` in tailwind config.
- **Zustand v5**: `create` API changed slightly — use `import { create } from 'zustand'` (named export).
- **date-fns v4**: Tree-shakeable. Use named imports: `import { format, isToday } from 'date-fns'`.
- **App config**: Uses `app.config.ts` (TypeScript). `app.json` was deleted.
- **Asset paths**: `assets/images/` (not `assets/`) for icon, splash, android icons.

## Key Files
| File | Purpose |
|------|---------|
| `stores/waterStore.ts` | Global hydration state |
| `hooks/useWaterTracker.ts` | Main hook |
| `hooks/useCatMood.ts` | Cat state |
| `components/cat/CatDisplay.tsx` | Animated cat |
| `app/(tabs)/index.tsx` | Main screen |
| `app/config.ts` | Expo config |
| `global.css` | NativeWind v4 entry |
| `metro.config.js` | NativeWind v4 Metro plugin |

## Known Issues / Blockers
- `assets/fonts/` exists but is empty — fonts (Nunito, FredokaOne) must be added manually
- `app/(tabs)/` still has template files (`two.tsx`) — replace with `stats.tsx` and `settings.tsx`
- `components/` has template files (EditScreenInfo, ExternalLink, etc.) — safe to delete
