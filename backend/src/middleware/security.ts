/**
 * security.ts — Central security middleware
 *
 * Provides:
 *   • Rate limiters  (OTP spam, brute-force login, general API)
 *   • OTP attempt tracker  (per phone, in-memory, blocks after 5 failures)
 *   • Input sanitizer  (XSS-strip on every string field in req.body)
 *   • Integer ID validator  (blocks non-numeric :id params)
 *   • Numeric range validator  (rejects unrealistic page/hizb counts)
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/**
 * General API: 300 req / 15 min per IP — baseline DDoS protection
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

/**
 * OTP REQUEST: 5 req / 15 min per IP — prevents OTP flooding / SMS bombing
 */
export const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      'محاولات كثيرة جداً. يرجى الانتظار 15 دقيقة قبل طلب رمز جديد',
  },
});

/**
 * AUTH (login / verify-otp): 10 attempts / 15 min per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'محاولات تسجيل دخول كثيرة. يرجى الانتظار 15 دقيقة.',
  },
});

/**
 * Public contact form: 10 messages / hour per IP — prevents spam
 */
export const publicMessageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'لقد أرسلت رسائل كثيرة. يرجى الانتظار ساعة.' },
});

// ─── OTP Brute-Force Tracker (per-phone, in-memory) ──────────────────────────
// Tracks how many wrong codes a phone number has tried within the lockout window.
// This is separate from the IP-based rate limiter above to stop phone-targeted attacks.

interface OtpAttemptRecord {
  count: number;
  firstAt: number;
}

const otpAttempts = new Map<string, OtpAttemptRecord>();
const OTP_MAX_FAILURES = 5;
const OTP_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

/** Call this on FAILED OTP verification. Returns true if the phone is now blocked. */
export function recordOtpFailure(phone: string): boolean {
  const now = Date.now();
  const rec = otpAttempts.get(phone);
  if (rec && now - rec.firstAt < OTP_LOCKOUT_MS) {
    rec.count++;
    otpAttempts.set(phone, rec);
    return rec.count >= OTP_MAX_FAILURES;
  }
  // First failure or window expired — reset
  otpAttempts.set(phone, { count: 1, firstAt: now });
  return false;
}

/** Call this on SUCCESSFUL OTP verification to clear the record. */
export function clearOtpAttempts(phone: string): void {
  otpAttempts.delete(phone);
}

/** Returns true if this phone is currently in lockout. */
export function isOtpBlocked(phone: string): boolean {
  const now = Date.now();
  const rec = otpAttempts.get(phone);
  if (!rec) return false;
  if (now - rec.firstAt >= OTP_LOCKOUT_MS) {
    otpAttempts.delete(phone);
    return false;
  }
  return rec.count >= OTP_MAX_FAILURES;
}

// ─── XSS / Injection Sanitizer ───────────────────────────────────────────────
/**
 * Strips HTML tags, javascript: URIs, event handlers, and null bytes
 * from every string value in req.body (recursive).
 *
 * This is defense-in-depth on top of the parameterized queries already
 * used throughout the codebase (which prevent SQL injection).
 */
const DANGEROUS = /<[^>]*>|javascript\s*:|data\s*:|vbscript\s*:|on\w+\s*=|\x00/gi;

function sanitizeValue(val: string): string {
  return val.trim().replace(DANGEROUS, '');
}

function sanitizeObject(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string') {
      obj[key] = sanitizeValue(val);
    } else if (Array.isArray(val)) {
      obj[key] = val.map((item) =>
        typeof item === 'string' ? sanitizeValue(item) : item,
      );
    } else if (val !== null && typeof val === 'object') {
      sanitizeObject(val as Record<string, unknown>);
    }
  }
}

export function sanitizeBody(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body as Record<string, unknown>);
  }
  next();
}

// ─── Integer ID Parameter Validator ──────────────────────────────────────────
/**
 * Rejects :id params that are not positive integers.
 * Prevents tricks like `GET /students/../admin` or non-numeric injections.
 */
export function validateIntId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { id } = req.params;
  if (id !== undefined && !/^\d+$/.test(id)) {
    res.status(400).json({ message: 'Invalid ID format' });
    return;
  }
  next();
}

// ─── Numeric Range Validator (pages, hizb, etc.) ─────────────────────────────
/**
 * Validates that numeric body fields are within reasonable bounds.
 * Prevents inflated point scores or corrupted Quran position data.
 */
export function validateProgressFields(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { pagesMemorized, pagesRevised, currentHizb, currentPage } = req.body;

  const checks: Array<[unknown, string, number, number]> = [
    [pagesMemorized, 'pagesMemorized', 0, 20],
    [pagesRevised,   'pagesRevised',   0, 60],
    [currentHizb,    'currentHizb',    1, 60],
    [currentPage,    'currentPage',    1, 604],
  ];

  for (const [val, name, min, max] of checks) {
    if (val !== undefined && val !== null) {
      const n = Number(val);
      if (!Number.isFinite(n) || n < min || n > max) {
        res
          .status(400)
          .json({ message: `Invalid value for ${name}: must be between ${min} and ${max}` });
        return;
      }
    }
  }

  next();
}
