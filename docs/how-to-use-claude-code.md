# 🚀 How to Use Claude Code with This Project

## Setup (once)

```bash
# 1. Install Claude Code
npm install -g @anthropic-ai/claude-code

# 2. Go to the project folder
cd gatito-agua

# 3. Open Claude Code
claude
```

## Example Prompts to Get Started

### Initialize the full project
```
Initialize the Expo project following the build-agent instructions.
Use sub-agents in parallel to: (1) create the base folder structure
and files, and (2) install all required dependencies.
```

### Implement logic first
```
Implement the Zustand waterStore and the useWaterTracker
and useCatMood hooks following the logic-agent specs.
Make sure the store persists with AsyncStorage.
```

### Build the main screen
```
Create the main screen with the animated cat. Use sub-agents
in parallel: one for CatDisplay.tsx with react-native-reanimated
animations, and another for WaterLevel.tsx and GlassGrid.tsx.
```

### Add notifications
```
Implement the notifications system following notifications-agent.
Include the permission request, the Android channel, and
reminders with personalized cat messages in both languages.
```

### Set up i18n
```
Set up i18next with expo-localization. Create en.json and es.json
with all cat messages, UI labels and notification texts.
Auto-detect the device language and add a manual toggle in Settings.
```

### Generate the APK
```
Prepare the project for build following build-agent.
Verify app.config.ts and eas.json are correct,
then generate the preview APK for Android.
```

## Claude Code Tips

- **Use plan mode first** (`claude --plan`) for large tasks
- **Mention sub-agents explicitly** to parallelize work:
  `"use sub-agents to do X and Y at the same time"`
- **Update MEMORY.md** at the end of each session:
  `"update MEMORY.md with what we completed today"`
- **If something fails**, give the full error: paste the complete stack trace

## Context Files Structure

```
gatito-agua/
├── CLAUDE.md              ← Claude Code always reads this
├── MEMORY.md              ← Project state (update often)
└── .claude/
    └── agents/
        ├── ui-agent.md            ← Components and animations
        ├── logic-agent.md         ← Hooks, stores, logic
        ├── notifications-agent.md ← Push notifications
        └── build-agent.md         ← Expo + EAS Build
```