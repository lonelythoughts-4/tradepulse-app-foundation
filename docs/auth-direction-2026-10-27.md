# TradePulse welcome and authentication surface

Mode: Operate. Scope: public welcome and authentication surface. Keep the existing BrowserBotHandoff as the only sign-in mechanism.

## Direction contract

THESIS: Adapt the welcome and sign-in hierarchy from `tradepulse-welcome-gateway` to this app's existing Telegram-confirmed browser handoff.

OWN-WORLD: Use the gateway's light editorial direction, indigo pulse accent, compact wordmark, and responsive navigation. Light is the default; a saved dark preference remains available.

STORY: Understand the desk, confirm the browser in Telegram, and return automatically. Security guidance stays next to the real sign-in control.

FIRST VIEWPORT: Desktop pairs the gateway headline with the current sign-in handoff. Narrow screens stack the welcome copy and handoff, keep navigation and the primary action accessible, and reflow at phone widths. Pulse motion respects reduced-motion preferences.

FORM: Preserve the existing handoff start, confirmation polling, retry, and automatic session completion behavior. The API returns a QR encoding the same short-lived Telegram URL as the direct link; both complete through the existing handoff poll and HttpOnly session. Do not copy the source repository's email form or simulated Telegram success flow; neither is this app's auth contract. Source reference: https://github.com/lonelythoughts-4/tradepulse-welcome-gateway

FINISH: Verify the QR decodes to the backend-issued handoff URL and completes through the real Telegram flow, along with theme preference, mobile reflow, keyboard focus, and handoff error/waiting states.

## Asset sources

The pulse mark and underline are inline vector geometry adapted from the supplied gateway source. No external image assets or new dependencies are required.
