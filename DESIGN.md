---
name: TradeMemo
description: Light-default operations desk for Telegram-authenticated trading workflows.
colors:
  light-background: "#f4f1ea"
  light-surface: "#fffdf8"
  light-raised-surface: "#e8e9e7"
  light-foreground: "#172032"
  light-muted-foreground: "#59657a"
  light-accent: "#5264d9"
  light-positive: "#2f7d55"
  light-warning: "#745300"
  light-danger: "#b64839"
  light-border: "rgba(28,42,65,.15)"
  dark-background: "#090c0d"
  dark-surface: "#0d1112"
  dark-raised-surface: "#151b19"
  dark-foreground: "#f4efe3"
  dark-muted-foreground: "#aeb2a7"
  dark-accent: "#e8b650"
  dark-accent-strong: "#f3cb72"
  dark-positive: "#4ea56f"
  dark-warning: "#fbbf24"
  dark-danger: "#d6654c"
  dark-border: "rgba(244,239,227,.14)"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontWeight: 600
    lineHeight: 1.1
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
  label:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "10px"
    fontWeight: 600
    letterSpacing: ".08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "999px"
spacing:
  space-4: "16px"
  space-5: "20px"
  space-6: "24px"
  space-7: "32px"
components:
  primary-action:
    backgroundColor: "{colors.dark-accent}"
    textColor: "#211a0d"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
  surface-card-light:
    backgroundColor: "{colors.light-surface}"
    rounded: "{rounded.md}"
    padding: "18px"
  surface-card-dark:
    backgroundColor: "{colors.dark-surface}"
    rounded: "{rounded.md}"
    padding: "18px"
---

# Design System: TradeMemo

## Overview

**Creative North Star: "The Telegram-Confirmed Operations Desk"**

TradeMemo is a compact operations desk for Telegram-authenticated trading, wallet, and support workflows. The first-visit theme is warm light; a saved preference selects the dark workspace. Both keep financial state, safeguards, and action boundaries ahead of decoration.

The light theme uses indigo for navigation and selected states; the dark theme uses warm gold for its accent and primary actions. Green, amber, and red remain operational signals. Space Grotesk, Inter, and JetBrains Mono are loaded with Next's font loader, pairing compact geometric headings with readable copy and tabular data. Hand-drawn illustrations are reserved for onboarding, recovery, completion, and exception states.

**Key Characteristics:**

- Warm-paper surfaces are the first-visit default, with a layered dark alternative.
- Indigo accents the light theme; warm gold accents the dark theme and primary actions.
- Green, amber, and red consistently signal positive, review/pending, and dangerous states.
- Space Grotesk headings, Inter body copy, and JetBrains Mono data labels are loaded through Next's font loader.
- Desktop sidebar and mobile bottom-navigation shells around the same workspace.

## Colors

The palette changes with the saved theme: warm paper and indigo in light mode, near-black and warm gold in dark mode. Semantic state colors remain distinct from the theme accent.

### Primary

- **Indigo light-theme accent** (`light-accent`): Active navigation, selected segments, focus treatment, and selected states in the default theme.
- **Warm-gold dark-theme accent** (`dark-accent`): Primary actions, active navigation, selected states, and focus treatment in the dark workspace.

### Secondary

- **Green positive state** (`light-positive`, `dark-positive`): Live, successful, credited, and positive-value states.
- **Amber review state** (`light-warning`, `dark-warning`): Pending, paused, and cautionary states.
- **Red risk state** (`light-danger`, `dark-danger`): Negative values and dangerous outcomes.

### Neutral

- **Warm-paper ground** (`light-background`) and **ivory surface** (`light-surface`): Default application background and raised panels.
- **Slate ink** (`light-foreground`) and **muted slate** (`light-muted-foreground`): Light-theme content and label hierarchy.
- **Near-black ground** (`dark-background`) and **deep green-black surfaces** (`dark-surface`, `dark-raised-surface`): Dark-theme background and layered panels.
- **Warm ivory ink** (`dark-foreground`) and **soft sage-gray** (`dark-muted-foreground`): Dark-theme content and supporting labels.
- **Theme-specific hairline borders** (`light-border`, `dark-border`): Quietly separate surfaces without introducing table-like boxes.

**The Semantic Color Rule.** Green, amber, and red communicate state. Do not repurpose them as ornamental theme colors.

## Typography

**Display Font:** Space Grotesk (with `sans-serif` fallback)

**Body Font:** Inter (with `ui-sans-serif, system-ui, sans-serif` fallbacks)

**Label/Mono Font:** JetBrains Mono (with `monospace` fallback)

**Character:** Headings establish compact product hierarchy; mono labels, values, activity timestamps, and status chips give the desk its operational cadence.

### Hierarchy

