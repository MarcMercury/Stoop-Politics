/**
 * Simple in-memory rate limiter for API routes.
 * For production at scale, replace with Redis (e.g., Upstash).
 * In serverless environments, rate limiting is per-instance.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check if a request is within the rate limit.
 * @param key - Unique identifier (e.g., "subscribe:192.168.1.1")
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if within limit, false if rate limited
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  // Clean up expired entry
  if (entry && now > entry.resetAt) {
    store.delete(key);
  }

  // Prevent unbounded memory growth
  if (store.size > 10_000) {
    for (const [k, v] of store) {
      if (now > v.resetAt) store.delete(k);
    }
  }

  const current = store.get(key);
  if (!current) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Extract client IP address from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();

  const real = request.headers.get('x-real-ip');
  if (real) return real;

  return 'unknown';
}
