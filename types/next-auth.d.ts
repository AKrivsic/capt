import { DefaultSession } from "next-auth";

type Plan = "FREE" | "STARTER" | "PRO" | "PREMIUM";

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
