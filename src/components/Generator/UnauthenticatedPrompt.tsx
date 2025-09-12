"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
// import { styleMeta } from "@/constants/styleMeta";
import styles from "./UnauthenticatedPrompt.module.css";

export default function UnauthenticatedPrompt() {
  const { data: session } = useSession();
  const [selectedStyle, setSelectedStyle] = useState('Barbie');
  const [platformColor, setPlatformColor] = useState<string | null>(null);


  // Sleduj změny stylu (custom event + localStorage)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedPrefs = localStorage.getItem('captioni_pref_v1');
      if (savedPrefs) {
        try {
          const prefs = JSON.parse(savedPrefs);
          if (prefs.style) {
            setSelectedStyle(prefs.style);
          }
          if (prefs.platformColor) {
            setPlatformColor(prefs.platformColor);
          }
        } catch {
          // Ignore parsing errors
        }
      }
    };

    // Zkontroluj při mount
    handleStorageChange();

    // Sleduj změny v localStorage (jiná tab)
    window.addEventListener('storage', handleStorageChange);
    // Sleduj okamžité změny v rámci stejného okna
    const handleCustom = (e: Event) => {
      const ev = e as CustomEvent<{ style?: string; platformColor?: string }>;
      if (ev.detail?.style) setSelectedStyle(ev.detail.style);
      if (ev.detail?.platformColor) setPlatformColor(ev.detail.platformColor);
    };
    window.addEventListener('captioni:style-changed', handleCustom as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('captioni:style-changed', handleCustom as EventListener);
    };
  }, []);

  // Pokud je uživatel přihlášen, nezobrazuj nic
  if (session?.user) {
    return null;
  }

  // Use variables to avoid unused variable warnings
  const _ = { selectedStyle, platformColor };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h3 className={styles.title}>Create a free account</h3>
        <p className={styles.description}>
          Sign up to generate up to 3 captions per day. Upgrade anytime for unlimited magic ✨
        </p>
        <div className={styles.buttons}>
          <Link 
            href="/api/auth/signin" 
            className={styles.primaryButton}
          >
            Create free account
          </Link>
          <Link href="#pricing" className={styles.secondaryButton}>
            See pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
