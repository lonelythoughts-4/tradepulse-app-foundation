# Deferred Telegram Synthetic safeguards

Follow up separately; no Telegram implementation is included in this web correction pass.

- Add a final review of market, direction, margin, and available risk/cost information before manual order or signal submission.
- Require explicit acknowledgement that Auto can place future orders without per-order approval.
- Provide cancellation before submission and safe return to controls while an already-submitted request resolves; dismissal must not imply cancellation of that request.
- Preserve a single submission identity across retries and prevent duplicate confirmations and conflicting execution-mode transitions.

Keep the existing backend, financial calculations, authentication, and settlement rules authoritative. Telegram already has an Admin withdrawal detail cross-check; do not replace it with a redundant flow.
