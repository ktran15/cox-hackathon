# Hand-Me-Up — Parent App Build & Design Spec (FINAL)

> **For Claude Code.** This document is the source of truth for building the Hand-Me-Up parent mobile app. Build exactly what is specified here. Where a detail is unspecified, choose the option that best serves a tired parent, a young child, or an elderly grandparent using the app for the first time. Favor clarity over cleverness everywhere.

**Build status (update as milestones complete):** Milestones 1–4 complete — design system (Cut-Paper Classroom with Hammie mascot), domain layer + tests (water/CO₂ milestones, no points), stores/persistence/mock grader, and the vertical slice UI (scan → result → route → closet, working end to end with mock grader). Hammie is built but used as a constant mascot (header + avatar), not level-driven. LevelPlant grows via combined water/CO₂ milestones. **Next up: Milestone 5 (closet polish + garment detail).**

---

## 0. Rules of engagement (read first)

1. **One milestone at a time.** Build only the milestone the user asks for (Section 14), then STOP and summarize what you built and what to check. Never run ahead.
2. **Verify before accepting a milestone:** run `npx tsc --noEmit` and `npm test` and report results. Both must pass.
3. **Never run blocking commands** (`npx expo start`, watchers) as part of a task. Tell the user to run them; don't block your own terminal.
4. **APIs drift.** For Expo/React Native APIs (camera, image-manipulator, file-system, router), verify current usage with the Context7 MCP ("use context7") instead of trusting memory. Pin to what the installed SDK actually exports.
5. **Scope is locked.** No backend, no auth/login, no analytics, no payment, no marketplace hosting, no extra libraries beyond Section 3 without asking. The CV model is NOT built here — it stays behind the `GradingService` mock (Section 11).
6. **Do not invent integrations.** Third-party apps (Poshmark, Mercari, etc.) have no public "create listing" deep link. Use the share-sheet/copy pattern specified in Section 7.6. Never fabricate URL schemes.
7. If something in this spec conflicts with what the current SDK supports, implement the closest working equivalent, leave a `// SPEC-NOTE:` comment, and flag it in your end-of-milestone summary.

---

## 1. Product overview
Hand-Me-Up keeps kids' clothing in circulation instead of in landfills. A parent photographs an outgrown garment; the app grades its condition (A/B/C/D), recommends the best destination (**Resell / Donate / Recycle**), helps them act on it, and saves it to their **Outgrown Closet**. Each garment shows its individual estimated water + CO₂ saved, and the parent's profile accumulates lifetime impact, points, levels, and badges.

The impact number is a **sourced estimate used to motivate behavior**, not a tracking claim. We never assert we can follow a garment after it leaves the parent's hands. We say so plainly in the app.

### Product principles
1. **One clear action per screen.** Recommend the best choice; allow override.
2. **No judgment.** A worn-out item is still a win when recycled. Celebrate every routed garment.
3. **Plain words.** Never show internal terms ("CV", "route factor", "grade D" as jargon). Say "Still in great shape," "Best to recycle," "where it should go."
4. **Effortless for everyone.** A grandparent should clear a pile of onesies in a few taps without an account or a tutorial.
5. **Make good feel good.** The impact counter and badges turn an invisible good deed into a visible, rewarding one.

---

## 2. Users & the accessibility mandate
Primary users: **parents** (often one-handed, distracted, in a hurry), **grandparents/elderly** (need large text, high contrast, no jargon), and **children** (will poke at it; it should feel playful and unbreakable).

**Accessibility is a hard requirement, not a nice-to-have:**
- Minimum tap target **48dp**; primary buttons **≥56dp tall**, full-width, with a text label (never icon-only for key actions).
- Base body text **17–18pt**, scalable. Respect OS font scaling (`allowFontScaling`, default true) **and** ship an in-app text-size control (Normal / Large / Extra-Large) implemented as a multiplier in the theme.
- All text meets **WCAG AA contrast (≥4.5:1)**. Body text uses the dark **Ink** navy, never a pastel, on light surfaces.
- Every interactive element has an `accessibilityLabel` and correct `accessibilityRole`.
- Respect **reduce motion**: read `AccessibilityInfo.isReduceMotionEnabled()` OR the in-app toggle (Settings). If either is on, skip confetti and count-up animations (snap to final values). Animations are enhancements; the app must be fully usable without them.
- Prefer **selection over typing**. No required text input anywhere in the core flow.
- Sentence case everywhere. Friendly, calm, concrete copy.

---

## 3. Tech stack (complete dependency list — do not add others without asking)
- **Expo (latest stable SDK) + React Native + TypeScript (strict)** — scaffold per Section 14 Milestone 1.
- **expo-router** (file-based navigation; included in the default template)
- **zustand** (+ `persist` middleware with `createJSONStorage(() => AsyncStorage)`)
- **@react-native-async-storage/async-storage**
- **expo-camera** (`CameraView`, `useCameraPermissions`)
- **expo-image-picker**, **expo-image-manipulator** (resize to 640px width, ~0.7 compress before storing)
- **expo-file-system** — ⚠️ in current SDKs the classic API lives at **`expo-file-system/legacy`** (`documentDirectory`, `copyAsync`, `makeDirectoryAsync`). Import from there; do not mix it with the new File/Directory API. Verify with Context7.
- **expo-location** (optional permission; app must fully work when denied)
- **@expo-google-fonts/grandstander**, **@expo-google-fonts/nunito**, **expo-font**, **expo-splash-screen**
- **react-native-svg** (icons, mascot, illustrations)
- **lucide-react-native** (icons; requires react-native-svg, already present)
- **react-native-confetti-cannon** (the ONLY celebration lib; count-ups use core `Animated`)
- **zod** (validate any data crossing a boundary: grading results, places)
- **jest** + **jest-expo** preset + **@testing-library/react-native**
- All choices must remain **Expo Go compatible** (no native modules requiring a dev build).
- No backend in this build. No account/login. Everything works offline on-device.

