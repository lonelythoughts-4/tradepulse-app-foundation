export function SessionExpiredState({ onReauthenticate }: { onReauthenticate?: () => void }) {
  return (
    <main className="system-state session-expired-state">
      <img src="/illustrations/session-door.png" alt="Open door for session reauthentication" className="system-state-art session-door-art" />
      <span className="eyebrow">SESSION EXPIRED</span>
      <h1>Your session has ended.</h1>
      <p>Sign in again to continue. Your saved settings and balances remain protected.</p>
      <button className="primary-action" onClick={onReauthenticate}>Re-authenticate</button>
    </main>
  )
}
