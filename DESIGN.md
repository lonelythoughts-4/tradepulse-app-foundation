---
name: TradePulse
description: Light-default operations desk for Telegram-authenticated trading workflows.
colors:
  background: "#f4f1ea"
  surface: "#fffdf8"
  muted-surface: "#e8e9e7"
  foreground: "#172032"
  muted-foreground: "#59657a"
  primary: "#5264d9"
  positive: "#34d399"
  warning: "#fbbf24"
  danger: "#f87171"
  border: "rgba(28,42,65,.15)"
  dark-background: "#07090d"
  dark-surface: "#0c1017"
  dark-muted-surface: "#111722"
  dark-foreground: "#e6eaf2"
  dark-muted-foreground: "#9aa4b8"
  dark-primary: "#7c8cf8"
  dark-border: "rgba(148,163,184,.14)"
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
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.sm}"
    padding: "12px"
  surface-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "18px"
---

# Design System: TradePulse

## Overview

TradePulse is a dense operations desk for authenticated trading, wallet, and support workflows. The warm-paper light theme is the first-visit default; a saved preference may select the dark palette. Both use indigo actions and semantic mint, amber, and red states, paired with data typography and compact geometric headings.

The visual language is task-oriented rather than marketing-oriented: financial state, status, safeguards, and action boundaries appear before decorative treatment. Hand-drawn illustrative assets are reserved for onboarding, recovery, completion, and exception states.

**Key Characteristics:**

- Warm-paper product surfaces by default, with a layered dark alternative.
- Indigo as the principal action and navigation accent.
- Mint, amber, and red consistently signal positive, review/pending, and dangerous states.
- Compact mono labels and numeric values alongside Space Grotesk headings.
- Desktop sidebar and mobile bottom-navigation shells around the same workspace.

## Colors

The default palette is warm paper with restrained semantic color for live status and risk. Users may save dark mode as a preference.

### Primary

- **Indigo action accent** (`primary`): Primary calls to action, active segments, focus treatment, selected cards, branding, and notification counts.

### Secondary

- **Mint status accent** (`positive`): Live, successful, credited, and positive-value states.
- **Amber review accent** (`warning`): Pending, paused, and cautionary states.
- **Red risk accent** (`danger`): Destructive actions and negative values.

### Neutral

- **Warm-paper ground** (`background`) and **ivory surface** (`surface`): Application background and raised panels.
- **Slate ink** (`foreground`) and **muted slate** (`muted-foreground`): Content and label hierarchy.
- **Deeper indigo** (`primary`): Actions, focus, selection, and navigation.
- **Subtle slate border** (`border`): Quiet surface separation.

### Optional dark mode

- **Near-black ground** (`dark-background`) and **raised dark surface** (`dark-surface`) preserve the operational hierarchy.
- **Cool light text** (`dark-foreground`) and **blue-gray supporting text** (`dark-muted-foreground`) keep labels legible.
- **Brighter indigo** (`dark-primary`) carries the same action and selection meaning.
- Semantic colors preserve their meaning across both themes.

**The Semantic Color Rule.** Mint, amber, and red communicate state. They must not be repurposed as ornamental theme colors.

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

**Implementation note.** The code names all three families, but does not load them through `next/font`, `@font-face`, or a remote stylesheet. The resulting typeface is therefore dependent on each client’s installed fonts and fallback behavior.

## Layout

Desktop uses a fixed, collapsible 236px sidebar (72px collapsed) with independently scrolling main content. The central workspace is constrained to 1200px and uses 42px horizontal desktop padding at 1024px and above.

Mobile hides the sidebar and fixes a scrollable bottom navigation to the viewport. Main content reserves bottom space for it. The primary desktop-to-mobile navigation pivot occurs at 861px; component grids add layouts at 700px and desktop density increases at 1024px. Additional narrow-screen conditions occur around 520px and 380px.

Cards use mostly 14–24px internal padding and 9–18px inter-card gaps. Larger workflow pages adopt single-column rails; wallet statistics, action cards, and dashboard modules become grids at larger breakpoints.

## Elevation & Depth

Depth is a hybrid of tonal layering, translucent hairline borders, gradients, and soft black shadows. `gradient-panel` is the recurring elevated surface: a dark interior with a faint light-to-transparent border gradient and multi-level shadow. Fixed navigation and modal layers rely on blur and stronger shadows to separate them from active work.

## Shapes

The shape language is softly rounded: 7–10px for buttons, form fields, and compact controls; 12px for panels and large cards; 14–16px for feature artwork or larger surfaces; and full circles for avatars, status dots, and progress rings. Chips span two patterns: compact 5px status chips and 99/999px pills for filters and toggles.

## Components

### Buttons

- **Primary:** Indigo, dark text, bold compact label, 7–8px corners, and a shallow raised/pressed treatment. Several definitions vary between compact and full-width workflow actions.
- **Secondary / text action:** Transparent or dark-surface controls with indigo text and minimal borders.
- **Danger:** Warm red fill with dark text and a more pronounced lower shadow.
- **Focus:** Global visible focus is an indigo outline with offset; some controls add contextual rings.

### Cards / Containers

- **GradientPanel:** The principal container: dark surface, 12px corner, translucent gradient border, and layered black shadow.
- **Workflow cards:** Narrower single-column panels for deposit, withdrawal, support, security, and modal confirmation steps.
- **Data rows:** Fine translucent top/bottom rules split ledger, activity, admin, and support lists rather than using full boxed tables.

### Inputs / Fields

- **Style:** Dark fill, muted translucent border, 7–10px corners, light foreground text.
- **Amount field:** Large mono input with indigo currency prefix and emphasized lower boundary.
- **Choice grid:** Stacked, bordered selectable rows for asset and network selection; selected/hover states shift the border toward indigo.

### Navigation

- **Desktop:** Collapsible left rail with icon-and-label rows, dark selected fill, and pale-indigo active text.
- **Mobile:** Fixed bottom bar with five primary destinations plus a More menu; active entries add a tinted rounded icon backdrop and a brief icon-draw animation.
- **Account access:** Desktop profile control at the sidebar foot; mobile includes Account in the primary bar.

### Status / Feedback

- **Status chips:** Small mono labels with matching semantic foreground and tinted background.
- **Modal:** Bottom-aligned on smaller screens and constrained to 480px, with a dark scrim, elevated panel, and explicit review/cancel controls.
- **System states:** Dedicated illustrations, eyebrow labels, clear factual copy, and a primary recovery route for unauthenticated, expired-session, empty, and recovery states.

## Do's and Don'ts

### Do:

- **Do** preserve the current dark desk identity, semantic status colors, hand-drawn exception-state illustrations, and compact data typography.
- **Do** keep risky financial actions explicit through review surfaces, factual summaries, and destructive-action treatment.
- **Do** maintain one task model across the desktop sidebar and mobile bottom navigation.
- **Do** use existing icons from `public/icons/` or existing inline SVG treatments and existing illustrations from `public/illustrations/`.

### Don't:

- **Don't** introduce a new brand direction, bright default canvas, alternative icon library, or replacement illustration style.
- **Don't** make green, amber, or red decorative; their incumbent meaning is operational state.
- **Don't** collapse distinct wallet, deposit, withdrawal, support, and recovery flows into a generic form surface.
- **Don't** treat legacy/mock screen definitions or disabled JSX branches as the live product without first reconciling them with the API-backed implementations.
