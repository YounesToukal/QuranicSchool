/**
 * Comprehensive test-data seed.
 * Creates accounts + realistic data covering every feature of the app.
 * Safe to run multiple times (all inserts use ON CONFLICT DO NOTHING / DO UPDATE).
 */
import { query } from '../config/database';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('\n🌱  Starting comprehensive test-data seed…\n');

  // ─── 1. USERS ────────────────────────────────────────────────────────────────
  console.log('👤  Creating user accounts…');

  const adminHash   = await bcrypt.hash('admin123',   10);
  const teacherHash = await bcrypt.hash('teacher123', 10);

  // Admin
  await query(
    `INSERT INTO users (role, name, email, password_hash)
     VALUES ('admin', 'مدير النظام', 'admin@qurandec.com', $1)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [adminHash]
  );

  // Hifz teacher
  const hifzTeacherRes = await query(
    `INSERT INTO users (role, name, email, password_hash)
     VALUES ('teacher', 'الشيخ عمر بن علي', 'teacher.hifz@qurandec.com', $1)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [teacherHash]
  );
  const hifzTeacherId: number = hifzTeacherRes.rows[0].id;

  // Talqin teacher
  const talqinTeacherRes = await query(
    `INSERT INTO users (role, name, email, password_hash)
     VALUES ('teacher', 'الشيخ خالد السعدي', 'teacher.talqin@qurandec.com', $1)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [teacherHash]
  );
  const talqinTeacherId: number = talqinTeacherRes.rows[0].id;

  // Parents (login by phone OTP)
  const parent1Res = await query(
    `INSERT INTO users (role, name, phone)
     VALUES ('parent', 'أحمد توكال', '0661234567')
     ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    []
  );
  const parent1Id: number = parent1Res.rows[0].id;

  const parent2Res = await query(
    `INSERT INTO users (role, name, phone)
     VALUES ('parent', 'فاطمة بن حميد', '0662345678')
     ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    []
  );
  const parent2Id: number = parent2Res.rows[0].id;

  const parent3Res = await query(
    `INSERT INTO users (role, name, phone)
     VALUES ('parent', 'يوسف المرابط', '0663456789')
     ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    []
  );
  const parent3Id: number = parent3Res.rows[0].id;

  console.log('  ✅  Admin, 2 teachers, 3 parents created');

  // ─── 2. CLASSES ──────────────────────────────────────────────────────────────
  console.log('🕌  Creating classes…');

  const hifzClassRes = await query(
    `INSERT INTO classes (name, code, teacher_id, teacher_name, class_type)
     VALUES ('حلقة الحفظ - الشيخ عمر', 'HIFZ-TEST', $1, 'الشيخ عمر بن علي', 'hifz')
     ON CONFLICT (code) DO UPDATE SET teacher_id = EXCLUDED.teacher_id, teacher_name = EXCLUDED.teacher_name
     RETURNING id`,
    [hifzTeacherId]
  );
  const hifzClassId: number = hifzClassRes.rows[0].id;

  const talqinClassRes = await query(
    `INSERT INTO classes (name, code, teacher_id, teacher_name, class_type)
     VALUES ('حلقة التلقين - الشيخ خالد', 'TALQ-TEST', $1, 'الشيخ خالد السعدي', 'talqin')
     ON CONFLICT (code) DO UPDATE SET teacher_id = EXCLUDED.teacher_id, teacher_name = EXCLUDED.teacher_name
     RETURNING id`,
    [talqinTeacherId]
  );
  const talqinClassId: number = talqinClassRes.rows[0].id;

  console.log('  ✅  Hifz class (HIFZ-TEST) and Talqin class (TALQ-TEST) created');

  // ─── 3. STUDENTS ─────────────────────────────────────────────────────────────
  console.log('📚  Creating students…');

  // Hifz students (3)
  const hifzS1Res = await query(
    `INSERT INTO students (first_name, last_name, parent_id, class_id, current_hizb, current_surah, current_page, total_points, monthly_points)
     VALUES ('ياسين', 'توكال', $1, $2, 12, 10, 210, 2400, 680)
     ON CONFLICT DO NOTHING RETURNING id`,
    [parent1Id, hifzClassId]
  );

  const hifzS2Res = await query(
    `INSERT INTO students (first_name, last_name, parent_id, class_id, current_hizb, current_surah, current_page, total_points, monthly_points)
     VALUES ('ريم', 'بن حميد', $1, $2, 7, 5, 110, 1350, 430)
     ON CONFLICT DO NOTHING RETURNING id`,
    [parent2Id, hifzClassId]
  );

  const hifzS3Res = await query(
    `INSERT INTO students (first_name, last_name, parent_id, class_id, current_hizb, current_surah, current_page, total_points, monthly_points)
     VALUES ('عمر', 'توكال', $1, $2, 5, 4, 85, 900, 290)
     ON CONFLICT DO NOTHING RETURNING id`,
    [parent1Id, hifzClassId]
  );

  // Talqin students (2)
  const talqinS1Res = await query(
    `INSERT INTO students (first_name, last_name, parent_id, class_id, total_points, monthly_points)
     VALUES ('محمد', 'أحمد', $1, $2, 760, 245)
     ON CONFLICT DO NOTHING RETURNING id`,
    [parent2Id, talqinClassId]
  );

  const talqinS2Res = await query(
    `INSERT INTO students (first_name, last_name, parent_id, class_id, total_points, monthly_points)
     VALUES ('ياسين', 'المرابط', $1, $2, 580, 195)
     ON CONFLICT DO NOTHING RETURNING id`,
    [parent3Id, talqinClassId]
  );

  const hifzS1Id   = hifzS1Res.rows[0]?.id;
  const hifzS2Id   = hifzS2Res.rows[0]?.id;
  const hifzS3Id   = hifzS3Res.rows[0]?.id;
  const talqinS1Id = talqinS1Res.rows[0]?.id;
  const talqinS2Id = talqinS2Res.rows[0]?.id;

  console.log('  ✅  3 hifz students, 2 talqin students created');

  // ─── 4. HIFZ PROGRESS (last 7 days for each student) ─────────────────────
  console.log('📈  Creating hifz progress records…');

  if (hifzS1Id) {
    for (let d = 6; d >= 0; d--) {
      const date = new Date(); date.setDate(date.getDate() - d);
      const ds = date.toISOString().split('T')[0];
      const pages_mem = d % 3 === 0 ? 0 : 2;
      const pages_rev = 1;
      const att = d === 4 ? 'absent' : 'present';
      const conc = d % 2 === 0 ? 'high' : 'medium';
      const pts = att === 'absent' ? -10 : pages_mem * 100 + pages_rev * 40 + 10 + (conc === 'high' ? 50 : 20);
      await query(
        `INSERT INTO progress (student_id, date, pages_memorized, pages_revised, attendance, concentration, points_earned, teacher_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
        [hifzS1Id, ds, pages_mem, pages_rev, att, conc, pts, hifzTeacherId]
      );
    }
  }

  if (hifzS2Id) {
    for (let d = 6; d >= 0; d--) {
      const date = new Date(); date.setDate(date.getDate() - d);
      const ds = date.toISOString().split('T')[0];
      const pts = d === 2 ? 0 : 1 * 100 + 1 * 40 + 10 + 20;
      await query(
        `INSERT INTO progress (student_id, date, pages_memorized, pages_revised, attendance, concentration, points_earned, teacher_id)
         VALUES ($1,$2,1,1,$3,'medium',$4,$5) ON CONFLICT DO NOTHING`,
        [hifzS2Id, ds, d === 2 ? 'absent' : 'present', pts, hifzTeacherId]
      );
    }
  }

  if (hifzS3Id) {
    for (let d = 5; d >= 0; d--) {
      const date = new Date(); date.setDate(date.getDate() - d);
      const ds = date.toISOString().split('T')[0];
      await query(
        `INSERT INTO progress (student_id, date, pages_memorized, pages_revised, attendance, concentration, points_earned, teacher_id)
         VALUES ($1,$2,1,1,'present','high',200,$3) ON CONFLICT DO NOTHING`,
        [hifzS3Id, ds, hifzTeacherId]
      );
    }
  }

  console.log('  ✅  Hifz progress records created');

  // ─── 5. TALQIN PROGRESS (last 5 days) ────────────────────────────────────
  console.log('🎤  Creating talqin progress records…');

  // Get a valid surah id (Al-Fatiha = surah 1)
  const surahRes = await query(`SELECT id FROM surahs WHERE number = 1 LIMIT 1`);
  const surahId = surahRes.rows[0]?.id || null;

  const talqinRecords = [
    { studentId: talqinS1Id, daysAgo: 4, att: 'present', pron: 'good',      tajw: 'good',      listen: 'high',   rep: 'good',              pts: 20+15+12+15+12 },
    { studentId: talqinS1Id, daysAgo: 3, att: 'present', pron: 'excellent', tajw: 'excellent', listen: 'high',   rep: 'excellent',         pts: 110 },
    { studentId: talqinS1Id, daysAgo: 2, att: 'absent',  pron: null,        tajw: null,        listen: null,     rep: null,                pts: 0 },
    { studentId: talqinS1Id, daysAgo: 1, att: 'present', pron: 'good',      tajw: 'good',      listen: 'medium', rep: 'needs_improvement', pts: 20+15+12+8+5 },
    { studentId: talqinS1Id, daysAgo: 0, att: 'present', pron: 'excellent', tajw: 'good',      listen: 'high',   rep: 'good',              pts: 20+25+12+15+12 },
    { studentId: talqinS2Id, daysAgo: 3, att: 'present', pron: 'good',      tajw: 'needs_improvement', listen: 'medium', rep: 'good', pts: 20+15+5+8+12 },
    { studentId: talqinS2Id, daysAgo: 2, att: 'justified', pron: null,      tajw: null,        listen: null,     rep: null,                pts: 5 },
    { studentId: talqinS2Id, daysAgo: 1, att: 'present', pron: 'good',      tajw: 'good',      listen: 'high',   rep: 'good',              pts: 20+15+12+15+12 },
    { studentId: talqinS2Id, daysAgo: 0, att: 'present', pron: 'excellent', tajw: 'excellent', listen: 'high',   rep: 'excellent',         pts: 110 },
  ];

  for (const r of talqinRecords) {
    if (!r.studentId) continue;
    const d = new Date(); d.setDate(d.getDate() - r.daysAgo);
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    await query(
      `INSERT INTO talqin_progress
         (student_id, date, surah_practiced, pronunciation_quality, tajweed_quality,
          listening_attention, repetition_accuracy, attendance, notes, teacher_id, points_earned)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING`,
      [r.studentId, ds, surahId, r.pron, r.tajw, r.listen, r.rep, r.att,
       r.daysAgo === 0 ? 'جلسة اليوم - أداء جيد' : null, talqinTeacherId, r.pts]
    );
  }

  console.log('  ✅  Talqin progress records created');

  // ─── 6. WEEKLY ASSIGNMENTS ────────────────────────────────────────────────
  console.log('📋  Creating weekly assignments…');

  // Next Monday
  const today = new Date();
  const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  const weekStart = nextMonday.toISOString().split('T')[0];

  // Previous Monday (current week assignment)
  const prevMonday = new Date(today);
  prevMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const prevWeekStart = prevMonday.toISOString().split('T')[0];

  if (talqinS1Id && surahId) {
    await query(
      `INSERT INTO weekly_assignments (class_id, student_id, week_start_date, surah_id, verses_to_prepare, notes, status, teacher_id)
       VALUES ($1,$2,$3,$4,'1-7','مراجعة الفاتحة وتحسين الأداء','assigned',$5) ON CONFLICT DO NOTHING`,
      [talqinClassId, talqinS1Id, prevWeekStart, surahId, talqinTeacherId]
    );
    await query(
      `INSERT INTO weekly_assignments (class_id, student_id, week_start_date, surah_id, verses_to_prepare, notes, status, teacher_id)
       VALUES ($1,$2,$3,$4,'1-7','واجب الأسبوع القادم - الفاتحة','assigned',$5) ON CONFLICT DO NOTHING`,
      [talqinClassId, talqinS1Id, weekStart, surahId, talqinTeacherId]
    );
  }
  if (talqinS2Id && surahId) {
    await query(
      `INSERT INTO weekly_assignments (class_id, student_id, week_start_date, surah_id, verses_to_prepare, notes, status, teacher_id)
       VALUES ($1,$2,$3,$4,'1-5','تعلم النطق الصحيح','assigned',$5) ON CONFLICT DO NOTHING`,
      [talqinClassId, talqinS2Id, prevWeekStart, surahId, talqinTeacherId]
    );
  }

  console.log('  ✅  Weekly assignments created');

  // ─── 7. MESSAGES ─────────────────────────────────────────────────────────
  console.log('💬  Creating messages…');

  await query(
    `INSERT INTO messages (sender_id, sender_name, sender_role, subject, message, is_read, target_teacher_id)
     VALUES ($1,'أحمد توكال','parent','سؤال عن تقدم ياسين',
       'السلام عليكم شيخ، أريد أن أعرف كيف يسير ياسين في الحفظ هذا الشهر؟ جزاك الله خيراً.',
       false, $2)`,
    [parent1Id, hifzTeacherId]
  );

  await query(
    `INSERT INTO messages (sender_id, sender_name, sender_role, subject, message, is_read)
     VALUES ($1,'فاطمة بن حميد','parent','غياب ريم الأسبوع القادم',
       'السلام عليكم، أودّ الإخبار بأن ريم ستغيب الإثنين القادم بسبب موعد طبي.',
       false)`,
    [parent2Id]
  );

  await query(
    `INSERT INTO messages (sender_id, sender_name, sender_role, subject, message, is_read)
     VALUES ($1,'الشيخ عمر بن علي','teacher','طلب مساعدة إدارية',
       'السلام عليكم، هل يمكن تزويدي بقائمة الطلاب المسجلين الجدد لهذا الشهر؟',
       false)`,
    [hifzTeacherId]
  );

  console.log('  ✅  3 messages created');

  // ─── 8. REGISTRATION REQUEST ─────────────────────────────────────────────
  console.log('📝  Creating registration requests…');

  await query(
    `INSERT INTO registration_requests (parent_name, parent_phone, student_first_name, student_last_name, class_code, status)
     VALUES ('سعيد القاسمي', '0664567890', 'إبراهيم', 'القاسمي', 'HIFZ-TEST', 'pending')
     ON CONFLICT DO NOTHING`
  );

  await query(
    `INSERT INTO registration_requests (parent_name, parent_phone, student_first_name, student_last_name, class_code, status)
     VALUES ('نورة الحسني', '0665678901', 'آمنة', 'الحسني', 'TALQ-TEST', 'pending')
     ON CONFLICT DO NOTHING`
  );

  console.log('  ✅  2 pending registration requests created');

  // ─── DONE ─────────────────────────────────────────────────────────────────
  console.log('\n✅  Seed complete!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TEST ACCOUNTS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ADMIN         admin@qurandec.com          / admin123');
  console.log('  HIFZ TEACHER  teacher.hifz@qurandec.com   / teacher123');
  console.log('  TALQIN TEACHER teacher.talqin@qurandec.com / teacher123');
  console.log('  PARENT 1      Phone: 0661234567  (OTP login)');
  console.log('  PARENT 2      Phone: 0662345678  (OTP login)');
  console.log('  PARENT 3      Phone: 0663456789  (OTP login)');
  console.log('───────────────────────────────────────────────────────────');
  console.log('  HIFZ CLASS    Code: HIFZ-TEST');
  console.log('  TALQIN CLASS  Code: TALQ-TEST');
  console.log('  Students in hifz:   ياسين توكال, ريم بن حميد, عمر توكال');
  console.log('  Students in talqin: محمد أحمد, ياسين المرابط');
  console.log('═══════════════════════════════════════════════════════════\n');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => { console.error('❌  Seed failed:', err); process.exit(1); });
