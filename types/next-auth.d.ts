import { DefaultSession } from "next-auth";

type Plan = "FREE" | "TEXT_STARTER" | "TEXT_PRO" | "VIDEO_LITE" | "VIDEO_PRO" | "VIDEO_UNLIMITED";

declare module "next-auth" {
  interface User {
    id: string;
    plan?: Plan | null;
  }

  interface Session {
    user: {
      id: string;
      plan?: Plan | null;
    } & DefaultSession["user"];
  }
}

// aby měl `user` v session callbacku správný typ (AdapterUser s plan)
declare module "next-auth/adapters" {
  interface AdapterUser {
    plan?: Plan | null;
  }
}

export {}; // ensure this file is a module (safe even if already present above)

type PlausibleProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: {
        props?: PlausibleProps;
        revenue?: number;
      }
    ) => void;
  }
}