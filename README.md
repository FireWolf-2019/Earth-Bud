# 🌍 EarthBud

An iOS app that helps people turn environmental awareness into sustainable, everyday action. It teaches the basics of climate change, measures your personal footprint, guides you through concrete actions, tracks your progress, and gives you an environmentally-trained AI assistant to lean on.

Built with [Expo](https://docs.expo.dev/versions/v54.0.0/) (SDK 54) and [Expo Router](https://docs.expo.dev/router/introduction/), and shipped to the **iOS App Store** (currently in TestFlight beta).

## What it does

The experience opens on a **launch screen** with a call to action and an integrated, swipeable **tutorial** for first-time users. From there, five tabs carry the core journey:

| Tab | Name | Purpose |
| --- | --- | --- |
| 1 | **Learn** 🌎 | A plain-language summary of global climate change and tutorials for understanding major Earth systems. |
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
- **Build & release:** EAS Build + EAS Update (OTA), distributed through App Store Connect / TestFlight

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
scripts/             Icon and asset generation
```

## Getting started

### Prerequisites

- macOS with Xcode and an iOS Simulator, or a physical iPhone
- Node.js (LTS) and npm
- The [Expo Go](https://expo.dev/go) app, if you want to run on device without a custom build

### Run the app

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see below)
cp .env.example .env

# 3. Start the dev server
npx expo start
```

Then press `i` to open the iOS Simulator, or scan the QR code with Expo Go on your iPhone.

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
vercel                         # first run links/creates the project
vercel env add OPENAI_API_KEY  # paste your sk-... key
vercel --prod                  # deploy
```

Put the resulting URL in your `.env` as `EXPO_PUBLIC_API_URL`.

## Deployment (iOS)

EarthBud targets the iOS App Store. Releases go out through [EAS](https://docs.expo.dev/build/introduction/), configured in [`eas.json`](eas.json) with `development`, `preview`, and `production` profiles.

### One-time setup

- An Apple Developer Program membership and an app record in App Store Connect matching the bundle identifier `com.avishairajkumar.earthbud`.
- `npm i -g eas-cli && eas login`, then `eas init` to link the Expo project.
- Set the production API URL as an EAS environment variable so it is baked into the build:

  ```bash
  eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://your-project.vercel.app
  ```

  Without it, EcoBot fails in the shipped app — `EXPO_PUBLIC_*` values are resolved at build time, not runtime.

### Shipping a release

```bash
# Native/production build (signing credentials are stored on EAS after the first run)
eas build --platform ios --profile production

# Upload to App Store Connect / TestFlight
eas submit --platform ios --profile production
```

If `eas submit` stalls in the submission queue, download the `.ipa` from the EAS build page and upload it with [Apple Transporter](https://apps.apple.com/app/transporter/id1450874784) instead. Once processed, the build appears in TestFlight for internal and external testers, and can be promoted to an App Store release.

### JS-only updates

Changes that touch only JavaScript/assets can skip the review cycle and ship over the air:

```bash
eas update --channel production --message "What changed"
```

Anything native — app icons, splash screen, `app.json` config, new native dependencies — requires a full rebuild and a new App Store Connect upload.

### Icons and launch assets

```bash
npm run icons:ios  # derive the light/dark/tinted iOS icon variants from assets/images/icon.png
npm run icons      # generate the remaining placeholder assets (splash, favicon)
```

`npm run icons` never overwrites `icon.png` or the generated `ios-*` files.

## Design

The visual identity is **green-forward with blue accents**, defined in [`constants/theme.ts`](constants/theme.ts). EarthBud ships **light mode only** — a deliberate product choice, since the bright green/blue palette is central to keeping the experience hopeful and motivating. Haptics and subtle animation keep the tone encouraging rather than alarming — the goal is to convert awareness into momentum.

## Scripts

```bash
npm start        # expo start
npm run ios      # open on iOS
npm run lint     # expo lint
npm test         # run the Jest test suite
```

---

*Mission: raise environmental awareness and convert it into sustainable actions that benefit the planet.*
