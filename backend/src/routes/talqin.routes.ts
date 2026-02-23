import { Router } from 'express';
import { query } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get weekly assignments for a class
router.get('/assignments/class/:classId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { classId } = req.params;
    const result = await query(
      `SELECT 
        wa.id,
        wa.class_id as "classId",
        wa.student_id as "studentId",
        wa.week_start_date as "weekStartDate",
        wa.surah_id as "surahId",
        wa.verses_to_prepare as "versesToPrepare",
        wa.notes,
        wa.status,
        wa.teacher_id as "teacherId",
        wa.created_at as "createdAt",
        s.first_name || ' ' || s.last_name as "studentName",
        sur.name as "surahName",
        sur.name_arabic as "surahNameArabic"
      FROM weekly_assignments wa
      JOIN students s ON wa.student_id = s.id
      JOIN surahs sur ON wa.surah_id = sur.id
      WHERE wa.class_id = $1
      ORDER BY wa.week_start_date DESC`,
      [classId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching weekly assignments:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des devoirs' });
  }
});

// Get weekly assignments for a student
router.get('/assignments/student/:studentId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;
    const result = await query(
      `SELECT 
        wa.id,
        wa.class_id as "classId",
        wa.student_id as "studentId",
        wa.week_start_date as "weekStartDate",
        wa.surah_id as "surahId",
        wa.verses_to_prepare as "versesToPrepare",
        wa.notes,
        wa.status,
        wa.parent_acknowledged as "parentAcknowledged",
        wa.parent_acknowledged_at as "parentAcknowledgedAt",
        wa.teacher_id as "teacherId",
        wa.created_at as "createdAt",
        sur.name as "surahName",
        sur.name_arabic as "surahNameArabic"
      FROM weekly_assignments wa
      JOIN surahs sur ON wa.surah_id = sur.id
      WHERE wa.student_id = $1
      ORDER BY wa.week_start_date DESC
      LIMIT 10`,
      [studentId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des devoirs' });
  }
});

// Create weekly assignment for a student
router.post('/assignments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { classId, studentId, weekStartDate, surahId, versesToPrepare, notes } = req.body;
    const teacherId = req.user.id;

    const result = await query(
      `INSERT INTO weekly_assignments 
        (class_id, student_id, week_start_date, surah_id, verses_to_prepare, notes, teacher_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'assigned')
      RETURNING *`,
      [classId, studentId, weekStartDate, surahId, versesToPrepare, notes, teacherId]
    );

    res.status(201).json({
      message: 'Devoir assigné avec succès',
      assignment: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Erreur lors de la création du devoir' });
  }
});

// Create bulk weekly assignments for all students in a class
router.post('/assignments/bulk', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { classId, weekStartDate, surahId, versesToPrepare, notes } = req.body;
    const teacherId = req.user.id;

    // Get all students in the class
    const studentsResult = await query(
      `SELECT id FROM students WHERE class_id = $1`,
      [classId]
    );

    // Create assignment for each student
    const assignments = [];
    for (const student of studentsResult.rows) {
      const result = await query(
        `INSERT INTO weekly_assignments 
          (class_id, student_id, week_start_date, surah_id, verses_to_prepare, notes, teacher_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'assigned')
        RETURNING *`,
        [classId, student.id, weekStartDate, surahId, versesToPrepare, notes, teacherId]
      );
      assignments.push(result.rows[0]);
    }

    res.status(201).json({
      message: `${assignments.length} devoirs assignés avec succès`,
      assignments
    });
  } catch (error) {
    console.error('Error creating bulk assignments:', error);
    res.status(500).json({ message: 'Erreur lors de la création des devoirs' });
  }
});

// Update assignment status
router.patch('/assignments/:id/status', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await query(
      `UPDATE weekly_assignments 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [status, id]
    );

    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du statut' });
  }
});

// Parent acknowledges having seen an assignment
router.patch('/assignments/:id/acknowledge', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await query(
      `UPDATE weekly_assignments 
       SET parent_acknowledged = TRUE, parent_acknowledged_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Devoir confirmé' });
  } catch (error) {
    console.error('Error acknowledging assignment:', error);
    res.status(500).json({ message: 'Erreur lors de la confirmation' });
  }
});

