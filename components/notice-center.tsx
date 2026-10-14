"use client";

import { useEffect, useRef, useState } from "react";
import { AccessibleDialog } from "./accessible-dialog";

export type WebNotice = { id: string; title: string; body: string };

export function useNoticeCenter(scope: string, initial: WebNotice[], load: () => Promise<WebNotice[]>) {
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<WebNotice[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [refreshError, setRefreshError] = useState(false);
  const loadRef = useRef(load);
  const initialRef = useRef(initial);
  loadRef.current = load;
  initialRef.current = initial;
  useEffect(() => {
    setOpen(false);
    setRefreshError(false);
    setNotices(initialRef.current);
    let saved: string[] = [];
    try {
      const value: unknown = JSON.parse(localStorage.getItem(`tradepulse.notice-read:${scope}`) || "[]");
      if (Array.isArray(value)) saved = value.filter((id): id is string => typeof id === "string");
    } catch { /* Read state remains available for this session. */ }
    setRead(saved);
    if (!scope) return;
    let cancelled = false;
    let inFlight = false;
    const refresh = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        const next = await loadRef.current();
        if (cancelled) return;
        setNotices(next);
        setRefreshError(false);
      } catch {
        if (!cancelled) setRefreshError(true);
      } finally { inFlight = false; }
    };
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [scope]);
  useEffect(() => {
    if (!open || !scope || !notices.length) return;
    setRead((current) => {
      const next = [...new Set([...current, ...notices.map((item) => item.id)])].slice(-500);
      if (next.length === current.length && next.every((id, index) => id === current[index])) return current;
      try { localStorage.setItem(`tradepulse.notice-read:${scope}`, JSON.stringify(next)); }
      catch { /* The current session can still show notices without browser storage. */ }
      return next;
    });
  }, [open, scope, notices]);
  return { open, setOpen, notices, refreshError,
    unread: notices.filter((item) => !read.includes(item.id)).length };
}

export function NoticeCenter({ center, onPreferences }: {
  center: ReturnType<typeof useNoticeCenter>; onPreferences: () => void;
}) {
  if (!center.open) return null;
  return <AccessibleDialog label="Notifications" onClose={() => center.setOpen(false)}>
    <h2>Notifications</h2>
    {center.refreshError && <p role="status">Updates unavailable. Showing the last received notices; retrying automatically.</p>}
    {center.notices.length ? center.notices.map((item) => <div className="activity-row" key={item.id}>
      <div className="activity-info"><strong>{item.title}</strong><p>{item.body}</p></div>
    </div>) : <p>No current notices.</p>}
    <button type="button" className="ghost-action" onClick={onPreferences}>Telegram notification preferences</button>
    <button type="button" className="ghost-action" onClick={() => center.setOpen(false)}>Close</button>
  </AccessibleDialog>;
}
