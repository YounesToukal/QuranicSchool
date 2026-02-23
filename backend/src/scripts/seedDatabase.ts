import { query } from '../config/database';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await query(
      `INSERT INTO users (role, name, email, password_hash) 
       VALUES ('admin', 'Administrateur', 'admin@qurandec.com', $1)
       ON CONFLICT (email) DO NOTHING`,
      [adminPassword]
    );
    console.log('✅ Admin user created');

    // Create sample teacher
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    const teacherResult = await query(
      `INSERT INTO users (role, name, email, password_hash) 
       VALUES ('teacher', 'Professeur Mohamed', 'teacher@qurandec.com', $1)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [teacherPassword]
    );

    let teacherId: number | null = null;
    let classId: number | null = null;

    // Create sample class
    if (teacherResult.rows.length > 0) {
      teacherId = teacherResult.rows[0].id;
      const classResult = await query(
        `INSERT INTO classes (name, code, teacher_id, class_type) 
         VALUES ('Classe A - Hifz', 'MOSQ-01', $1, 'hifz')
         ON CONFLICT (code) DO NOTHING
         RETURNING id`,
        [teacherId]
      );
      if (classResult.rows.length > 0) {
        classId = classResult.rows[0].id;
      }

      // Create Talqin class for little children
      const talqinClassResult = await query(
        `INSERT INTO classes (name, code, teacher_id, class_type) 
         VALUES ('Talqin Petits', 'MOSQ-02', $1, 'talqin')
         ON CONFLICT (code) DO NOTHING
         RETURNING id`,
        [teacherId]
      );
      let talqinClassId: number | null = null;
      if (talqinClassResult.rows.length > 0) {
        talqinClassId = talqinClassResult.rows[0].id;
      }

      console.log('✅ Sample classes created (Hifz & Talqin)');
    }

    // Create sample parent and student
    const parentResult = await query(
      `INSERT INTO users (role, name, phone) 
       VALUES ('parent', 'Ahmed Benali', '+33612345678')
       ON CONFLICT (phone) DO NOTHING
       RETURNING id`,
      []
    );

    if (parentResult.rows.length > 0 && classId) {
      const parentId = parentResult.rows[0].id;
      
      // Create student
      const studentResult = await query(
        `INSERT INTO students (first_name, last_name, parent_id, class_id, current_hizb, total_points, monthly_points)
         VALUES ('Yasmine', 'Benali', $1, $2, 3, 850, 320)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [parentId, classId]
      );

      if (studentResult.rows.length > 0) {
        const studentId = studentResult.rows[0].id;
        
        // Add some progress entries
        await query(
          `INSERT INTO progress (student_id, date, pages_memorized, pages_revised, attendance, concentration, points_earned)
           VALUES 
             ($1, CURRENT_DATE - INTERVAL '2 days', 2, 1, 'present', 'high', 290),
             ($1, CURRENT_DATE - INTERVAL '1 day', 1, 2, 'present', 'medium', 200),
             ($1, CURRENT_DATE, 1, 1, 'present', 'high', 190)
           ON CONFLICT DO NOTHING`,
          [studentId]
        );

        console.log('✅ Sample parent and student created');
      }
    }

    // Seed complete Quran data (all 114 surahs)
    const surahs = [
      { number: 1, name: 'Al-Fatiha', nameArabic: 'الفاتحة', englishName: 'The Opening', totalVerses: 7, revelationType: 'Meccan', startPage: 1, endPage: 1 },
      { number: 2, name: 'Al-Baqara', nameArabic: 'البقرة', englishName: 'The Cow', totalVerses: 286, revelationType: 'Medinan', startPage: 2, endPage: 49 },
      { number: 3, name: 'Ali \'Imran', nameArabic: 'آل عمران', englishName: 'The Family of Imran', totalVerses: 200, revelationType: 'Medinan', startPage: 50, endPage: 76 },
      { number: 4, name: 'An-Nisa', nameArabic: 'النساء', englishName: 'The Women', totalVerses: 176, revelationType: 'Medinan', startPage: 77, endPage: 106 },
      { number: 5, name: 'Al-Ma\'ida', nameArabic: 'المائدة', englishName: 'The Table', totalVerses: 120, revelationType: 'Medinan', startPage: 106, endPage: 127 },
      { number: 6, name: 'Al-An\'am', nameArabic: 'الأنعام', englishName: 'The Cattle', totalVerses: 165, revelationType: 'Meccan', startPage: 128, endPage: 150 },
      { number: 7, name: 'Al-A\'raf', nameArabic: 'الأعراف', englishName: 'The Heights', totalVerses: 206, revelationType: 'Meccan', startPage: 151, endPage: 176 },
      { number: 8, name: 'Al-Anfal', nameArabic: 'الأنفال', englishName: 'The Spoils of War', totalVerses: 75, revelationType: 'Medinan', startPage: 177, endPage: 186 },
      { number: 9, name: 'At-Tawba', nameArabic: 'التوبة', englishName: 'The Repentance', totalVerses: 129, revelationType: 'Medinan', startPage: 187, endPage: 206 },
      { number: 10, name: 'Yunus', nameArabic: 'يونس', englishName: 'Jonah', totalVerses: 109, revelationType: 'Meccan', startPage: 208, endPage: 220 },
      { number: 11, name: 'Hud', nameArabic: 'هود', englishName: 'Hud', totalVerses: 123, revelationType: 'Meccan', startPage: 221, endPage: 235 },
      { number: 12, name: 'Yusuf', nameArabic: 'يوسف', englishName: 'Joseph', totalVerses: 111, revelationType: 'Meccan', startPage: 235, endPage: 249 },
      { number: 13, name: 'Ar-Ra\'d', nameArabic: 'الرعد', englishName: 'The Thunder', totalVerses: 43, revelationType: 'Medinan', startPage: 249, endPage: 255 },
      { number: 14, name: 'Ibrahim', nameArabic: 'ابراهيم', englishName: 'Abraham', totalVerses: 52, revelationType: 'Meccan', startPage: 255, endPage: 261 },
      { number: 15, name: 'Al-Hijr', nameArabic: 'الحجر', englishName: 'The Rocky Tract', totalVerses: 99, revelationType: 'Meccan', startPage: 262, endPage: 267 },
      { number: 16, name: 'An-Nahl', nameArabic: 'النحل', englishName: 'The Bee', totalVerses: 128, revelationType: 'Meccan', startPage: 267, endPage: 281 },
      { number: 17, name: 'Al-Isra', nameArabic: 'الإسراء', englishName: 'The Night Journey', totalVerses: 111, revelationType: 'Meccan', startPage: 282, endPage: 293 },
      { number: 18, name: 'Al-Kahf', nameArabic: 'الكهف', englishName: 'The Cave', totalVerses: 110, revelationType: 'Meccan', startPage: 293, endPage: 304 },
      { number: 19, name: 'Maryam', nameArabic: 'مريم', englishName: 'Mary', totalVerses: 98, revelationType: 'Meccan', startPage: 305, endPage: 312 },
      { number: 20, name: 'Ta-Ha', nameArabic: 'طه', englishName: 'Ta-Ha', totalVerses: 135, revelationType: 'Meccan', startPage: 312, endPage: 321 },
      { number: 21, name: 'Al-Anbiya', nameArabic: 'الأنبياء', englishName: 'The Prophets', totalVerses: 112, revelationType: 'Meccan', startPage: 322, endPage: 331 },
      { number: 22, name: 'Al-Hajj', nameArabic: 'الحج', englishName: 'The Pilgrimage', totalVerses: 78, revelationType: 'Medinan', startPage: 332, endPage: 341 },
      { number: 23, name: 'Al-Mu\'minun', nameArabic: 'المؤمنون', englishName: 'The Believers', totalVerses: 118, revelationType: 'Meccan', startPage: 342, endPage: 349 },
      { number: 24, name: 'An-Nur', nameArabic: 'النور', englishName: 'The Light', totalVerses: 64, revelationType: 'Medinan', startPage: 350, endPage: 359 },
      { number: 25, name: 'Al-Furqan', nameArabic: 'الفرقان', englishName: 'The Criterion', totalVerses: 77, revelationType: 'Meccan', startPage: 359, endPage: 366 },
      { number: 26, name: 'Ash-Shu\'ara', nameArabic: 'الشعراء', englishName: 'The Poets', totalVerses: 227, revelationType: 'Meccan', startPage: 367, endPage: 377 },
      { number: 27, name: 'An-Naml', nameArabic: 'النمل', englishName: 'The Ant', totalVerses: 93, revelationType: 'Meccan', startPage: 377, endPage: 385 },
      { number: 28, name: 'Al-Qasas', nameArabic: 'القصص', englishName: 'The Stories', totalVerses: 88, revelationType: 'Meccan', startPage: 385, endPage: 396 },
      { number: 29, name: 'Al-\'Ankabut', nameArabic: 'العنكبوت', englishName: 'The Spider', totalVerses: 69, revelationType: 'Meccan', startPage: 396, endPage: 404 },
      { number: 30, name: 'Ar-Rum', nameArabic: 'الروم', englishName: 'The Romans', totalVerses: 60, revelationType: 'Meccan', startPage: 404, endPage: 410 },
      { number: 31, name: 'Luqman', nameArabic: 'لقمان', englishName: 'Luqman', totalVerses: 34, revelationType: 'Meccan', startPage: 411, endPage: 414 },
      { number: 32, name: 'As-Sajda', nameArabic: 'السجدة', englishName: 'The Prostration', totalVerses: 30, revelationType: 'Meccan', startPage: 415, endPage: 418 },
      { number: 33, name: 'Al-Ahzab', nameArabic: 'الأحزاب', englishName: 'The Combined Forces', totalVerses: 73, revelationType: 'Medinan', startPage: 418, endPage: 427 },
      { number: 34, name: 'Saba', nameArabic: 'سبإ', englishName: 'Sheba', totalVerses: 54, revelationType: 'Meccan', startPage: 428, endPage: 434 },
      { number: 35, name: 'Fatir', nameArabic: 'فاطر', englishName: 'Originator', totalVerses: 45, revelationType: 'Meccan', startPage: 434, endPage: 440 },
      { number: 36, name: 'Ya-Sin', nameArabic: 'يس', englishName: 'Ya-Sin', totalVerses: 83, revelationType: 'Meccan', startPage: 440, endPage: 445 },
      { number: 37, name: 'As-Saffat', nameArabic: 'الصافات', englishName: 'Those Who Set The Ranks', totalVerses: 182, revelationType: 'Meccan', startPage: 446, endPage: 452 },
      { number: 38, name: 'Sad', nameArabic: 'ص', englishName: 'The Letter Sad', totalVerses: 88, revelationType: 'Meccan', startPage: 453, endPage: 458 },
      { number: 39, name: 'Az-Zumar', nameArabic: 'الزمر', englishName: 'The Troops', totalVerses: 75, revelationType: 'Meccan', startPage: 458, endPage: 467 },
      { number: 40, name: 'Ghafir', nameArabic: 'غافر', englishName: 'The Forgiver', totalVerses: 85, revelationType: 'Meccan', startPage: 467, endPage: 477 },
      { number: 41, name: 'Fussilat', nameArabic: 'فصلت', englishName: 'Explained In Detail', totalVerses: 54, revelationType: 'Meccan', startPage: 477, endPage: 482 },
      { number: 42, name: 'Ash-Shura', nameArabic: 'الشورى', englishName: 'The Consultation', totalVerses: 53, revelationType: 'Meccan', startPage: 483, endPage: 489 },
      { number: 43, name: 'Az-Zukhruf', nameArabic: 'الزخرف', englishName: 'The Ornaments Of Gold', totalVerses: 89, revelationType: 'Meccan', startPage: 489, endPage: 495 },
      { number: 44, name: 'Ad-Dukhan', nameArabic: 'الدخان', englishName: 'The Smoke', totalVerses: 59, revelationType: 'Meccan', startPage: 496, endPage: 498 },
      { number: 45, name: 'Al-Jathiya', nameArabic: 'الجاثية', englishName: 'The Crouching', totalVerses: 37, revelationType: 'Meccan', startPage: 499, endPage: 502 },
      { number: 46, name: 'Al-Ahqaf', nameArabic: 'الأحقاف', englishName: 'The Wind-Curved Sandhills', totalVerses: 35, revelationType: 'Meccan', startPage: 502, endPage: 506 },
      { number: 47, name: 'Muhammad', nameArabic: 'محمد', englishName: 'Muhammad', totalVerses: 38, revelationType: 'Medinan', startPage: 507, endPage: 511 },
      { number: 48, name: 'Al-Fath', nameArabic: 'الفتح', englishName: 'The Victory', totalVerses: 29, revelationType: 'Medinan', startPage: 511, endPage: 515 },
      { number: 49, name: 'Al-Hujurat', nameArabic: 'الحجرات', englishName: 'The Rooms', totalVerses: 18, revelationType: 'Medinan', startPage: 515, endPage: 517 },
      { number: 50, name: 'Qaf', nameArabic: 'ق', englishName: 'The Letter Qaf', totalVerses: 45, revelationType: 'Meccan', startPage: 518, endPage: 520 },
      { number: 51, name: 'Adh-Dhariyat', nameArabic: 'الذاريات', englishName: 'The Winnowing Winds', totalVerses: 60, revelationType: 'Meccan', startPage: 520, endPage: 523 },
      { number: 52, name: 'At-Tur', nameArabic: 'الطور', englishName: 'The Mount', totalVerses: 49, revelationType: 'Meccan', startPage: 523, endPage: 525 },
      { number: 53, name: 'An-Najm', nameArabic: 'النجم', englishName: 'The Star', totalVerses: 62, revelationType: 'Meccan', startPage: 526, endPage: 528 },
      { number: 54, name: 'Al-Qamar', nameArabic: 'القمر', englishName: 'The Moon', totalVerses: 55, revelationType: 'Meccan', startPage: 528, endPage: 531 },
      { number: 55, name: 'Ar-Rahman', nameArabic: 'الرحمن', englishName: 'The Beneficent', totalVerses: 78, revelationType: 'Medinan', startPage: 531, endPage: 534 },
      { number: 56, name: 'Al-Waqi\'a', nameArabic: 'الواقعة', englishName: 'The Inevitable', totalVerses: 96, revelationType: 'Meccan', startPage: 534, endPage: 537 },
      { number: 57, name: 'Al-Hadid', nameArabic: 'الحديد', englishName: 'The Iron', totalVerses: 29, revelationType: 'Medinan', startPage: 537, endPage: 541 },
      { number: 58, name: 'Al-Mujadila', nameArabic: 'المجادلة', englishName: 'The Pleading Woman', totalVerses: 22, revelationType: 'Medinan', startPage: 542, endPage: 545 },
      { number: 59, name: 'Al-Hashr', nameArabic: 'الحشر', englishName: 'The Exile', totalVerses: 24, revelationType: 'Medinan', startPage: 545, endPage: 548 },
      { number: 60, name: 'Al-Mumtahana', nameArabic: 'الممتحنة', englishName: 'She That Is To Be Examined', totalVerses: 13, revelationType: 'Medinan', startPage: 549, endPage: 551 },
      { number: 61, name: 'As-Saf', nameArabic: 'الصف', englishName: 'The Ranks', totalVerses: 14, revelationType: 'Medinan', startPage: 551, endPage: 552 },
      { number: 62, name: 'Al-Jumu\'a', nameArabic: 'الجمعة', englishName: 'The Congregation', totalVerses: 11, revelationType: 'Medinan', startPage: 553, endPage: 554 },
      { number: 63, name: 'Al-Munafiqun', nameArabic: 'المنافقون', englishName: 'The Hypocrites', totalVerses: 11, revelationType: 'Medinan', startPage: 554, endPage: 555 },
      { number: 64, name: 'At-Taghabun', nameArabic: 'التغابن', englishName: 'The Mutual Disillusion', totalVerses: 18, revelationType: 'Medinan', startPage: 556, endPage: 557 },
      { number: 65, name: 'At-Talaq', nameArabic: 'الطلاق', englishName: 'The Divorce', totalVerses: 12, revelationType: 'Medinan', startPage: 558, endPage: 559 },
      { number: 66, name: 'At-Tahrim', nameArabic: 'التحريم', englishName: 'The Prohibition', totalVerses: 12, revelationType: 'Medinan', startPage: 560, endPage: 561 },
      { number: 67, name: 'Al-Mulk', nameArabic: 'الملك', englishName: 'The Sovereignty', totalVerses: 30, revelationType: 'Meccan', startPage: 562, endPage: 564 },
      { number: 68, name: 'Al-Qalam', nameArabic: 'القلم', englishName: 'The Pen', totalVerses: 52, revelationType: 'Meccan', startPage: 564, endPage: 566 },
      { number: 69, name: 'Al-Haqqa', nameArabic: 'الحاقة', englishName: 'The Reality', totalVerses: 52, revelationType: 'Meccan', startPage: 566, endPage: 568 },
      { number: 70, name: 'Al-Ma\'arij', nameArabic: 'المعارج', englishName: 'The Ascending Stairways', totalVerses: 44, revelationType: 'Meccan', startPage: 568, endPage: 570 },
      { number: 71, name: 'Nuh', nameArabic: 'نوح', englishName: 'Noah', totalVerses: 28, revelationType: 'Meccan', startPage: 570, endPage: 571 },
      { number: 72, name: 'Al-Jinn', nameArabic: 'الجن', englishName: 'The Jinn', totalVerses: 28, revelationType: 'Meccan', startPage: 572, endPage: 573 },
      { number: 73, name: 'Al-Muzzammil', nameArabic: 'المزمل', englishName: 'The Enshrouded One', totalVerses: 20, revelationType: 'Meccan', startPage: 574, endPage: 575 },
      { number: 74, name: 'Al-Muddaththir', nameArabic: 'المدثر', englishName: 'The Cloaked One', totalVerses: 56, revelationType: 'Meccan', startPage: 575, endPage: 577 },
      { number: 75, name: 'Al-Qiyama', nameArabic: 'القيامة', englishName: 'The Resurrection', totalVerses: 40, revelationType: 'Meccan', startPage: 577, endPage: 578 },
      { number: 76, name: 'Al-Insan', nameArabic: 'الانسان', englishName: 'Man', totalVerses: 31, revelationType: 'Medinan', startPage: 578, endPage: 580 },
      { number: 77, name: 'Al-Mursalat', nameArabic: 'المرسلات', englishName: 'The Emissaries', totalVerses: 50, revelationType: 'Meccan', startPage: 580, endPage: 581 },
      { number: 78, name: 'An-Naba', nameArabic: 'النبإ', englishName: 'The Tidings', totalVerses: 40, revelationType: 'Meccan', startPage: 582, endPage: 583 },
      { number: 79, name: 'An-Nazi\'at', nameArabic: 'النازعات', englishName: 'Those Who Drag Forth', totalVerses: 46, revelationType: 'Meccan', startPage: 583, endPage: 584 },
      { number: 80, name: '\'Abasa', nameArabic: 'عبس', englishName: 'He Frowned', totalVerses: 42, revelationType: 'Meccan', startPage: 585, endPage: 586 },
      { number: 81, name: 'At-Takwir', nameArabic: 'التكوير', englishName: 'The Overthrowing', totalVerses: 29, revelationType: 'Meccan', startPage: 586, endPage: 587 },
      { number: 82, name: 'Al-Infitar', nameArabic: 'الإنفطار', englishName: 'The Cleaving', totalVerses: 19, revelationType: 'Meccan', startPage: 587, endPage: 587 },
      { number: 83, name: 'Al-Mutaffifin', nameArabic: 'المطففين', englishName: 'The Defrauding', totalVerses: 36, revelationType: 'Meccan', startPage: 587, endPage: 589 },
      { number: 84, name: 'Al-Inshiqaq', nameArabic: 'الإنشقاق', englishName: 'The Sundering', totalVerses: 25, revelationType: 'Meccan', startPage: 589, endPage: 590 },
      { number: 85, name: 'Al-Buruj', nameArabic: 'البروج', englishName: 'The Mansions Of The Stars', totalVerses: 22, revelationType: 'Meccan', startPage: 590, endPage: 591 },
      { number: 86, name: 'At-Tariq', nameArabic: 'الطارق', englishName: 'The Nightcomer', totalVerses: 17, revelationType: 'Meccan', startPage: 591, endPage: 591 },
      { number: 87, name: 'Al-A\'la', nameArabic: 'الأعلى', englishName: 'The Most High', totalVerses: 19, revelationType: 'Meccan', startPage: 591, endPage: 592 },
      { number: 88, name: 'Al-Ghashiya', nameArabic: 'الغاشية', englishName: 'The Overwhelming', totalVerses: 26, revelationType: 'Meccan', startPage: 592, endPage: 592 },
      { number: 89, name: 'Al-Fajr', nameArabic: 'الفجر', englishName: 'The Dawn', totalVerses: 30, revelationType: 'Meccan', startPage: 593, endPage: 594 },
      { number: 90, name: 'Al-Balad', nameArabic: 'البلد', englishName: 'The City', totalVerses: 20, revelationType: 'Meccan', startPage: 594, endPage: 595 },
      { number: 91, name: 'Ash-Shams', nameArabic: 'الشمس', englishName: 'The Sun', totalVerses: 15, revelationType: 'Meccan', startPage: 595, endPage: 595 },
      { number: 92, name: 'Al-Layl', nameArabic: 'الليل', englishName: 'The Night', totalVerses: 21, revelationType: 'Meccan', startPage: 595, endPage: 596 },
      { number: 93, name: 'Ad-Duha', nameArabic: 'الضحى', englishName: 'The Morning Hours', totalVerses: 11, revelationType: 'Meccan', startPage: 596, endPage: 596 },
      { number: 94, name: 'Ash-Sharh', nameArabic: 'الشرح', englishName: 'The Relief', totalVerses: 8, revelationType: 'Meccan', startPage: 596, endPage: 596 },
      { number: 95, name: 'At-Tin', nameArabic: 'التين', englishName: 'The Fig', totalVerses: 8, revelationType: 'Meccan', startPage: 597, endPage: 597 },
      { number: 96, name: 'Al-\'Alaq', nameArabic: 'العلق', englishName: 'The Clot', totalVerses: 19, revelationType: 'Meccan', startPage: 597, endPage: 597 },
      { number: 97, name: 'Al-Qadr', nameArabic: 'القدر', englishName: 'The Power', totalVerses: 5, revelationType: 'Meccan', startPage: 598, endPage: 598 },
      { number: 98, name: 'Al-Bayyina', nameArabic: 'البينة', englishName: 'The Clear Proof', totalVerses: 8, revelationType: 'Medinan', startPage: 598, endPage: 599 },
      { number: 99, name: 'Az-Zalzala', nameArabic: 'الزلزلة', englishName: 'The Earthquake', totalVerses: 8, revelationType: 'Medinan', startPage: 599, endPage: 599 },
      { number: 100, name: 'Al-\'Adiyat', nameArabic: 'العاديات', englishName: 'The Courser', totalVerses: 11, revelationType: 'Meccan', startPage: 599, endPage: 600 },
      { number: 101, name: 'Al-Qari\'a', nameArabic: 'القارعة', englishName: 'The Calamity', totalVerses: 11, revelationType: 'Meccan', startPage: 600, endPage: 600 },
      { number: 102, name: 'At-Takathur', nameArabic: 'التكاثر', englishName: 'The Rivalry In World Increase', totalVerses: 8, revelationType: 'Meccan', startPage: 600, endPage: 600 },
      { number: 103, name: 'Al-\'Asr', nameArabic: 'العصر', englishName: 'The Declining Day', totalVerses: 3, revelationType: 'Meccan', startPage: 601, endPage: 601 },
      { number: 104, name: 'Al-Humaza', nameArabic: 'الهمزة', englishName: 'The Traducer', totalVerses: 9, revelationType: 'Meccan', startPage: 601, endPage: 601 },
      { number: 105, name: 'Al-Fil', nameArabic: 'الفيل', englishName: 'The Elephant', totalVerses: 5, revelationType: 'Meccan', startPage: 601, endPage: 601 },
      { number: 106, name: 'Quraysh', nameArabic: 'قريش', englishName: 'Quraysh', totalVerses: 4, revelationType: 'Meccan', startPage: 602, endPage: 602 },
      { number: 107, name: 'Al-Ma\'un', nameArabic: 'الماعون', englishName: 'The Small Kindnesses', totalVerses: 7, revelationType: 'Meccan', startPage: 602, endPage: 602 },
      { number: 108, name: 'Al-Kawthar', nameArabic: 'الكوثر', englishName: 'The Abundance', totalVerses: 3, revelationType: 'Meccan', startPage: 602, endPage: 602 },
      { number: 109, name: 'Al-Kafirun', nameArabic: 'الكافرون', englishName: 'The Disbelievers', totalVerses: 6, revelationType: 'Meccan', startPage: 603, endPage: 603 },
      { number: 110, name: 'An-Nasr', nameArabic: 'النصر', englishName: 'The Divine Support', totalVerses: 3, revelationType: 'Medinan', startPage: 603, endPage: 603 },
      { number: 111, name: 'Al-Masad', nameArabic: 'المسد', englishName: 'The Palm Fiber', totalVerses: 5, revelationType: 'Meccan', startPage: 603, endPage: 603 },
      { number: 112, name: 'Al-Ikhlas', nameArabic: 'الإخلاص', englishName: 'The Sincerity', totalVerses: 4, revelationType: 'Meccan', startPage: 604, endPage: 604 },
      { number: 113, name: 'Al-Falaq', nameArabic: 'الفلق', englishName: 'The Daybreak', totalVerses: 5, revelationType: 'Meccan', startPage: 604, endPage: 604 },
      { number: 114, name: 'An-Nas', nameArabic: 'الناس', englishName: 'Mankind', totalVerses: 6, revelationType: 'Meccan', startPage: 604, endPage: 604 },
    ];

    for (const surah of surahs) {
      await query(
        `INSERT INTO surahs (number, name, name_arabic, english_name, total_verses, revelation_type, start_page, end_page)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (number) DO NOTHING`,
        [surah.number, surah.name, surah.nameArabic, surah.englishName, surah.totalVerses, surah.revelationType, surah.startPage, surah.endPage]
      );
    }
    console.log(' All 114 surahs seeded successfully');

    // Seed all 60 Hizbs with correct surah mappings based on actual page ranges
    // Each hizb is approximately 10 pages (604 pages / 60 hizbs)
    const hizbs = [
      { number: 1, startSurah: 1, startVerse: 1, endSurah: 2, endVerse: 25 },      // Pages 1-10: Al-Fatiha + Al-Baqara
      { number: 2, startSurah: 2, startVerse: 26, endSurah: 2, endVerse: 73 },     // Pages 11-20: Al-Baqara
      { number: 3, startSurah: 2, startVerse: 74, endSurah: 2, endVerse: 105 },    // Pages 21-30: Al-Baqara
      { number: 4, startSurah: 2, startVerse: 106, endSurah: 2, endVerse: 141 },   // Pages 31-40: Al-Baqara
      { number: 5, startSurah: 2, startVerse: 142, endSurah: 2, endVerse: 176 },   // Pages 41-50: Al-Baqara
      { number: 6, startSurah: 2, startVerse: 177, endSurah: 3, endVerse: 14 },    // Pages 51-60: Al-Baqara + Ali 'Imran
      { number: 7, startSurah: 3, startVerse: 15, endSurah: 3, endVerse: 92 },     // Pages 61-70: Ali 'Imran
      { number: 8, startSurah: 3, startVerse: 93, endSurah: 4, endVerse: 23 },     // Pages 71-80: Ali 'Imran + An-Nisa
      { number: 9, startSurah: 4, startVerse: 24, endSurah: 4, endVerse: 87 },     // Pages 81-90: An-Nisa
      { number: 10, startSurah: 4, startVerse: 88, endSurah: 4, endVerse: 147 },   // Pages 91-100: An-Nisa
      { number: 11, startSurah: 4, startVerse: 148, endSurah: 5, endVerse: 26 },   // Pages 101-110: An-Nisa + Al-Ma'ida
      { number: 12, startSurah: 5, startVerse: 27, endSurah: 5, endVerse: 81 },    // Pages 111-120: Al-Ma'ida
      { number: 13, startSurah: 5, startVerse: 82, endSurah: 6, endVerse: 35 },    // Pages 121-130: Al-Ma'ida + Al-An'am
      { number: 14, startSurah: 6, startVerse: 36, endSurah: 6, endVerse: 110 },   // Pages 131-140: Al-An'am
      { number: 15, startSurah: 6, startVerse: 111, endSurah: 7, endVerse: 31 },   // Pages 141-150: Al-An'am + Al-A'raf
      { number: 16, startSurah: 7, startVerse: 32, endSurah: 7, endVerse: 87 },    // Pages 151-160: Al-A'raf
      { number: 17, startSurah: 7, startVerse: 88, endSurah: 7, endVerse: 170 },   // Pages 161-170: Al-A'raf
      { number: 18, startSurah: 7, startVerse: 171, endSurah: 8, endVerse: 40 },   // Pages 171-180: Al-A'raf + Al-Anfal
      { number: 19, startSurah: 8, startVerse: 41, endSurah: 9, endVerse: 33 },    // Pages 181-190: Al-Anfal + At-Tawba
      { number: 20, startSurah: 9, startVerse: 34, endSurah: 9, endVerse: 92 },    // Pages 191-200: At-Tawba
      { number: 21, startSurah: 9, startVerse: 93, endSurah: 10, endVerse: 25 },   // Pages 201-210: At-Tawba + Yunus
      { number: 22, startSurah: 10, startVerse: 26, endSurah: 11, endVerse: 5 },   // Pages 211-220: Yunus + Hud
      { number: 23, startSurah: 11, startVerse: 6, endSurah: 11, endVerse: 83 },   // Pages 221-230: Hud
      { number: 24, startSurah: 11, startVerse: 84, endSurah: 12, endVerse: 52 },  // Pages 231-240: Hud + Yusuf
      { number: 25, startSurah: 12, startVerse: 53, endSurah: 13, endVerse: 18 },  // Pages 241-250: Yusuf + Ar-Ra'd
      { number: 26, startSurah: 13, startVerse: 19, endSurah: 14, endVerse: 52 },  // Pages 251-260: Ar-Ra'd + Ibrahim
      { number: 27, startSurah: 15, startVerse: 1, endSurah: 16, endVerse: 50 },   // Pages 261-270: Al-Hijr + An-Nahl
      { number: 28, startSurah: 16, startVerse: 51, endSurah: 16, endVerse: 128 }, // Pages 271-280: An-Nahl
      { number: 29, startSurah: 17, startVerse: 1, endSurah: 17, endVerse: 98 },   // Pages 281-290: Al-Isra
      { number: 30, startSurah: 17, startVerse: 99, endSurah: 18, endVerse: 74 },  // Pages 291-300: Al-Isra + Al-Kahf
      { number: 31, startSurah: 18, startVerse: 75, endSurah: 19, endVerse: 98 },  // Pages 301-310: Al-Kahf + Maryam
      { number: 32, startSurah: 20, startVerse: 1, endSurah: 20, endVerse: 135 },  // Pages 311-320: Ta-Ha
      { number: 33, startSurah: 21, startVerse: 1, endSurah: 21, endVerse: 112 },  // Pages 321-330: Al-Anbiya
      { number: 34, startSurah: 22, startVerse: 1, endSurah: 22, endVerse: 78 },   // Pages 331-340: Al-Hajj
      { number: 35, startSurah: 23, startVerse: 1, endSurah: 23, endVerse: 118 },  // Pages 341-350: Al-Mu'minun
      { number: 36, startSurah: 24, startVerse: 1, endSurah: 25, endVerse: 20 },   // Pages 351-360: An-Nur + Al-Furqan
      { number: 37, startSurah: 25, startVerse: 21, endSurah: 26, endVerse: 110 }, // Pages 361-370: Al-Furqan + Ash-Shu'ara
      { number: 38, startSurah: 26, startVerse: 111, endSurah: 27, endVerse: 55 }, // Pages 371-380: Ash-Shu'ara + An-Naml
      { number: 39, startSurah: 27, startVerse: 56, endSurah: 28, endVerse: 50 },  // Pages 381-390: An-Naml + Al-Qasas
      { number: 40, startSurah: 28, startVerse: 51, endSurah: 29, endVerse: 45 },  // Pages 391-400: Al-Qasas + Al-'Ankabut
      { number: 41, startSurah: 29, startVerse: 46, endSurah: 31, endVerse: 21 },  // Pages 401-410: Al-'Ankabut + Ar-Rum + Luqman
      { number: 42, startSurah: 31, startVerse: 22, endSurah: 33, endVerse: 30 },  // Pages 411-420: Luqman + As-Sajda + Al-Ahzab
      { number: 43, startSurah: 33, startVerse: 31, endSurah: 34, endVerse: 23 },  // Pages 421-430: Al-Ahzab + Saba
      { number: 44, startSurah: 34, startVerse: 24, endSurah: 36, endVerse: 27 },  // Pages 431-440: Saba + Fatir + Ya-Sin
      { number: 45, startSurah: 36, startVerse: 28, endSurah: 37, endVerse: 144 }, // Pages 441-450: Ya-Sin + As-Saffat
      { number: 46, startSurah: 37, startVerse: 145, endSurah: 39, endVerse: 31 }, // Pages 451-460: As-Saffat + Sad + Az-Zumar
      { number: 47, startSurah: 39, startVerse: 32, endSurah: 40, endVerse: 40 },  // Pages 461-470: Az-Zumar + Ghafir
      { number: 48, startSurah: 40, startVerse: 41, endSurah: 41, endVerse: 46 },  // Pages 471-480: Ghafir + Fussilat
      { number: 49, startSurah: 41, startVerse: 47, endSurah: 43, endVerse: 23 },  // Pages 481-490: Fussilat + Ash-Shura + Az-Zukhruf
      { number: 50, startSurah: 43, startVerse: 24, endSurah: 45, endVerse: 37 },  // Pages 491-500: Az-Zukhruf + Ad-Dukhan + Al-Jathiya
      { number: 51, startSurah: 46, startVerse: 1, endSurah: 48, endVerse: 17 },   // Pages 501-510: Al-Ahqaf + Muhammad + Al-Fath
      { number: 52, startSurah: 48, startVerse: 18, endSurah: 51, endVerse: 30 },  // Pages 511-520: Al-Fath + Al-Hujurat + Qaf + Adh-Dhariyat
      { number: 53, startSurah: 51, startVerse: 31, endSurah: 54, endVerse: 55 },  // Pages 521-530: Adh-Dhariyat + At-Tur + An-Najm + Al-Qamar
      { number: 54, startSurah: 55, startVerse: 1, endSurah: 57, endVerse: 29 },   // Pages 531-540: Ar-Rahman + Al-Waqi'a + Al-Hadid
      { number: 55, startSurah: 58, startVerse: 1, endSurah: 62, endVerse: 11 },   // Pages 541-550: Al-Mujadila + Al-Hashr + Al-Mumtahana + As-Saf + Al-Jumu'a
      { number: 56, startSurah: 63, startVerse: 1, endSurah: 66, endVerse: 12 },   // Pages 551-560: Al-Munafiqun + At-Taghabun + At-Talaq + At-Tahrim
      { number: 57, startSurah: 67, startVerse: 1, endSurah: 71, endVerse: 28 },   // Pages 561-570: Al-Mulk + Al-Qalam + Al-Haqqa + Al-Ma'arij + Nuh
      { number: 58, startSurah: 72, startVerse: 1, endSurah: 77, endVerse: 50 },   // Pages 571-580: Al-Jinn + Al-Muzzammil + Al-Muddaththir + Al-Qiyama + Al-Insan + Al-Mursalat
      { number: 59, startSurah: 78, startVerse: 1, endSurah: 86, endVerse: 17 },   // Pages 581-590: An-Naba + An-Nazi'at + 'Abasa + At-Takwir + Al-Infitar + Al-Mutaffifin + Al-Inshiqaq + Al-Buruj + At-Tariq
      { number: 60, startSurah: 87, startVerse: 1, endSurah: 114, endVerse: 6 },   // Pages 591-604: Al-A'la through An-Nas
    ];

    for (const hizb of hizbs) {
      await query(
        `INSERT INTO hizbs (number, start_surah, start_verse, end_surah, end_verse)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (number) DO NOTHING`,
        [hizb.number, hizb.startSurah, hizb.startVerse, hizb.endSurah, hizb.endVerse]
      );
    }
    console.log('✅ All 60 hizbs seeded successfully');

    // Add sample verses (just a few for demonstration)
    const verses = [
      { surahId: 1, number: 1, textArabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', textFrench: 'Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux', page: 1 },
      { surahId: 1, number: 2, textArabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', textFrench: 'Louange à Allah, Seigneur de l\'univers', page: 1 },
      { surahId: 1, number: 3, textArabic: 'الرَّحْمَٰنِ الرَّحِيمِ', textFrench: 'Le Tout Miséricordieux, le Très Miséricordieux', page: 1 },
      { surahId: 1, number: 4, textArabic: 'مَالِكِ يَوْمِ الدِّينِ', textFrench: 'Maître du Jour de la rétribution', page: 1 },
      { surahId: 1, number: 5, textArabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', textFrench: 'C\'est Toi que nous adorons, et c\'est Toi dont nous implorons secours', page: 1 },
      { surahId: 1, number: 6, textArabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', textFrench: 'Guide-nous dans le droit chemin', page: 1 },
      { surahId: 1, number: 7, textArabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', textFrench: 'le chemin de ceux que Tu as comblés de faveurs, non pas de ceux qui ont encouru Ta colère, ni des égarés', page: 1 },
    ];

    for (const verse of verses) {
      await query(
        `INSERT INTO verses (surah_id, number, text_arabic, text_french, page)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (surah_id, number) DO NOTHING`,
        [verse.surahId, verse.number, verse.textArabic, verse.textFrench, verse.page]
      );
    }
    console.log('✅ Sample verses seeded');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📝 Default credentials:');
    console.log('   Admin: admin@qurandec.com / admin123');
    console.log('   Teacher: teacher@qurandec.com / teacher123');
    console.log('   Parent: +33612345678 (OTP via console)');
    console.log('\n👨‍👩‍👧 Sample data:');
    console.log('   Student: Yasmine Benali');
    console.log('   Class: Classe A (Code: MOSQ-01)');
    console.log('   Progress: 3 Hizbs, 850 points total');
    console.log('\n📖 Quran Data:');
    console.log('   114 Surahs (all pages 1-604)');
    console.log('   60 Hizbs (complete data)');
    console.log('   Sample verses from Al-Fatiha');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
