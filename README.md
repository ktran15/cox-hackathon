# Hand-Me-Up

A mobile app that keeps kids' clothing in circulation instead of in landfills.
Photograph an outgrown garment, get a condition grade (A–D) and the best next
step (**Resell / Donate / Recycle**), act on it, and watch your saved water +
CO₂ grow. Built with Expo + React Native + TypeScript.

---

## Quick start

```bash
git clone <this-repo-url>
cd hand-me-up
npm install
npx expo start
```

Then open the **Expo Go** app on your phone and scan the QR code printed in the
terminal (phone and computer must be on the same Wi‑Fi). Press `i` / `a` in the
terminal to launch an iOS Simulator / Android Emulator instead.

That's it — **the app runs with no API keys and no extra setup.** Photo grading
falls back to a built‑in mock grader when no key is present.

## Prerequisites

- **Node.js 20 or 22 LTS.** This repo pins **22** in [`.nvmrc`](./.nvmrc). If you
  use `nvm`, run `nvm use` (it reads that file). Expo SDK 54 targets Node ≥ 20.19.4.
  > ⚠️ **Avoid Node 23/24.** They can intermittently fail to extract a
  > React Native dependency during install (see Troubleshooting). Stick to an
  > LTS and installs are smooth.
- The **Expo Go** app (iOS App Store / Google Play) for running on a physical phone.
- No Xcode/Android Studio required — everything here is Expo Go compatible.

## Optional: real Claude Vision grading

By default the grader is mocked, so the whole flow works offline. To grade real
photos with Claude Vision instead:

```bash
cp .env.example .env
# then edit .env and set EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-...
npx expo start -c        # -c clears the cache so the new env value is picked up
```

Your `.env` is git‑ignored and never committed. Without a key, the app silently
uses the mock grader — nothing breaks.

## Scripts

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `npx expo start`   | Start the dev server (QR for Expo Go)         |
| `npm test`         | Run the Jest test suite                       |
| `npx tsc --noEmit` | Type‑check the project (strict TypeScript)    |

## Troubleshooting

**`Cannot find module '@react-native/assets-registry/registry'`** (tests or
`expo start` fail right after install) — a known npm‑on‑Node‑23/24 hiccup where
that package doesn't extract. Fixes, in order of preference:

1. Switch to Node 20 or 22 LTS (`nvm use`) and reinstall.
2. Or restore just that package: `npm install @react-native/assets-registry --no-save`
3. Or do a clean install: delete `node_modules` and run `npm ci`.

**Metro cache weirdness after changing `.env` or config** — restart with
`npx expo start -c` to clear the cache.