---

## 4. Architecture & folder structure
Strict separation of concerns. UI never contains business math; domain logic is pure and testable; external systems sit behind interfaces.

> The default Expo template ships `components/`, `constants/`, `hooks/` at root. **Dissolve them**: move anything useful into `src/` below and delete the rest, so the final tree matches this exactly.

```
app/                              # expo-router routes ONLY (thin screens)
  _layout.tsx                     # root stack + font loading + theme/text-size provider
  (tabs)/_layout.tsx              # bottom tabs: Closet · Scan · Profile
  (tabs)/index.tsx                # Home / Outgrown Closet
  (tabs)/scan.tsx                 # Camera
  (tabs)/profile.tsx              # Profile
  result.tsx                      # Grade + recommendation
  route/[type].tsx                # Resell / Donate / Recycle action (type param validated)
  garment/[id].tsx                # Garment detail + passport
  badges.tsx
  onboarding.tsx
  settings.tsx
src/
  domain/                         # PURE, no React imports, no side effects, fully unit-tested
    types.ts
    constants.ts                  # baselines, factors, thresholds, badges, levels
    impact.ts                     # computeSaving(), garmentLifetime()
    gamification.ts               # milestone ladders (water/CO₂), plant growth, evaluateBadges()
    grading-rules.ts              # grade -> recommended route + plain-language copy
  data/
    stores/closetStore.ts         # persisted
    stores/scanStore.ts           # transient (NOT persisted)
    stores/badgeStore.ts          # persisted: earnedBadgeIds + earnedAt ONLY
    stores/settingsStore.ts       # persisted
    selectors/profileSelectors.ts # derived ProfileStats — computed, NEVER stored
    persistence.ts                # AsyncStorage adapter via createJSONStorage
    services/gradingService.ts    # interface + MockGradingService (swap later)
    services/handoffService.ts    # listing text builder + share/open helpers
    services/placesService.ts     # static seed data default; live API only if key present
  ui/
    theme/tokens.ts               # colors, spacing, radius, elevation
    theme/typography.ts
    components/                   # Button, Card, ScreenHeader, GradeBadge, RouteChip,
                                  # ImpactStat, GarmentCard, LevelPlant, BadgeTile,
                                  # EmptyState, Celebration, MapList, ListingPreviewCard,
                                  # PaperBackground, TextSizeControl
  hooks/
  utils/
assets/seed/places.json           # bundled donation/recycle locations (see 7.6)
```

**State-integrity rule (critical):** profile totals (water, CO₂, points, level) are **derived by summing closet items via `profileSelectors`**. They are never written to storage. The ONLY persisted gamification state is `badgeStore` (`earnedBadgeIds`, `earnedAt`), because badge unlocks are events, not sums. If you find yourself storing a total anywhere, stop — that's the desync bug this rule prevents.

---

## 5. Design system — "Cut-Paper Classroom"

> ⚠️ **This is the heart of the app's identity. Do not flatten it into a generic clean/minimal UI.** A previous pass produced a white, minimal, "health-app" look — that is explicitly WRONG for this product. The app must look like a handmade daycare wall: construction paper, crayon outlines, paper texture, bold warm color. When in doubt, push toward MORE handmade character in the framing (never at the cost of readable content). Build the look on the design tokens, shared components, and `dev-components` screen FIRST, and stop for visual review before applying it to real screens.

### 5.1 The aesthetic (read carefully)
**Cut-Paper Classroom.** Every surface looks like colored construction paper that was cut out and arranged on a bright classroom wall, with crayon/marker outlines and a warm paper-grain texture. Think the handmade energy of a daycare bulletin board crossed with Sesame Street's bold, outlined, primary-color blocks. This is the character that was missing before.

The five things that CREATE this look (all five are required; color tokens alone are not enough):
1. **Thick "crayon" outlines.** Cards, buttons, badges, chips, and the tab bar get a **2–3px dark ink outline** (`color.ink`), like shapes drawn with a marker. This is the single most important signature. Flat borderless cards = wrong.
2. **Paper-grain texture.** The app background is warm **cream with a subtle paper texture**, never flat white. (Implementation in 5.4.)
3. **Hand-cut imperfection.** Rounded corners are chunky and **not all identical** — vary radii slightly per corner (e.g. 22/26/20/24) so cards read as cut by hand, not generated. A tiny rotation (−1° to +1.5°) on stickers/badges sells it.
4. **Bold blocks of warm color.** Big confident fills, not pale pastels-on-white. Color lives in the framing (cards, headers, badges); content sits on cream or white paper inside.
5. **Soft paper "lift" shadow.** A slightly offset, soft shadow under outlined elements so they feel like paper layered on paper.

