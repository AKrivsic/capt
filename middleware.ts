import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  console.log("[middleware] Processing request:", request.url);
  
  const res = NextResponse.next();
  
  // Security headers
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // ✅ UTM & Affiliate tracking
  const url = new URL(request.url);
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  const affiliateKeys = ['affiliate_id', 'ref', 'referral'];
  
  const allKeys = [...utmKeys, ...affiliateKeys];
  const trackingData: Record<string, string> = {};
  
  // Zachyt UTM a affiliate parametry
  allKeys.forEach(key => {
    const value = url.searchParams.get(key);
    if (value) {
      trackingData[key] = value;
      console.log(`[middleware] Found ${key}: ${value}`);
    }
  });
  
  console.log("[middleware] Tracking data:", trackingData);
  
  // Ulož do 30denní cookie, pokud máme tracking data
  if (Object.keys(trackingData).length > 0) {
    console.log("[middleware] Setting cookie with data:", trackingData);
    
    // Oprava pro dev mód
    const isDev = process.env.NODE_ENV === 'development';
    
    res.cookies.set('captioni_attrib', JSON.stringify(trackingData), {
      maxAge: 60 * 60 * 24 * 30, // 30 dní
      path: '/',
      httpOnly: false, // Potřebujeme přístup z JS
      secure: !isDev, // V dev módu false, v produkci true
      sameSite: isDev ? 'none' : 'lax', // V dev módu none, v produkci lax
    });
    
    console.log("[middleware] Cookie set successfully");
  } else {
    console.log("[middleware] No tracking data found");
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};