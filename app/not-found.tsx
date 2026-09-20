import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="system-state">
      <img src="/illustrations/lost-compass.png" alt="Compass pointing through an unknown route" className="system-state-art" />
      <span className="eyebrow">404 / UNKNOWN ROUTE</span>
      <h1>We lost that destination.</h1>
      <p>The page you requested does not exist or has moved.</p>
      <Link href="/" className="primary-action">Return to dashboard</Link>
    </main>
  )
}
