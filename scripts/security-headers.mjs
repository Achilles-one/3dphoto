export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "media-src 'self' blob:",
  "manifest-src 'self'",
].join('; ');

export const ALIGNMENT_WORKER_CONTENT_SECURITY_POLICY = CONTENT_SECURITY_POLICY.replace(
  "script-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
);

export const SECURITY_HEADERS = Object.freeze({
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
});