**Discipline (protects elderly readability):** the boldness lives in **containers, outlines, badges, and accents**. The **content inside stays clean** — Nunito body text, strong contrast, generous spacing. Loud framing, calm content. This is the agreed balance: strong character, never at the cost of readability.

**The signature element** is the **crayon-drawn level plant** that grows as impact grows, plus **grade badges that look like peel-and-stick stickers**. These are the two things the app is remembered by — give them the most craft.

Use `StyleSheet` only — **no NativeWind/Tailwind**.

### 5.2 HARD RULE: no emoji, ever
**Never render any emoji anywhere in the app** (no 👋 🎉 🌱 ♻️, none). Default OS emoji instantly cheapen the app and break the handmade aesthetic. All playful imagery comes from a **single consistent drawn icon language**: `lucide-react-native` icons rendered with a **thick stroke (`strokeWidth ~2.5`) in `color.ink`** to match the crayon outlines, or simple custom `react-native-svg` shapes (the plant, the sticker stars) in the same style. If a spot earlier in this doc shows an emoji in example copy, replace it with a drawn icon or nothing. Greetings are text only ("Hi, {name}!"), no waving hand.

### 5.3 Color tokens (`src/ui/theme/tokens.ts`)
Warmer and bolder than before. Gerber blue stays the anchor; cream paper replaces white as the base; primary classroom colors (yellow, red, green, blue) carry the energy, with the baby-food colors as supporting accents. Body text is always **Ink**. Outlines are always **Ink**.

```ts
export const color = {
  // Ink — outlines + primary text (warm near-black navy, like a marker)
  ink:         '#23323D',
  inkSoft:     '#5A6B76',

  // Base — Gerber-inspired blue (anchor)
  blue:        '#1F84C9',
  blueDeep:    '#13608F',   // pressed
  blueSoft:    '#CFE8F7',   // paper fill

  // Primary classroom pops (bold, confident fills)
  sunshine:    '#FFC23C',   // yellow
  tomato:      '#EF5B45',   // red-orange
  grass:       '#5FB84A',   // green
  grape:       '#8C5BAA',   // purple
  bubblegum:   '#F074A0',   // pink

  // Baby-food supporting accents
  carrot:      '#F4922E',
  pea:         '#9ACb4E',
  squash:      '#FBC078',
  seafoam:     '#2FB7A3',

  // Paper surfaces (texture sits on these — NOT flat white)
  paper:       '#FBF3E4',   // app background base (warm cream)
  paperDeep:   '#F3E7D0',   // alt cream band
  card:        '#FFFFFF',    // inner content paper (kept white for legibility)
  cream:       '#FFF7EC',

  // Feedback
  success:     '#3FA66A',
  warning:     '#E08A1E',
  danger:      '#D2502F',
};

// Condition grade = sticker color
export const gradeColor = { A: color.grass, B: color.blue, C: color.sunshine, D: color.grape };
// Destination route = tag color
export const routeColor  = { resell: color.grass, donate: color.bubblegum, recycle: color.seafoam };

// The crayon-outline system (use everywhere)
export const outline = {
  width: 2.5,
  color: color.ink,
  // soft paper-lift shadow to pair with the outline
  shadow: { shadowColor: '#23323D', shadowOpacity: 0.16, shadowRadius: 0, shadowOffset: { width: 3, height: 4 }, elevation: 4 },
};
```
Contrast notes: **white/cream** text on `blue`, `blueDeep`, `tomato`, `grass`, `grape`, `bubblegum`, `seafoam`, `success`, `danger`; **Ink** text on `sunshine`, `pea`, `squash`, `carrot`, and all paper/cream surfaces. Never pale-colored text on white.

