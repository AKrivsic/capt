import "server-only";

export function assertSameOrigin(req: Request): boolean {
  // V development módu povol curl requesty a localhost
  if (process.env.NODE_ENV === "development") {
    const userAgent = req.headers.get("user-agent");
    const host = req.headers.get("host");
    
    // Povol curl requesty
    if (userAgent?.includes("curl")) return true;
    
    // Povol localhost requesty
    if (host?.includes("localhost")) return true;
  }
  
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  
  try {
    const o = new URL(origin);
    return o.host === host;
  } catch {
    return false;
  }
}