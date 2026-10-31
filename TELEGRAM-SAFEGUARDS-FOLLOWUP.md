# Telegram Synthetic safeguards

The Telegram implementation is deployed with the following safeguards. The
Telegram service remains the authoritative execution client; this web
repository records the customer-facing contract and its verification status.

- Manual orders and signal submissions have a final review showing market,
  direction, margin, funding source, and contract/risk terms.
- Enabling Auto requires an explicit acknowledgement that it may place future
  wallet-funded orders without individual approval.
- A submitted manual order and an Auto-mode transition visibly remain in
  progress. Going back to controls does not imply that an already-submitted
  request was cancelled.
- Manual submissions retain one durable idempotency key across retries; an
  in-progress marker rejects repeat confirmation taps. Choosing Manual clears
  an unconfirmed Auto review so stale callbacks cannot conflict with the mode.

Keep the existing backend, financial calculations, authentication, and settlement rules authoritative. Telegram already has an Admin withdrawal detail cross-check; do not replace it with a redundant flow.