- **Display:** Space Grotesk, typically 600 weight at 20–38px; page and panel headings.
- **Body:** Inter at 14px by default; supporting product copy and controls.
- **Data value:** JetBrains Mono, commonly 11–24px; balances, prices, timestamps, and compact financial facts.
- **Label:** JetBrains Mono, usually 9–10px at 600 weight with added tracking; uppercase metadata and status context.

**Implementation note.** The root layout loads all three families through `next/font/google` and exposes them as CSS variables, with system fallbacks for unavailable font assets.

## Layout

Desktop uses a fixed, collapsible 236px sidebar (72px collapsed) with independently scrolling main content. The central workspace is constrained to 1200px and uses 42px horizontal desktop padding at 1024px and above.

Mobile hides the sidebar and fixes a scrollable bottom navigation to the viewport. Main content reserves bottom space for it. The primary desktop-to-mobile navigation pivot occurs at 861px; component grids add layouts at 700px and desktop density increases at 1024px. Additional narrow-screen conditions occur around 520px and 420px.

Cards use mostly 14–24px internal padding and 9–18px inter-card gaps. Larger workflow pages adopt single-column rails; wallet statistics, action cards, and dashboard modules become grids at larger breakpoints.

## Elevation & Depth

Depth is a hybrid of tonal layering, translucent hairline borders, gradients, and soft shadows. In dark mode, `gradient-panel` uses a deep interior, a faint light-to-transparent border gradient, and a multi-level shadow; in light mode, cards use paper surfaces, a subtle border, and a soft foreground shadow. Fixed navigation and modal layers use stronger separation from active work.

## Shapes

The shape language is softly rounded: 7–10px for buttons, form fields, and compact controls; 12px for panels and large cards; 14–16px for feature artwork or larger surfaces; and full circles for avatars, status dots, and progress rings. Chips span two patterns: compact 5px status chips and 99/999px pills for filters and toggles.

## Components

### Buttons

- **Primary:** Warm-gold fill with dark ink, a bold compact label, 8px corners, and a shallow raised treatment. Workflow actions may be compact or full-width.
- **Secondary / text action:** Transparent or theme-surface controls using the active theme accent with minimal borders.
- **Danger:** Use the semantic risk color only for a genuinely destructive or negative state.
- **Focus:** A visible 2px theme-accent outline with offset; some controls add contextual rings.

### Cards / Containers

- **GradientPanel:** The principal container: theme-aware surface, 12px corner, subtle border, and layered shadow; dark mode adds a translucent gradient border.
- **Workflow cards:** Narrower single-column panels for deposit, withdrawal, support, security, and modal confirmation steps.
- **Data rows:** Fine translucent top/bottom rules split ledger, activity, admin, and support lists rather than using full boxed tables.

### Inputs / Fields

- **Style:** Theme-aware fill, quiet border, 7–10px corners, and a foreground that follows the selected theme.
- **Amount field:** Large mono input with a theme-accent currency prefix and emphasized lower boundary.
- **Choice grid:** Stacked, bordered selectable rows for asset and network selection; selected/hover states shift the border toward the theme accent.

### Navigation

- **Desktop:** Collapsible left rail with icon-and-label rows and theme-specific active treatment.
- **Mobile:** Fixed bottom bar with primary destinations plus a More menu; active entries add a tinted rounded icon backdrop and a brief icon-draw animation.
- **Account access:** Desktop profile control at the sidebar foot; mobile includes Account in the primary bar.

### Status / Feedback

- **Status chips:** Small mono labels with matching semantic foreground and tinted background.
- **Modal:** Bottom-aligned on smaller screens and constrained to 480px, with a scrim, elevated theme-aware panel, and explicit review/cancel controls.
- **System states:** Dedicated illustrations, eyebrow labels, clear factual copy, and a primary recovery route for unauthenticated, expired-session, empty, and recovery states.

## Do's and Don'ts

### Do:

- **Do** preserve the warm-light default and the distinct dark workspace palette, semantic status colors, hand-drawn exception-state illustrations, and compact data typography.
- **Do** use the theme-specific accent for selection and action feedback; keep state colors reserved for their meanings.
- **Do** keep risky financial actions explicit through review surfaces, factual summaries, and destructive-action treatment.
- **Do** maintain one task model across the desktop sidebar and mobile bottom navigation.
- **Do** use existing icons from `public/icons/` or existing inline SVG treatments and existing illustrations from `public/illustrations/`.

### Don't:

- **Don't** introduce an unrelated brand direction, alternative icon library, or replacement illustration style.
- **Don't** make green, amber, or red decorative; their incumbent meaning is operational state.
- **Don't** collapse distinct wallet, deposit, withdrawal, support, and recovery flows into a generic form surface.
- **Don't** treat legacy/mock screen definitions or disabled JSX branches as the live product without first reconciling them with the API-backed implementations.