// Log Talqin progress
router.post('/progress', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      studentId,
      date,
      surahPracticed,
      versesPracticed,
      pronunciationQuality,
      tajweedQuality,
      listeningAttention,
      repetitionAccuracy,
      attendance,
      notes,
      pointsEarned: clientPoints
    } = req.body;
    const teacherId = req.user.id;

    console.log('Received Talqin progress data:', {
      studentId, date, attendance,
      surahPracticed, versesPracticed,
      pronunciationQuality, tajweedQuality,
      listeningAttention, repetitionAccuracy,
      notes, teacherId
    });

    // Convert empty strings to null for proper database handling
    const cleanData = {
      studentId: studentId || null,
      date: date || null,
      surahPracticed: surahPracticed || null,
      versesPracticed: versesPracticed || null,
      pronunciationQuality: pronunciationQuality || null,
      tajweedQuality: tajweedQuality || null,
      listeningAttention: listeningAttention || null,
      repetitionAccuracy: repetitionAccuracy || null,
      attendance: attendance || null,
      notes: notes || null,
      teacherId: teacherId || null
    };

    // Calculate points server-side as well (security)
    const pointsEarned = attendance === 'present' ? (typeof clientPoints === 'number' ? clientPoints : 0) : 0;

    const result = await query(
      `INSERT INTO talqin_progress 
        (student_id, date, surah_practiced, verses_practiced, pronunciation_quality, 
         tajweed_quality, listening_attention, repetition_accuracy, attendance, notes, teacher_id, points_earned)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [cleanData.studentId, cleanData.date, cleanData.surahPracticed, cleanData.versesPracticed, 
       cleanData.pronunciationQuality, cleanData.tajweedQuality, cleanData.listeningAttention, 
       cleanData.repetitionAccuracy, cleanData.attendance, cleanData.notes, cleanData.teacherId, pointsEarned]
    );

    // Update student points totals if points were earned
    if (pointsEarned > 0 && cleanData.studentId) {
      await query(
        `UPDATE students SET 
          total_points = COALESCE(total_points, 0) + $1,
          monthly_points = COALESCE(monthly_points, 0) + $1
        WHERE id = $2`,
        [pointsEarned, cleanData.studentId]
      );
      console.log(`Points awarded: ${pointsEarned} for student ${cleanData.studentId}`);
    }

    console.log('Successfully inserted progress:', result.rows[0]);

    res.status(201).json({
      message: 'Progression enregistrée avec succès',
      progress: result.rows[0],
      pointsEarned
    });
  } catch (error) {
    console.error('Error logging Talqin progress:', error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de la progression' });
  }
});

// Get Talqin progress for a student
router.get('/progress/student/:studentId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 30 } = req.query;

    const result = await query(
      `SELECT 
        tp.id,
        tp.student_id as "studentId",
        tp.date,
        tp.surah_practiced as "surahPracticed",
        tp.verses_practiced as "versesPracticed",
        tp.pronunciation_quality as "pronunciationQuality",
        tp.tajweed_quality as "tajweedQuality",
        tp.listening_attention as "listeningAttention",
        tp.repetition_accuracy as "repetitionAccuracy",
        tp.attendance,
        tp.notes,
        tp.points_earned as "pointsEarned",
        tp.teacher_id as "teacherId",
        tp.created_at as "createdAt",
        s.name as "surahName",
        s.name_arabic as "surahNameArabic"
      FROM talqin_progress tp
      LEFT JOIN surahs s ON tp.surah_practiced = s.id
      WHERE tp.student_id = $1
      ORDER BY tp.date DESC
      LIMIT $2`,
      [studentId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching Talqin progress:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la progression' });
  }
});

// Get Talqin progress report for class (for printing)
router.get('/report/class/:classId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('Report request received:', { classId, startDate, endDate });

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Les dates de début et de fin sont requises' 
      });
    }

    const result = await query(
      `SELECT 
        s.id as "studentId",
        s.first_name || ' ' || s.last_name as "studentName",
        COUNT(tp.id) as "totalSessions",
        COUNT(CASE WHEN tp.attendance = 'present' THEN 1 END) as "attendanceCount",
        COUNT(CASE WHEN tp.pronunciation_quality = 'excellent' THEN 1 END) as "excellentPronunciation",
        COUNT(CASE WHEN tp.tajweed_quality = 'excellent' THEN 1 END) as "excellentTajweed",
        COALESCE(SUM(tp.points_earned), 0) as "totalPoints",
        AVG(CASE 
          WHEN tp.listening_attention = 'high' THEN 3
          WHEN tp.listening_attention = 'medium' THEN 2
          WHEN tp.listening_attention = 'low' THEN 1
        END) as "avgAttention",
        AVG(CASE 
          WHEN tp.repetition_accuracy = 'excellent' THEN 3
          WHEN tp.repetition_accuracy = 'good' THEN 2
          WHEN tp.repetition_accuracy = 'needs_improvement' THEN 1
        END) as "avgAccuracy"
      FROM students s
      LEFT JOIN talqin_progress tp ON s.id = tp.student_id 
        AND tp.date BETWEEN $2 AND $3
      WHERE s.class_id = $1
      GROUP BY s.id, s.first_name, s.last_name
      ORDER BY s.last_name, s.first_name`,
      [classId, startDate, endDate]
    );

    console.log('Report generated successfully:', result.rows.length, 'students');

    res.json(result.rows);
  } catch (error) {
    console.error('Error generating Talqin report:', error);
    res.status(500).json({ message: 'Erreur lors de la génération du rapport' });
  }
});

export default router;
