/**
 * Safe Content-Disposition header utilities for handling unicode filenames
 * Prevents ByteString errors in Safari/WebKit by using RFC 5987 encoding
 */

/**
 * Converts unicode string to ASCII fallback by removing diacritics and non-ASCII characters
 */
export function toAsciiFallback(input: string, fallback = "file"): string {
  // Remove diacritics using NFKD normalization
  const noMarks = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  // Keep only ASCII printable characters (0x20-0x7E)
  const ascii = noMarks.replace(/[^\x20-\x7E]/g, "");
  // Clean up quotes and backslashes, trim whitespace
  const trimmed = ascii.trim().replace(/["\\]/g, "_");
  return trimmed.length ? trimmed : fallback;
}

/**
 * RFC 5987 encoding for unicode filenames
 */
export function rfc5987Encode(input: string): string {
  // URL encode and escape special characters for RFC 5987
  return encodeURIComponent(input).replace(/['()*]/g, c => 
    "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

/**
 * Creates a safe Content-Disposition header for inline display
 * Uses both ASCII fallback and RFC 5987 UTF-8 encoding for maximum compatibility
 */
export function contentDispositionInline(filename?: string): string {
  if (!filename) return 'inline';
  
  const ascii = toAsciiFallback(filename, "video.mp4");
  const utf8 = rfc5987Encode(filename);
  
  // Dual parameter: compatible ASCII + RFC5987 UTF-8
  return `inline; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}

/**
 * Creates a safe Content-Disposition header for attachment download
 */
export function contentDispositionAttachment(filename?: string): string {
  if (!filename) return 'attachment';
  
  const ascii = toAsciiFallback(filename, "download");
  const utf8 = rfc5987Encode(filename);
  
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}
