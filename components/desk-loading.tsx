import styles from "./desk-loading.module.css";

/** Presentation only: the session request decides when this screen leaves. */
export function DeskLoading({
  status = "Opening your desk…",
  busy = true,
  onRetry,
}: {
  status?: string;
  busy?: boolean;
  onRetry?: () => void;
}) {
  return (
    <main className={styles.screen} aria-label="TradeMemo" aria-busy={busy}>
      <div className={styles.content}>
        <svg className={styles.mark} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path className={styles.track} d="M3 21h7l3-9 6 18 5-14 3 5h10" />
          <path className={busy ? styles.trace : styles.traceIdle} pathLength="100" d="M3 21h7l3-9 6 18 5-14 3 5h10" />
        </svg>
        <h1 className={styles.name}>Trade<span>Memo</span></h1>
        <p className={styles.status} role="status">{status}</p>
        {onRetry && (
          <button type="button" className={styles.retry} onClick={onRetry}>
            Retry connection
          </button>
        )}
      </div>
    </main>
  );
}
