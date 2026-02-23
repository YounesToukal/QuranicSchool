import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// In production (Render + Neon) DATABASE_URL is a single connection string.
// In development individual vars are used as fallback.
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // required by Neon / most managed DBs
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'quran_school',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      },
);

export const initDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');

    // Create tables
    await client.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'parent')),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255),
        is_suspended BOOLEAN DEFAULT FALSE,
        suspension_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Classes table
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        class_type VARCHAR(20) DEFAULT 'hifz' CHECK (class_type IN ('hifz', 'talqin')),
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Students table
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
        photo_url VARCHAR(255),
        total_points INTEGER DEFAULT 0,
        monthly_points INTEGER DEFAULT 0,
        current_hizb INTEGER DEFAULT 1,
        current_surah INTEGER DEFAULT 1,
        current_page INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Surahs table
      CREATE TABLE IF NOT EXISTS surahs (
        id SERIAL PRIMARY KEY,
        number INTEGER UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        name_arabic VARCHAR(100) NOT NULL,
        english_name VARCHAR(100) NOT NULL,
        total_verses INTEGER NOT NULL,
        revelation_type VARCHAR(10) CHECK (revelation_type IN ('Meccan', 'Medinan')),
        start_page INTEGER NOT NULL,
        end_page INTEGER NOT NULL
      );

      -- Hizbs table
      CREATE TABLE IF NOT EXISTS hizbs (
        id SERIAL PRIMARY KEY,
        number INTEGER UNIQUE NOT NULL,
        start_surah INTEGER NOT NULL,
        start_verse INTEGER NOT NULL,
        end_surah INTEGER NOT NULL,
        end_verse INTEGER NOT NULL
      );

      -- Verses table
      CREATE TABLE IF NOT EXISTS verses (
        id SERIAL PRIMARY KEY,
        surah_id INTEGER REFERENCES surahs(id) ON DELETE CASCADE,
        number INTEGER NOT NULL,
        text_arabic TEXT NOT NULL,
        text_french TEXT,
        page INTEGER NOT NULL,
        UNIQUE (surah_id, number)
      );

      -- Progress table
      CREATE TABLE IF NOT EXISTS progress (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        pages_memorized INTEGER DEFAULT 0,
        pages_revised INTEGER DEFAULT 0,
        attendance VARCHAR(20) CHECK (attendance IN ('present', 'absent', 'justified')),
        concentration VARCHAR(20) CHECK (concentration IN ('low', 'medium', 'high')),
        points_earned INTEGER DEFAULT 0,
        notes TEXT,
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Point transactions table
      CREATE TABLE IF NOT EXISTS point_transactions (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        points INTEGER NOT NULL,
        description TEXT,
        date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Registration requests table
      CREATE TABLE IF NOT EXISTS registration_requests (
        id SERIAL PRIMARY KEY,
        parent_name VARCHAR(100),
        parent_phone VARCHAR(20) NOT NULL,
        student_first_name VARCHAR(50) NOT NULL,
        student_last_name VARCHAR(50) NOT NULL,
        class_code VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Recovery requests table (wrong number or add child to existing account)
      CREATE TABLE IF NOT EXISTS recovery_requests (
        id SERIAL PRIMARY KEY,
        request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('wrong_number', 'add_child', 'halaqah_change')),
        requester_name VARCHAR(100) NOT NULL,
        current_phone VARCHAR(20),
        new_phone VARCHAR(20),
        child_name_for_lookup VARCHAR(100) NOT NULL,
        new_child_first_name VARCHAR(50),
        new_child_last_name VARCHAR(50),
        new_class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
        existing_student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- OTP table (for phone authentication)
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Weekly assignments table (for Talqin classes)
      CREATE TABLE IF NOT EXISTS weekly_assignments (
        id SERIAL PRIMARY KEY,
        class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        week_start_date DATE NOT NULL,
        surah_id INTEGER REFERENCES surahs(id) ON DELETE CASCADE,
        verses_to_prepare TEXT,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'pending')),
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Talqin progress table (for recitation quality tracking)
      CREATE TABLE IF NOT EXISTS talqin_progress (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        surah_practiced INTEGER REFERENCES surahs(id),
        verses_practiced TEXT,
        pronunciation_quality VARCHAR(20) CHECK (pronunciation_quality IN ('excellent', 'good', 'needs_improvement')),
        tajweed_quality VARCHAR(20) CHECK (tajweed_quality IN ('excellent', 'good', 'needs_improvement')),
        listening_attention VARCHAR(20) CHECK (listening_attention IN ('high', 'medium', 'low')),
        repetition_accuracy VARCHAR(20) CHECK (repetition_accuracy IN ('excellent', 'good', 'needs_improvement')),
        attendance VARCHAR(20) CHECK (attendance IN ('present', 'absent', 'justified')),
        notes TEXT,
        teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Messages table for parent/teacher to admin communication
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        sender_name VARCHAR(100) NOT NULL,
        sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('teacher', 'parent')),
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
      CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
      CREATE INDEX IF NOT EXISTS idx_progress_student ON progress(student_id);
      CREATE INDEX IF NOT EXISTS idx_progress_date ON progress(date);
      CREATE INDEX IF NOT EXISTS idx_verses_surah ON verses(surah_id);
      CREATE INDEX IF NOT EXISTS idx_point_transactions_student ON point_transactions(student_id);
      CREATE INDEX IF NOT EXISTS idx_weekly_assignments_class ON weekly_assignments(class_id);
      CREATE INDEX IF NOT EXISTS idx_weekly_assignments_student ON weekly_assignments(student_id);
      CREATE INDEX IF NOT EXISTS idx_talqin_progress_student ON talqin_progress(student_id);
      CREATE INDEX IF NOT EXISTS idx_talqin_progress_date ON talqin_progress(date);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);
      CREATE INDEX IF NOT EXISTS idx_recovery_requests_status ON recovery_requests(status);
    `);

    // Remove unique constraint on progress table if it exists (allow multiple entries per day)
    try {
      await client.query(`
        ALTER TABLE progress DROP CONSTRAINT IF EXISTS progress_student_id_date_key;
      `);
      console.log('✅ Progress table constraint removed (multiple entries per day enabled)');
    } catch (error) {
      // Constraint might not exist, ignore error
    }

    // Add parent_name column to registration_requests if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE registration_requests 
        ADD COLUMN IF NOT EXISTS parent_name VARCHAR(100);
      `);
      console.log('✅ Registration requests table updated (parent_name column added)');
    } catch (error) {
      // Column might already exist, ignore error
    }

    // Add source column to registration_requests to distinguish add-child-authenticated requests
    try {
      await client.query(`
        ALTER TABLE registration_requests
        ADD COLUMN IF NOT EXISTS source VARCHAR(50);
      `);
      console.log('✅ Registration requests table updated (source column added)');
    } catch (error) {
      // Column might already exist, ignore error
    }

    // Add existing_student_id for halaqah-change-authenticated requests
    try {
      await client.query(`
        ALTER TABLE registration_requests
        ADD COLUMN IF NOT EXISTS existing_student_id INTEGER;
      `);
      console.log('✅ Registration requests table updated (existing_student_id column added)');
    } catch (error) {
      // Column might already exist, ignore error
    }

    // Add teacher_name column to classes if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE classes 
        ADD COLUMN IF NOT EXISTS teacher_name VARCHAR(100);
      `);
      console.log('✅ Classes table updated (teacher_name column added)');
    } catch (error) {
      // Column might already exist, ignore error
    }

    // Add class_type column to classes if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE classes 
        ADD COLUMN IF NOT EXISTS class_type VARCHAR(20) DEFAULT 'hifz' CHECK (class_type IN ('hifz', 'talqin'));
      `);
      console.log('✅ Classes table updated (class_type column added)');
    } catch (error) {
      // Column might already exist, ignore error
    }

    // Add points_earned column to talqin_progress if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE talqin_progress 
        ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
      `);
      console.log('✅ Talqin progress table updated (points_earned column added)');
    } catch (error) {
      // Column might already exist, ignore error
    }

    // Add parent_acknowledged column to weekly_assignments if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE weekly_assignments 
        ADD COLUMN IF NOT EXISTS parent_acknowledged BOOLEAN DEFAULT FALSE;
      `);
      await client.query(`
        ALTER TABLE weekly_assignments 
        ADD COLUMN IF NOT EXISTS parent_acknowledged_at TIMESTAMP;
      `);
      console.log('✅ Weekly assignments table updated (parent_acknowledged columns added)');
    } catch (error) {
      // Columns might already exist, ignore error
    }

    // Add suspension columns to users if they don't exist
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
      `);
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
      `);
      console.log('✅ Users table updated (suspension columns added)');
    } catch (error) {
      // Columns might already exist, ignore error
    }

    // Add login_count to users if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
      `);
      console.log('✅ Users table updated (login_count column added)');
    } catch (error) {
      // Column might already exist, ignore error
    }

    // Extend messages sender_role to allow visitor (unauthenticated contact)
    try {
      await client.query(`ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_role_check;`);
      await client.query(`ALTER TABLE messages ADD CONSTRAINT messages_sender_role_check CHECK (sender_role IN ('teacher', 'parent', 'visitor'));`);
      console.log('✅ Messages table updated (visitor role allowed)');
    } catch (error) {
      // Ignore if already updated
    }

    // Add reply_email and message_type columns to messages
    try {
      await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_email VARCHAR(200);`);
      await client.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(30) DEFAULT 'inquiry';`);
      console.log('✅ Messages table updated (reply_email, message_type columns added)');
    } catch (error) {
      // Ignore if already updated
    }

    client.release();
    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
