"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type DialogEntry = { backdrop: HTMLDivElement; panel: HTMLDivElement };
const dialogs: DialogEntry[] = [];
const backgroundState = new Map<HTMLElement, boolean>();
let bodyOverflow = "";
let htmlOverflow = "";
let bodyObserver: MutationObserver | null = null;

function syncDialogBackground() {
  const active = dialogs.at(-1);
  if (!active) return;
  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (!backgroundState.has(child)) backgroundState.set(child, child.inert);
    child.inert = child !== active.backdrop;
  }
}

function registerDialog(entry: DialogEntry) {
  if (dialogs.length === 0) {
    bodyOverflow = document.body.style.overflow;
    htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    bodyObserver = new MutationObserver(syncDialogBackground);
    bodyObserver.observe(document.body, { childList: true });
  }
  dialogs.push(entry);
  syncDialogBackground();
  return () => {
    const index = dialogs.indexOf(entry);
    if (index !== -1) dialogs.splice(index, 1);
    if (dialogs.length > 0) {
      syncDialogBackground();
      return;
    }
    bodyObserver?.disconnect();
    bodyObserver = null;
    for (const [element, inert] of backgroundState) element.inert = inert;
    backgroundState.clear();
    document.body.style.overflow = bodyOverflow;
    document.documentElement.style.overflow = htmlOverflow;
  };
}

function focusableControls(panel: HTMLDivElement) {
  return Array.from(panel.querySelectorAll<HTMLElement>(
    'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex]',
  )).filter((element) =>
    element.tabIndex >= 0 &&
    !element.matches(":disabled") &&
    !element.closest("[inert]") &&
    element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility !== "hidden",
  );
}

export function AccessibleDialog({
  children,
  onClose,
  label,
  labelledBy,
  describedBy,
  className = "",
  dismissible = true,
}: {
  children: ReactNode;
  onClose: () => void;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  className?: string;
  dismissible?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  const backdropPress = useRef(false);
  closeRef.current = onClose;
  dismissibleRef.current = dismissible;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!mounted || !backdrop || !panel) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const entry = { backdrop, panel };
    const unregister = registerDialog(entry);
    const initial = panel.querySelector<HTMLElement>("[data-dialog-initial-focus]");
    (initial || panel).focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (dialogs.at(-1) !== entry) return;
      if (event.key === "Escape" && !event.isComposing) {
        event.preventDefault();
        event.stopPropagation();
        if (dismissibleRef.current) closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusableControls(panel);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (dialogs.at(-1) === entry && event.target instanceof Node && !panel.contains(event.target)) {
        panel.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);
      unregister();
      if (opener?.isConnected && !opener.closest("[inert]") && !opener.matches(":disabled")) {
        opener.focus({ preventScroll: true });
      } else {
        dialogs.at(-1)?.panel.focus({ preventScroll: true });
      }
    };
  }, [mounted]);

  if (!mounted) return null;
  return createPortal(
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget; }}
      onClick={(event) => {
        if (backdropPress.current && event.target === event.currentTarget && dismissible) onClose();
        backdropPress.current = false;
      }}
    >
      <div
        ref={panelRef}
        className={`gradient-panel confirm-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : label}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
