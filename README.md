# 🌍 EarthBud

A cross-platform mobile app that helps people turn environmental awareness into sustainable, everyday action. It teaches the basics of climate change, measures your personal footprint, guides you through concrete actions, tracks your progress, and gives you an environmentally-trained AI assistant to lean on.

Built with [Expo](https://docs.expo.dev/versions/v54.0.0/) (SDK 54) and [Expo Router](https://docs.expo.dev/router/introduction/), running on iOS, Android, and the web from a single codebase.

## What it does

The experience opens on a **launch screen** with a call to action and an integrated, swipeable **tutorial** for first-time users. From there, five tabs carry the core journey:

| Tab | Name | Purpose |
| --- | --- | --- |
| 1 | **Learn** 🌎 | A plain-language summary of global climate change, tutorials for understanding major Earth systems, and a notes feature for capturing what you learn. |
| 2 | **Footprint** 🍃 | A personal carbon-footprint calculator covering transport, home energy, diet, and consumption — with a breakdown, an "Earths needed" figure, and a comparison to the average. |
| 3 | **Actions** ⚡ | A library of 20+ concrete actions (composting, biking, planting trees, eating less meat, switching to renewables, and more), each with background, why it matters, step-by-step method, and collective impact. |
| 4 | **Tracker** 📊 | Progress visuals and encouraging messages that show your individual impact and predicted collective impact, plus a share feature. |
| 5 | **EcoBot** 💬 | An environmentally-focused AI assistant that answers questions and draws on your in-app activity to suggest relevant next steps and readings. |

## Tech stack

- **Framework:** Expo SDK ~54 / React Native 0.81 / React 19
- **Routing:** Expo Router (file-based, typed routes)
- **Language:** TypeScript
- **State & persistence:** React Context + `useReducer`, persisted to device via `@react-native-async-storage/async-storage`
- **UI:** Custom green/blue theme, `expo-linear-gradient`, `@expo/vector-icons` (Ionicons), `react-native-reanimated`, `expo-haptics`
- **AI backend:** OpenAI (`gpt-4o-mini`) via a serverless proxy deployed on **Vercel** (keeps the API key off the client)

### Project structure

```
app/                 Screens (Expo Router)
  index.tsx          Launch screen
  tutorial.tsx       First-run tutorial
  (tabs)/            The five main tabs (index, explore, actions, tracker, chat)
api/chat.ts          Vercel Edge Function — OpenAI proxy
store/app-store.tsx  Global state, persistence, footprint calc, actions data
constants/theme.ts   Green/blue color system
components/          Shared UI components
hooks/               Theme / color-scheme hooks
```

## Getting started

### Prerequisites

- Node.js (LTS) and npm
- The [Expo Go](https://expo.dev/go) app on your phone, or an iOS Simulator / Android Emulator

### Run the app

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see below)
cp .env.example .env

# 3. Start the dev server
npx expo start
```

Then press `i` for iOS, `a` for Android, `w` for web, or scan the QR code with Expo Go.

### Environment variables

Copy `.env.example` to `.env` and set:

```bash
# Base URL of the deployed Vercel proxy that talks to OpenAI (no trailing slash)
EXPO_PUBLIC_API_URL=https://your-project.vercel.app
```

> The OpenAI key is **never** stored in the app. It lives only on the server as `OPENAI_API_KEY` in your Vercel project — never as an `EXPO_PUBLIC_*` variable, which would be embedded in the shipped bundle.

## EcoBot / AI backend

EcoBot talks to a serverless proxy ([`api/chat.ts`](api/chat.ts)) rather than calling OpenAI directly. The app POSTs a `messages` array to the proxy, which attaches the secret key server-side and forwards the request. To deploy it:

```bash
npm i -g vercel
vercel                       # first run links/creates the project
vercel env add OPENAI_API_KEY  # paste your sk-... key
vercel --prod                # deploy
```

Put the resulting URL in your `.env` as `EXPO_PUBLIC_API_URL`.

## Design

The visual identity is **green-forward with blue accents**, defined in [`constants/theme.ts`](constants/theme.ts). The app supports light and dark modes and uses haptics and subtle animation to keep the experience encouraging rather than alarming — the goal is to convert awareness into momentum.

## Scripts

```bash
npm start        # expo start
npm run android  # open on Android
npm run ios      # open on iOS
npm run web      # open in browser
npm run lint     # expo lint
```

---

*Mission: raise environmental awareness and convert it into sustainable actions that benefit the planet.*
