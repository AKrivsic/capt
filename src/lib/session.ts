import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

// Retry function for session operations
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: string })?.code;
      
      const isPreparedStatementError = errorMessage.includes('prepared statement') || 
                                      errorCode === '42P05';
      
      if (isPreparedStatementError && attempt < maxRetries) {
        console.warn(`[session][retry] Attempt ${attempt} failed with prepared statement error, retrying...`);
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
        continue;
      }
      
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function getSessionServer() {
  try {
    return await withRetry(async () => {
      return await getServerSession(authOptions);
    });
  } catch (error) {
    console.error("[session][getSessionServer] Error:", error);
    return null;
  }
}

export async function getSessionUser() {
  try {
    const s = await withRetry(async () => {
      return await getServerSession(authOptions);
    });
    return s?.user ?? null; // id, plan – dle type augmentation
  } catch (error) {
    console.error("[session][getSessionUser] Error:", error);
    return null;
  }
}

export async function requireUser() {
  const u = await getSessionUser();
  if (!u?.id) throw new Error("UNAUTHORIZED");
  return u;
}