### 5.4 Typography (`src/ui/theme/typography.ts`)
- **Display / headers / big numbers:** **Grandstander** (Google Font; weights 600/700/800). Hand-lettered, kid-made character. Use for the app name, screen titles, hero impact numbers, badge/level names. Headers only — never body.
- **Body / UI / buttons:** **Nunito** (weights 400/600/700). Rounded but highly legible — carries all paragraphs, labels, and controls so elderly users always read comfortably.
- Scale (pt, multiplied by the in-app text-size setting): Display 36 / Title 26 / Heading 21 / Body 18 / Label 16 / Caption 14. Headers can use slightly tighter letter-spacing; body line-height ≈ 1.4. Sentence case throughout (Grandstander gives the playfulness; don't also SHOUT in caps except a single hero number/logo if desired).
- Load both via `@expo-google-fonts/grandstander` and `@expo-google-fonts/nunito` in root `_layout.tsx` with `expo-font`; keep the splash visible until loaded (`expo-splash-screen`).

### 5.5 Shape, texture, elevation, motion
- **Outlines:** apply the `outline` token (2.5px `ink`) to Card, Button, GradeBadge, RouteChip, GarmentCard, the tab bar, and inputs. This is non-negotiable for the look.
- **Radius (hand-cut, slightly irregular):** cards ~24 with per-corner variation (e.g. `borderTopLeftRadius:22, borderTopRightRadius:26, borderBottomRightRadius:22, borderBottomLeftRadius:28`); buttons 18; primary CTA pill 30; chips/stickers 999. Provide a small `handCut(seed)` helper that returns lightly varied corner radii so cards don't look identical.
- **Paper texture (MUST be visibly paper, not flat cream).** The background is the largest surface in the app; if it reads as flat off-white, the whole aesthetic fails. Build `<PaperBackground>` so the grain is *felt and faintly seen* — clearly a textured paper, while body text stays perfectly readable over it. Implement with a **bundled seamless paper-grain PNG** at `assets/textures/paper.png` (`<Image>`, `resizeMode="repeat"`, opacity ~0.10–0.16 — tune on device until it reads as paper) over `color.paper`. If no PNG asset is available, generate a richer procedural grain with `react-native-svg`: layered low-opacity fibers/flecks (short random strokes + sparse dots in `color.paperDeep` and a faint warm shadow tone), denser than a few dots — it must look like construction paper fiber, not a clean gradient. Wrap every screen in `<PaperBackground>`.
- **Torn / cut-paper edges (selective).** Where a large colored region meets the cream (section dividers, the impact band, colored card tops), render a **slightly irregular torn-paper edge** (an SVG path with small random bumps, or a repeating zigzag/deckle mask) so color blocks look ripped from construction paper. Use this on **big seams only** — never on every card. Provide a reusable `<TornEdge color side>` helper.
- **Shadow:** use the paper-lift shadow from the `outline` token (slightly offset, near-zero blur) so outlined shapes feel like layered paper, not glassy material.
- **Stickers:** GradeBadge and earned BadgeTile render as sticker shapes — filled grade/route color, thick ink outline, a thin inner white "die-cut" ring, and a tiny rotation (−2° to +2°). They should look peelable.
- **Motion (gated by reduce-motion, Section 2):** impact numbers count up via core `Animated`; on routing/badge unlock, a `react-native-confetti-cannon` burst of **paper-confetti colors** (sunshine/tomato/grass/blue) plus the level plant "growing" a step (scale/leaf pop); buttons press with a slight squash (scale 0.96 + 1px down) like pressing a paper button. Warm, tactile, minimal — no extra animation libraries.
- **Icons:** `lucide-react-native` at `strokeWidth ~2.5` in `color.ink`, always with a text label for key actions. No emoji (5.2).

### 5.6 Core components to build
All get the crayon outline + paper-lift shadow unless noted. `PaperBackground` (texture wrapper, used by every screen), `Button` (primary/secondary/ghost, large default, paper-press animation), `Card` (hand-cut radii), `ScreenHeader` (Grandstander title), `GradeBadge` (sticker), `RouteChip` (paper tag), `ImpactStat` (Grandstander animated count + unit + label), `GarmentCard`, `Hammie` (the mascot — a friendly cut-paper sprout in a onesie; he is a **fixed constant character**, NOT level-driven; used in closet header + default profile avatar), `LevelPlant` (the crayon-drawn growing plant — grows via combined water/CO₂ milestones; this is the signature growth element, give it real craft), `BadgeTile` (earned = colored sticker, locked = ink-outline silhouette on paper), `EmptyState` (drawn illustration, no emoji), `Celebration` (paper-confetti wrapper that no-ops under reduce-motion), `MapList`, `ListingPreviewCard`, `MilestoneBar` (progress toward next water or CO₂ milestone, alternating), `TornEdge` (cut-paper seam), `TextSizeControl`.

### 5.7 Design/motion skills
The `design-taste` skill (Emil Kowalski motion craft + impeccable interaction states + taste-skill anti-slop) is installed in this repo. Use its *principles* — purposeful motion, easing/timing discipline (UI animations ~200–300ms, custom curves not linear defaults), interaction-state polish, and the anti-slop craft mindset — when building or reviewing any UI. **Hard constraint: this is a React Native / Expo app.** Implement every principle with React Native primitives only (`Animated` / Reanimated, `Pressable` states). NEVER use web-only techniques the skill may suggest: no CSS, Framer Motion, GSAP, clip-path, hover states, or focus rings — they do not exist in this runtime. If the skill proposes a web technique, translate it to the nearest React Native equivalent or skip it. Taste transfers; web code does not.

### 5.8 Color deployment (avoid the bland "white-card-on-cream" trap)
Color is defined in the palette but must be *deployed boldly*, not limited to small accents. The target is Sesame Street energy: confident blocks of color, not dots of it. Rules:
- **Every screen has at least one large color block** — e.g. a header band, an impact band, or a section divider filled with `blue`, `sunshine`, `grass`, or `tomato` (with a `TornEdge` seam where it meets cream).
- **Cards are not all white.** Mix in **colored paper cards** (soft fills of `blueSoft`, `sunshine`, `pea`, etc.) so the closet/profile feel like a colorful collage. White card = one option, not the default.
- **Section headers and dividers carry color**, not just black text on cream.
- **Route and grade are color-coded everywhere** they appear (chips, cards, badges, the route action screen takes on its `routeColor`).
- **The impact strip is a bold color block**, not plain text on cream.
- **Guardrail (protects elderly readability):** the boldness lives in *regions, bands, dividers, and card fills* — the **text inside any block always sits on a surface with AA contrast** (white/cream text on deep fills; ink text on light fills, per 5.3). Loud framing, calm legible content. Do not tint body text or reduce text contrast for style. Color the architecture, never sabotage the reading.

---

## 6. Information architecture & navigation
**Bottom tab bar, 3 destinations**, Scan as the visual centerpiece:

```
┌───────────────────────────────────────────┐
│            (screen content)                 │
├──────────────┬──────────────┬──────────────┤
│   Closet     │   ● Scan ●    │   Profile    │
└──────────────┴──────────────┴──────────────┘
```
Implement the center Scan emphasis the **simple way**: a normal `Tabs.Screen` whose `tabBarButton`/icon is styled as a raised circular blue button (camera icon, slight negative top margin). **If this fights the router, fall back to a normal styled tab** — do not burn time on a custom tab bar. Stack screens pushed on top: Result, Route action, Garment detail, Badges, Onboarding, Settings.

In `route/[type].tsx`, validate the param against `'resell' | 'donate' | 'recycle'` (zod or a type guard); unknown values render a friendly error with a way back.

---

## 7. Screen specifications

### 7.1 Onboarding (first launch only, skippable)
Three light slides (simple shapes/illustrations from tokens — no external art): (1) "Clothes your kid outgrew can help another family." (2) "Snap a photo. We'll tell you the best thing to do with it." (3) "Watch your impact grow." End on a big "Get started" button. No account. Store `hasOnboarded` in settings; root layout redirects accordingly.

### 7.2 Home — Outgrown Closet  `(tabs)/index.tsx`
- **Header:** use the dev-components screen header style. **"Hand-Me-Up" title with Hammie next to it** (small, constant, not level-driven). Below: a compact **impact bar** showing three animated `ImpactStat`s — Water saved (L), CO₂ saved (kg), Items. All three **count up from zero on screen load** (gated by reduce-motion). Below the stats: a **`MilestoneBar`** showing progress toward the next milestone, alternating between a Water milestone and a CO₂ milestone (e.g. "480 L to your next Water milestone" with a progress bar filling toward the threshold). The milestone goal and current value must always be legible.
- **Primary CTA:** large pill "**Add a garment**" → Scan.
- **Filter chips:** All · Resell · Donate · Recycle (with counts).
- **Garment grid:** `FlatList` (2 columns) of `GarmentCard`s — thumbnail, type label, `GradeBadge`, `RouteChip`, "Saved ~X L · Y kg." Tap → Garment detail. **Swipe or long-press to delete** a garment (with a confirm dialog). Removing a garment subtracts its saving from totals automatically via derived selectors (totals are never stored separately).
- **Empty state:** friendly illustration + "Your closet is empty. Scan your first outgrown outfit to get started." + CTA. (The explainer copy lives ONLY here, not in the header.)

### 7.3 Scan  `(tabs)/scan.tsx`
- Request permission via `useCameraPermissions`; if denied, show a clear explanation + "Open settings" + "Choose from library" fallback (the screen must remain useful without camera).
- Full-screen `CameraView`, soft framing guide, tip: "Lay it flat in good light." Big circular shutter; secondary "Choose from library."
- On capture/pick → resize to 640px width (image-manipulator, compress ~0.7) → copy the file into the app document directory (`expo-file-system/legacy`) → set scanStore state → Analyzing → `gradingService.analyze(uri)` → navigate to Result.

### 7.4 Analyzing (transient state inside the scan flow)
Calm loader with rotating copy ("Looking at the fabric…", "Checking for wear…"). Appears within 100ms; 10s timeout → friendly retry. (MockGradingService resolves in ~1.2s to feel real.)

### 7.5 Result  `result.tsx`
- Captured image at top.
- **`GradeBadge`** large + plain-language status: A "Like new!" · B "Gently worn" · C "Still good, well-loved" · D "Too worn to wear again."
- Detected flaws as soft chips ("small stain", "pilling") — only when present, never scary.
- **Recommendation card:** "We suggest: **{Route}**" + one-line reason + **saving preview** ("This could save about 1,050 L of water and 1.4 kg of CO₂"). Uses `routeColor`.
- **Primary button** = recommended route. **Secondary:** "Choose a different option" → reveals the other two (override honored). **Tertiary:** "Just save for now" (saves with no route; routable later from Garment detail; contributes no saving until routed).

### 7.6 Route action  `route/[type].tsx`
One screen, three modes. On completion: compute saving (Section 8), append the event, save the garment, run `evaluateBadges`, show **success** (Celebration + "+X L / +Y kg" + any new badge), return to Closet with the impact strip updated.

- **Resell:** `ListingPreviewCard` auto-filled from the scan — title ("Kids' {type} — {condition phrase}"), condition description built from grade + flaws, suggested price band (A: $8–14 · B: $5–9 · C/D: not suggested). Actions: **"Copy listing"** (clipboard), **"Share listing"** (`Share.share()` with the text). Two marketplace buttons: **eBay** (working — opens eBay's sell flow via `Linking.openURL` with prefilled listing data; verify the current eBay sell-flow URL parameters with Context7/web search before hardcoding; if exact prefill isn't achievable, fall back gracefully to opening eBay's sell page with the listing text on the clipboard) and **Facebook Marketplace** (styled but visibly disabled, labeled "Coming soon"). We never take payments or host listings.
- **Donate:** Show **3 nearby donation locations**, prioritizing high-reuse destinations (children's shelters, school clothing closets) above generic bins. Each shows: **name, distance (miles), and what they accept.** Tapping a location opens the device's native maps app with that address pre-filled (via `Linking.openURL` with a `maps://` or `geo:` URL). Short honest note: many donated clothes are never reused — we surface places that actually put clothes on kids.
- **Recycle:** Same pattern: **3 nearby textile recyclers / retailer take-back** locations with name, distance, and a tap-to-open-maps action + a one-line "why recycle" reassurance.

**Places data:** `placesService` returns from **bundled `assets/seed/places.json` by default** (at least 5 entries per category: name, category, high-reuse flag, address, hours, accepts, lat/lng). If `EXPO_PUBLIC_PLACES_API_KEY` is set AND location permission granted, fetch live results instead; on any failure, silently fall back to seed. The demo must never depend on a key or network. If location is granted, sort by distance and show the 3 closest; otherwise show the first 3 unsorted with no error.

### 7.7 Garment detail  `garment/[id].tsx`
- Image, optional editable **nickname** ("Dino onesie"), type, `GradeBadge`, `RouteChip` (or "Not routed yet" + route buttons), this garment's saving.
- **History:** date logged, grade, route chosen, saving contributed. Simple and factual — no cross-owner tracking claims.
- **Delete garment** button (with confirm dialog). Removal subtracts saving from derived totals automatically.

### 7.8 Profile  `(tabs)/profile.tsx`
- **Header:** **Hammie** as the default avatar (constant, not level-driven) + optional editable name.
- **LevelPlant:** the crayon-drawn growing plant, driven by **total milestones reached across both the Water and CO₂ ladders** (see Section 8.3). Show current growth stage and progress to next milestone.
- **Lifetime impact:** hero `ImpactStat` cards — Water saved (L), CO₂ saved (kg), Landfill diverted (kg), Items routed. All derived from `profileSelectors`.
- **Milestone progress:** show current Water milestone level + progress-to-next, and current CO₂ milestone level + progress-to-next.
- **Badges:** grid preview (earned colorful, locked soft silhouettes) → "See all" → Badges screen.
- **Route breakdown:** counts for Resell / Donate / Recycle.
- Link to Settings.

### 7.9 Badges  `badges.tsx`
Full grid, earned vs locked. Tap → detail sheet: icon, title, description, "How to earn it." New badges celebrate wherever earned.

### 7.10 Settings  `settings.tsx`
Text-size control (Normal / Large / Extra-Large), reduce-motion toggle, name field, "About Hand-Me-Up," **Sources** (Section 13), and privacy line: "Your photos and data stay on your device." No analytics/tracking in this build.

---

## 8. Domain logic (pure, in `src/domain/`, fully unit-tested)

### 8.1 Grade → recommended route (`grading-rules.ts`)
```
A -> resell    B -> resell    C -> donate    D -> recycle
```
Parent override is honored and saved. This module also owns the plain-language copy per grade/route so the UI never hardcodes strings twice.

### 8.2 Impact engine (`constants.ts` + `impact.ts`)
The saving for one event = the footprint of the **new garment that didn't get made** because this one was reused, discounted to stay conservative.

```ts
// Footprint to PRODUCE one new kids' garment = what reuse displaces.
// Estimates scaled from published adult-garment figures (see Sources). LABEL AS ESTIMATES.
export const BASELINE = {
  onesie:    { waterL: 1200, co2Kg: 1.5, weightKg: 0.10 },
  top:       { waterL: 1500, co2Kg: 2.0, weightKg: 0.12 },
  pants:     { waterL: 2500, co2Kg: 3.0, weightKg: 0.20 },
  dress:     { waterL: 2700, co2Kg: 3.2, weightKg: 0.18 },
  jacket:    { waterL: 4000, co2Kg: 5.0, weightKg: 0.40 },
  sleepwear: { waterL: 1400, co2Kg: 1.8, weightKg: 0.15 },
  accessory: { waterL: 400,  co2Kg: 0.5, weightKg: 0.05 },
  unknown:   { waterL: 1500, co2Kg: 2.0, weightKg: 0.15 },
} as const;

export const ROUTE_FACTOR  = { resell: 1.0, donate: 1.0, recycle: 0.15 } as const;
export const DISPLACEMENT  = 0.7;   // conservative: not every reuse replaces a new purchase
export const QUALITY_BONUS = 1.05;  // only when grade A/B is resold

// computeSaving(type, route, grade): Saving
//   base = BASELINE[type]; factor = ROUTE_FACTOR[route]
//   bonus = (route === 'resell' && (grade === 'A' || grade === 'B')) ? QUALITY_BONUS : 1
//   waterL      = Math.round(base.waterL * factor * DISPLACEMENT * bonus)
//   co2Kg       = round2(base.co2Kg * factor * DISPLACEMENT * bonus)
//   divertedKg  = base.weightKg
```
`garmentLifetime(events)` sums savings across all events and re-rounds to prevent float drift.

### 8.3 Gamification (`gamification.ts`) — Water & CO₂ milestones, NO points
Green Points are **removed**. Progression is driven directly by the two real impact metrics: **Water saved (L)** and **CO₂ saved (kg)**. This is more honest and more motivating — the user levels up because they literally saved real resources, not because they earned abstract currency.

**Two milestone ladders** (ascending thresholds; the domain layer owns these):

| Water milestones | CO₂ milestones |
|---|---|
| 500 L | 1 kg |
| 2,000 L | 5 kg |
| 5,000 L | 15 kg |
| 10,000 L | 25 kg |
| 25,000 L | 50 kg |
| 50,000 L | 100 kg |

Each ladder exposes: milestones reached, the next threshold, current value, and progress toward it (0–1 fraction).

**LevelPlant growth** = total milestones reached across BOTH ladders combined. If a user has hit 2 water milestones and 1 CO₂ milestone = 3 total → maps to growth stage 3. Map combined count to the plant's growth stages (e.g. 0 = bare soil, 1–2 = sprout, 3–4 = small plant, 5–7 = leafy, 8–10 = full tree, 11–12 = flowering). Design the stages so the plant visibly grows and feels rewarding.

**MilestoneBar display** (UI, not domain): alternates between showing the Water progress and the CO₂ progress, so the user sees "480 L to your next Water milestone" one time and "2 kg to your next CO₂ milestone" next. The bar always shows the goal clearly.

**Badges** — earned by **completing a route** or hitting **real metric thresholds** (never by scanning alone):

| id | Title | How to earn |
|---|---|---|
| first_loop | First Loop | Route your first garment |
| closet_5 | Closet Starter | Route 5 garments |
| rehomer_10 | Rehomer | Route 10 garments |
| champion_25 | Circular Champion | Route 25 garments |
| resell_10 | Resell Pro | Resell 10 items |
| donate_10 | Big Heart | Donate 10 items |
| recycle_5 | Fiber Saver | Recycle 5 worn-out items |
| water_500 | First Drop | Save 500 L water |
| water_5k | Water Guardian | Save 5,000 L water |
| water_25k | Hydro Hero | Save 25,000 L water |
| co2_5 | Carbon Cutter | Save 5 kg CO₂ |
| co2_25 | Climate Kid | Save 25 kg CO₂ |

`evaluateBadges(stats, earnedIds): string[]` returns **newly** earned ids; UI celebrates them; `badgeStore` persists `{ id, earnedAt }`.

---

## 9. Data models (`src/domain/types.ts`)
```ts
export type Grade = 'A' | 'B' | 'C' | 'D';
export type Route = 'resell' | 'donate' | 'recycle';
export type GarmentType =
  | 'onesie' | 'top' | 'pants' | 'dress' | 'jacket' | 'sleepwear' | 'accessory' | 'unknown';

export interface Defect { label: string; confidence: number; severity: 'minor' | 'moderate' | 'major'; }

export interface ScanResult {
  type: GarmentType;
  grade: Grade;
  defects: Defect[];
  recommendedRoute: Route;
  imageUri: string;
  annotatedUri?: string;
  confidence: number;
}

export interface Saving { waterL: number; co2Kg: number; divertedKg: number; }

export interface GarmentEvent {
  id: string;
  at: string;          // ISO
  grade: Grade;
  route: Route;
  saving: Saving;
}

export interface Garment {
  id: string;
  createdAt: string;   // ISO
  imageUri: string;    // local file in document directory
  type: GarmentType;
  grade: Grade;
  defects: Defect[];
  route?: Route;       // undefined = saved but not routed yet
  saving?: Saving;     // undefined until routed
  nickname?: string;
  events: GarmentEvent[];  // logged history (grade, route, saving)
}

export interface MilestoneProgress {
  milestonesReached: number;
  currentValue: number;
  nextThreshold: number;
  progress: number;       // 0–1 fraction toward next
}

export interface ProfileStats {
  totalGarments: number;          // routed garments
  totalWaterL: number;
  totalCo2Kg: number;
  totalDivertedKg: number;
  byRoute: Record<Route, number>;
  waterMilestone: MilestoneProgress;
  co2Milestone: MilestoneProgress;
  combinedMilestones: number;     // water + CO₂ milestones reached (drives LevelPlant)
  plantGrowthStage: number;       // mapped from combinedMilestones
}
```

---

## 10. State management & persistence
- **`closetStore`** (persisted): `garments: Garment[]`; `addGarment`, `updateGarment(id, patch)`, `routeGarment(id, route)` (computes saving via domain, appends GarmentEvent), `removeGarment(id)` (deletes the garment; derived totals update automatically), `getById`.
- **`scanStore`** (NOT persisted): `imageUri`, `result`, `status: 'idle'|'analyzing'|'done'|'error'`, `analyze()`, `reset()`.
- **`badgeStore`** (persisted): `earned: { id: string; earnedAt: string }[]` only.
- **`settingsStore`** (persisted): `textSize: 'normal'|'large'|'xlarge'`, `reduceMotion: boolean`, `name?`, `hasOnboarded`.
- **`profileSelectors`** (no store): `getProfileStats(garments)` derives all totals, milestone progress, combined milestone count, and plant growth stage. Components subscribe to closetStore and compute via selector. **Totals and milestones are never stored.**
- Persistence: Zustand `persist` + `createJSONStorage(() => AsyncStorage)`. Keep persisted shapes versioned (`version: 1`) with a no-op `migrate` so future changes don't crash old installs.
- **Images:** copied into `documentDirectory + 'garments/'` via `expo-file-system/legacy`; store only the local uri.

---

## 11. The grading service seam (swap the mock later)
```ts
// src/data/services/gradingService.ts
export interface GradingService { analyze(imageUri: string): Promise<ScanResult>; }
```
**`MockGradingService`**: resolves after ~1.2s and returns the next fixture from a **deterministic cycle** (no randomness — demos must be rehearsable):
1. top / **A** / no defects → resell
2. onesie / **B** / [pilling minor] → resell
3. pants / **C** / [small stain moderate] → donate
4. jacket / **D** / [tear major] → recycle
…then repeats. Persist the cycle index in memory only. Validate every result with a zod schema before returning. The app imports a single `gradingService` instance from one module; swapping in the real CV later must require **zero UI changes**. No model logic in components.

---

## 12. Coding standards & safety
- **TypeScript strict.** No `any`. Discriminated unions for `Grade`/`Route`/`GarmentType`; exhaustive `switch` with a `never` default.
- **Pure domain layer:** no React imports, no side effects, fully unit-tested. UI never re-implements domain math.
- **Single source of truth:** totals derive from the closet (Section 4 state-integrity rule).
- **Validate boundaries** with zod (grading results, places JSON, route param).
- **Errors handled, not swallowed:** typed try/catch on async; every screen has a friendly error state with a next step; top-level ErrorBoundary (expo-router supports exporting one).
- **No secrets in the client:** only `EXPO_PUBLIC_PLACES_API_KEY` (optional) via env; never committed; app fully functional without it.
- **Privacy by default:** on-device only; no account, analytics, or tracking. Stated in Settings.
- **Lint/format:** ESLint + Prettier; small single-purpose modules; consistent naming.
- **Performance:** `FlatList` for the closet, memoized cards, compressed images.
- **Testing (jest-expo preset):** MUST cover `impact.ts` (every type × route × grade-bonus case, rounding), `gamification.ts` (both milestone ladders, combined-milestone-to-plant-stage mapping, badge thresholds, newly-earned badge diffs, anti-double-award), `grading-rules.ts` (mapping), and `profileSelectors` (sum correctness incl. unrouted garments contributing nothing, milestone progress, plant stage after garment removal). Add a flow test: scan(mock) → result → route → closet count increments.
- **Microcopy:** active voice; a button's label matches its result ("Donate it" → "Donated!"). Empty/error states give direction, not mood.

---

## 13. Sources screen content (use these exact strings; do not invent)
- "Extending a garment's life by 9 months cuts its carbon, water, and waste footprint by ~20–30% — WRAP / Ellen MacArthur Foundation."
- "Reusing one garment saves ~3 kg CO₂ and uses ~0.01% of the water of making a new one — EuRIC textile LCA, 2023."
- "~2,700 liters of water go into a single new cotton t-shirt — European Parliament / WWF."
- "Less than 1% of clothing material is recycled into new clothing — Ellen MacArthur Foundation."
- Footer: "Per-garment figures in this app are estimates scaled from these published sources to children's garment sizes, and are shown to make your impact visible — not as exact measurements."

---

## 14. Build order (milestones — build ONLY the requested one, then stop)
1. ✅ **Foundations:** design system (Cut-Paper Classroom), fonts, core components, Hammie mascot.
2. ✅ **Domain layer + tests:** types, constants, impact engine, gamification (water/CO₂ milestones), grading-rules.
3. ✅ **Stores + persistence + MockGradingService** (+ zod schemas).
4. ✅ **Vertical slice (UI):** Scan → Analyzing → Result → Route(save) → Closet updates. Works end to end with the mock grader. Hammie in header, count-up animations, milestone bar, garment removal.
5. **Closet polish + Garment detail:** filter chips (All/Resell/Donate/Recycle with counts), empty state, garment detail screen with history + delete + nickname.
6. **Profile polish + Badges:** LevelPlant driven by combined milestones, both milestone ladders displayed, full Badges grid (earned/locked), route breakdown.
7. **Route actions for real:** Resell (listing preview + eBay deep-link + Facebook "coming soon" + copy/share), Donate (3 nearest locations + tap-to-maps), Recycle (3 nearest locations + tap-to-maps), success/celebration states with badge unlocks.
8. **Onboarding, Settings (incl. Sources), accessibility pass, reduce-motion, polish, remove dev route.**

At the end of EVERY milestone: run `npx tsc --noEmit` and `npm test`, report results, summarize what was built and what the user should check, and STOP.

---

## 15. Definition of done (quality bar)
- Full Scan → Result → Route → Closet → Profile loop works end to end on a phone via Expo Go using the mock grader, offline, with no API keys.
- Every screen has proper empty, loading, and error states.
- Accessibility mandate met: large targets, scalable text, AA contrast, screen-reader labels, reduce-motion respected.
- Domain math unit-tested; profile totals always equal the sum of item savings; badges never double-award.
- It looks and feels like a real, warm consumer app a parent would happily use — not a prototype.