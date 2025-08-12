// src/components/HeaderAuth/HeaderAuth.tsx
"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import styles from "./HeaderAuth.module.css";

export default function HeaderAuth() {
  const { data: session, status } = useSession();
  const isClientAuthed = Boolean(session?.user);

  if (status === "loading") return null;

  if (!isClientAuthed) {
    return (
      <button
        onClick={() => signIn(undefined, { callbackUrl: "/" })}
        className={styles.btnSign}
      >
        Sign in
      </button>
    );
  }

  return (
    <div className={styles.authBox}>
      <span className={styles.plan}>
        {session?.user?.plan ?? "FREE"}
      </span>
      <button onClick={() => signOut()} className={styles.btnSign}>
        Sign out
      </button>
    </div>
  );
}
