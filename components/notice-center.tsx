"use client";

import { useEffect, useRef, useState } from "react";
import { AccessibleDialog } from "./accessible-dialog";

export type WebNotice = { id: string; title: string; body: string };

export function useNoticeCenter(scope: string, initial: WebNotice[], load: () => Promise<WebNotice[]>) {
  const [open, setOpen] = useState(false);
  const [notices, setNotices] = useState<WebNotice[]>([]);
  const [read, setRead] = useState<string[]>([]);
  const [sound, setSound] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [refreshError, setRefreshError] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const soundEnabled = useRef(false);
  const received = useRef(new Set<string>());
  const loadRef = useRef(load);
  const initialRef = useRef(initial);
  loadRef.current = load;
  initialRef.current = initial;
  const chime = () => {
    const context = audio.current;
    if (!context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0, context.currentTime);
    gain.gain.linearRampToValueAtTime(0.045, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  };
  useEffect(() => {
    setOpen(false);
    setSound(false);
    soundEnabled.current = audio.current?.state === "running";
    setSound(soundEnabled.current);
    setFeedback("");
    setRefreshError(false);
    setNotices(initialRef.current);
    received.current = new Set(initialRef.current.map((item) => item.id));
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
        const hasNew = next.some((item) => !received.current.has(item.id));
        next.forEach((item) => received.current.add(item.id));
        setNotices(next);
        setRefreshError(false);
        if (hasNew && soundEnabled.current && document.visibilityState === "visible") chime();
      } catch {
        if (!cancelled) setRefreshError(true);
      } finally { inFlight = false; }
    };
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [scope]);
  useEffect(() => {
    const activateAudio = () => {
      if (audio.current?.state === "running") return;
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume().then(() => {
          soundEnabled.current = audio.current?.state === "running";
          setSound(soundEnabled.current);
        }).catch(() => setFeedback("Browser audio is unavailable. Visual notifications still work."));
      } catch { setFeedback("Browser audio is unavailable. Visual notifications still work."); }
    };
    window.addEventListener("pointerdown", activateAudio);
    window.addEventListener("keydown", activateAudio);
    return () => {
      window.removeEventListener("pointerdown", activateAudio);
      window.removeEventListener("keydown", activateAudio);
      void audio.current?.close().catch(() => undefined);
      audio.current = null;
    };
  }, []);
  const markRead = () => {
    const next = [...new Set([...read, ...notices.map((item) => item.id)])].slice(-500);
    setRead(next);
    try { localStorage.setItem(`tradepulse.notice-read:${scope}`, JSON.stringify(next)); }
    catch { setFeedback("Marked read for this session; browser storage is unavailable."); }
  };
  return { open, setOpen, notices, read, sound, feedback, refreshError, markRead,
    unread: notices.filter((item) => !read.includes(item.id)).length };
}

export function NoticeCenter({ center, onPreferences }: {
  center: ReturnType<typeof useNoticeCenter>; onPreferences: () => void;
}) {
  if (!center.open) return null;
  return <AccessibleDialog label="Notifications" onClose={() => center.setOpen(false)}>
    <h2>Notifications</h2>
    <p>Current account notices, refreshed every 30 seconds. Read status is saved in this browser—not synced with Telegram.</p>
    {center.refreshError && <p role="status">Updates unavailable. Showing the last received notices; retrying automatically.</p>}
    {center.notices.length ? center.notices.map((item) => <div className="activity-row" key={item.id}>
      <div className="activity-info"><strong>{item.title}{center.read.includes(item.id) ? "" : " · Unread"}</strong><p>{item.body}</p></div>
    </div>) : <p>No current notices.</p>}
    <div className="button-row">
      <button type="button" className="small-action" disabled={!center.unread} onClick={center.markRead}>Mark all as read</button>
    </div>
    <p>{center.sound ? "Sound is active for new notices while this tab is visible." : "Sound starts after your first interaction, subject to browser and device restrictions."} Telegram sound is controlled in Telegram.</p>
    {center.feedback && <p role="status">{center.feedback}</p>}
    <button type="button" className="ghost-action" onClick={onPreferences}>Telegram notification preferences</button>
    <button type="button" className="ghost-action" onClick={() => center.setOpen(false)}>Close</button>
  </AccessibleDialog>;
}
