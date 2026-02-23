import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import progressRoutes from './routes/progress.routes';
import classRoutes from './routes/class.routes';
import registrationRoutes from './routes/registration.routes';
import rankingRoutes from './routes/ranking.routes';
import quranRoutes from './routes/quran.routes';
import adminRoutes from './routes/admin.routes';
import talqinRoutes from './routes/talqin.routes';
import messageRoutes from './routes/message.routes';
import { apiLimiter, sanitizeBody } from './middleware/security';

dotenv.config();

// ── Fail fast if critical secrets are unset in production ────────────────────
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET must be set to a random string of at least 32 characters in production');
    process.exit(1);
  }
}

const app = express();
app.set('trust proxy', 1); // Render runs behind a reverse proxy
const PORT = process.env.PORT || 5000;

// ── Security headers (Helmet) ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc:    ["'self'"],
        objectSrc:  ["'none'"],
        frameSrc:   ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // allow frontend assets
  }),
);

// ── CORS — explicit allow-list ────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server (no origin) and listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // preflight cache 24 h
  }),
);

// ── Body parsing — tight size limits prevent payload DoS ─────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// ── Global rate limiter + XSS sanitizer ─────────────────────────────────────
app.use(apiLimiter);
app.use(sanitizeBody);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/quran', quranRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/talqin', talqinRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ── Global error handler — never leak stack traces to clients ───────────────
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || 500;
  // Log full detail server-side
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} → HTTP ${status}`, err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);
  // Send minimal detail to client
  res.status(status).json({
    message:
      process.env.NODE_ENV === 'production'
        ? status < 500
          ? err.message
          : 'Internal Server Error'
        : err.message,
  });
});

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

export default app;
