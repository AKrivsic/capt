// src/components/HeaderAuth/HeaderAuth.tsx
"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import styles from "./HeaderAuth.module.css";
import { trackSignupStart, trackLogoutClick } from "@/utils/tracking";

export default function HeaderAuth() {
  const { data: session, status } = useSession();
  const isClientAuthed = Boolean(session?.user);

  if (status === "loading") return null;

  if (!isClientAuthed) {
    return (
      <button
        onClick={() => {
          trackSignupStart("header");
          void signIn(undefined);
        }}
        className={styles.btnSign}
        aria-label="Sign in"
        data-testid="btn-sign-in"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className={styles.authBox}>
      <span className={styles.plan}>{session?.user?.plan ?? "FREE"}</span>
      <button
        onClick={() => {
          trackLogoutClick("header");
          void signOut();
        }}
        className={styles.btnSign}
        aria-label="Sign out"
        data-testid="btn-sign-out"
      >
        Sign out
      </button>
    </div>
  );
}
