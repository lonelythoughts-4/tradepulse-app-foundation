# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Inferred from the existing application and confirmed project brief: TradePulse users manage funded Memecoin and Synthetic allocations from Telegram and the web app. Admins operate settlement, risk, support, and treasury controls.

## Product Purpose

TradePulse gives users one place to review wallet equity, allocate capital to products, operate bots, trade Synthetic markets, manage deposits and withdrawals, and review activity. Success means a user can understand account state and complete a safe action without ambiguity.

## Positioning

The product joins Telegram-native access with a shared web operating desk and internal, auditable product allocation flows.

## Operating Context

Users may arrive from Telegram on a phone, from a desktop browser handoff, or through an authenticated Mini App session. Core work includes checking balances, funding products, controlling bots, placing Synthetic orders, and resolving support or withdrawal-security steps.

## Capabilities and Constraints

- Preserve the current routes, visual identity, illustrations, custom SVG icons, and information architecture.
- Keep Memecoin and Synthetic product flows distinct while sharing wallet/account state.
- Preserve server-authenticated API behavior, Mongo-backed market state, wallet safeguards, and admin-only controls.
- Improve clarity, accessibility, responsive behavior, and consistency without changing API contracts or business logic.
- MANUAL remains the default execution mode; AUTO is explicit opt-in.

## Brand Commitments

TradePulse's incumbent identity is a dark, restrained operations desk with indigo and mint semantic accents, compact data typography, custom hand-drawn illustrations, and a precise trading-console tone.

## Evidence on Hand

The repository contains the incumbent dashboard shell, wallet/deposit/withdrawal flows, bot builder and detail screens, Synthetic/Live Desk, account/support/recovery states, admin controls, responsive bottom navigation, custom icons, and illustrations under `public/`.

## Product Principles

- Make financial state legible before asking for action.
- Keep risky actions explicit, reviewable, and recoverable.
- Use the same meaning and state across Telegram and web.
- Prefer calm operational clarity over decoration.
- Preserve user control across mobile and desktop.

## Accessibility & Inclusion

The application should support keyboard navigation, visible focus, screen readers, touch targets of at least 44px, readable contrast, reduced-motion preferences, and narrow screens down to 360px.
