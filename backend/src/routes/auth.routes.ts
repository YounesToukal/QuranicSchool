import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { generateToken } from '../middleware/auth';
import {
  otpRequestLimiter,
  authLimiter,
  recordOtpFailure,
  clearOtpAttempts,
  isOtpBlocked,
} from '../middleware/security';

const router = Router();

// Algerian phone normalisation & validation
const normalizePhone = (phone: string) => (phone || '').replace(/\s+/g, '');
const isValidPhone = (phone: string) => /^0[567]\d{8}$/.test(phone);
const isValidOtp   = (code: string)  => /^\d{6}$/.test(code);

// Request OTP — strict rate limit to prevent SMS bombing
router.post('/request-otp', otpRequestLimiter, async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'رقم الهاتف غير صالح. يجب أن يبدأ بـ 05، 06 أو 07 ويتكون من 10 أرقام' });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to database
    await query(
      'INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
      [phone, code, expiresAt]
    );

    // TODO: Send OTP via SMS service
    console.log(`OTP for ${phone}: ${code}`);

    // In development only — never in production
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ message: 'OTP sent', code });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Verify OTP and login — strict rate limit to prevent code brute-forcing
router.post('/verify-otp', authLimiter, async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const code  = (req.body.code || '').trim();

    if (!phone || !code) {
      return res.status(400).json({ message: 'Phone and code are required' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'رقم هاتف غير صالح' });
    }
    if (!isValidOtp(code)) {
      return res.status(400).json({ message: 'رمز غير صالح. يجب أن يتكون من 6 أرقام' });
    }

    // Check per-phone brute-force lockout
    if (isOtpBlocked(phone)) {
      return res.status(429).json({
        message: 'تم حظر هذا الرقم مؤقتاً بسبب محاولات متعددة. انتظر 15 دقيقة.',
      });
    }

    // Verify OTP
    const otpResult = await query(
      `SELECT * FROM otp_codes 
       WHERE phone = $1 AND code = $2 AND expires_at > NOW() AND used = FALSE 
       ORDER BY created_at DESC LIMIT 1`,
      [phone, code]
    );

    if (otpResult.rows.length === 0) {
      const blocked = recordOtpFailure(phone);
      return res.status(400).json({
        message: blocked
          ? 'تم تجاوز عدد المحاولات المسموحة. سيتم إلغاء تحقق الهوية لمدة 15 دقيقة'
          : 'الرمز غير صحيح أو منتهية الصلاحية',
      });
    }

    // Successful OTP — clear brute-force counter
    clearOtpAttempts(phone);

    // Mark OTP as used
    await query('UPDATE otp_codes SET used = TRUE WHERE id = $1', [otpResult.rows[0].id]);

    // Find user
    const userResult = await query('SELECT * FROM users WHERE phone = $1', [phone]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check for suspended account
    if (user.is_suspended) {
      return res.status(403).json({
        message: 'الحساب موقوف مؤقتاً للتحقق من الهوية. يرجى التواصل مع الإدارة',
        suspended: true,
        reason: user.suspension_reason
      });
    }

    // Track login count
    await query('UPDATE users SET login_count = COALESCE(login_count, 0) + 1 WHERE id = $1', [user.id]);

    const token = generateToken({
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        phone: user.phone
      }
    });

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Phone-only login for parents (OTP disabled — add back when SMS service is ready)
router.post('/phone-login', authLimiter, async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    if (!isValidPhone(phone)) {
      return res.status(400).json({ message: 'رقم الهاتف غير صالح. يجب أن يبدأ بـ 05، 06 أو 07 ويتكون من 10 أرقام' });
    }

    const userResult = await query('SELECT * FROM users WHERE phone = $1', [phone]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'هذا الرقم غير مسجل في النظام' });
    }

    const user = userResult.rows[0];

    if (user.is_suspended) {
      return res.status(403).json({
        message: 'الحساب موقوف مؤقتاً. يرجى التواصل مع الإدارة',
        suspended: true,
        reason: user.suspension_reason,
      });
    }

    await query('UPDATE users SET login_count = COALESCE(login_count, 0) + 1 WHERE id = $1', [user.id]);

    const token = generateToken({
      user: { id: user.id, role: user.role, name: user.name, phone: user.phone },
    });

    res.json({
      token,
      user: { id: user.id, role: user.role, name: user.name, phone: user.phone },
    });
  } catch (error) {
    console.error('Error in phone login:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
});

// Admin/Teacher login — strict rate limit
router.post('/login', authLimiter, async (req, res) => {
  try {
    const email    = (req.body.email    || '').trim().toLowerCase();
    const password = (req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    // Basic email shape check (length + @)
    if (email.length > 254 || !/^[^@\s]+@[^@\s]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (password.length > 128) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.is_suspended) {
      return res.status(403).json({
        message: 'الحساب موقوف مؤقتاً للتحقق من الهوية. يرجى التواصل مع الإدارة',
        suspended: true,
        reason: user.suspension_reason
      });
    }

    // Track login count
    await query('UPDATE users SET login_count = COALESCE(login_count, 0) + 1 WHERE id = $1', [user.id]);

    const token = generateToken({
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      }
    });

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Failed to login' });
  }
});

export default router;
