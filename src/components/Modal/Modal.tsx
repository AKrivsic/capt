// src/components/Modal/Modal.tsx
"use client";

import { useEffect, useRef } from "react";
import styles from "./Modal.module.css";

type CloseMethod = "esc" | "overlay" | "button";

type ModalProps = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  /** Volitelné: zavolá se s důvodem zavření ("esc" | "overlay" | "button") */
  onCloseReason?: (method: CloseMethod) => void;
  children: React.ReactNode;
};

export default function Modal({ isOpen, title, onClose, onCloseReason, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  // Body scroll lock + zapamatování fokusu
  useEffect(() => {
    if (!isOpen) return;
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      // návrat fokusu
      lastFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseReason?.("esc");
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, onCloseReason]);

  // Basic focus trap (keeps focus inside dialog)
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const selector =
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => dialog.querySelectorAll<HTMLElement>(selector);
    const focusable = getFocusable();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };

    document.addEventListener("keydown", trap);
    // Focus the first focusable or dialog
    (first || dialog).focus();

    return () => document.removeEventListener("keydown", trap);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
      onMouseDown={(e) => {
        // close when clicking outside dialog
        if (e.target === overlayRef.current) {
          onCloseReason?.("overlay");
          onClose();
        }
      }}
      ref={overlayRef}
    >
      <div className={styles.dialog} ref={dialogRef} tabIndex={-1}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            className={styles.close}
            onClick={() => {
              onCloseReason?.("button");
              onClose();
            }}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
