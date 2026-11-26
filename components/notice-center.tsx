"use client";

import { useEffect, useRef, useState } from "react";
import { AccessibleDialog } from "./accessible-dialog";
import { DeskLocalized } from "./desk-language";
import { logDeskFailure } from "../lib/desk-api";

export type WebNotice = { id: string; title: string; body: string };

export function useNoticeCenter(scope: string, initial: WebNotice[], load: (signal?: AbortSignal) => Promise<WebNotice[]>) {
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<WebNotice[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const loadRef = useRef(load);
  const initialRef = useRef(initial);
  const refreshRef = useRef<() => void>(() => {});
  loadRef.current = load;
  initialRef.current = initial;
  useEffect(() => {
    setOpen(false);
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
    const controller = new AbortController();
    const refresh = async () => {
      if (cancelled || inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        const next = await loadRef.current(controller.signal);
        if (cancelled) return;
        setNotices(next);
      } catch (error) {
        if (!cancelled && !controller.signal.aborted) logDeskFailure("notifications.refresh", error);
      } finally { inFlight = false; }
    };
    refreshRef.current = () => { void refresh(); };
    // The full dashboard response already contains the initial notices.
    return () => {
      cancelled = true;
      controller.abort();
      refreshRef.current = () => {};
    };
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
  const openNotices = () => {
    if (scope && notices.length) {
      setRead((current) => {
        const next = [...new Set([...current, ...notices.map((item) => item.id)])].slice(-500);
        try { localStorage.setItem(`tradepulse.notice-read:${scope}`, JSON.stringify(next)); }
        catch { /* The current session can still show notices without browser storage. */ }
        return next;
      });
    }
    setOpen(true);
    refreshRef.current();
  };
  return { open, setOpen, openNotices, notices,
    unread: notices.filter((item) => !read.includes(item.id)).length };
}

export function NoticeCenter({ center, onPreferences }: {
  center: ReturnType<typeof useNoticeCenter>; onPreferences: () => void;
}) {
  if (!center.open) return null;
  return <DeskLocalized><AccessibleDialog label="Notifications" onClose={() => center.setOpen(false)}>
    <h2>Notifications</h2>
    {center.notices.length ? center.notices.map((item) => <div className="activity-row" key={item.id}>
      <div className="activity-info"><strong>{item.title}</strong><p>{item.body}</p></div>
    </div>) : <p>No current notices.</p>}
    <button type="button" className="ghost-action" onClick={onPreferences}>Telegram notification preferences</button>
    <button type="button" className="ghost-action" onClick={() => center.setOpen(false)}>Close</button>
  </AccessibleDialog></DeskLocalized>;
}
