import { Router } from 'express';
import { query } from '../config/database';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import { validateProgressFields, validateIntId } from '../middleware/security';

const router = Router();

// Helper function to transform snake_case to camelCase
const transformProgress = (progress: any) => ({
  id: progress.id,
  studentId: progress.student_id,
  date: progress.date,
  pagesMemorized: progress.pages_memorized,
  pagesRevised: progress.pages_revised,
  attendance: progress.attendance,
  concentration: progress.concentration,
  pointsEarned: progress.points_earned,
  notes: progress.notes,
  teacherId: progress.teacher_id,
  createdAt: progress.created_at
});

// Calculate points based on progress
const calculatePoints = (progress: any) => {
  let points = 0;

  // Memorization points
  points += (progress.pagesMemorized || 0) * 100;

  // Revision points
  points += (progress.pagesRevised || 0) * 40;

  // Attendance points
  if (progress.attendance === 'present') {
    points += 10;
  } else if (progress.attendance === 'absent') {
    points -= 20;
  }

  // Concentration points
  if (progress.concentration === 'high') {
    points += 50;
  } else if (progress.concentration === 'medium') {
    points += 20;
  }

  return points;
};

// Create or update progress entry
router.post('/', authMiddleware, roleMiddleware('teacher'), validateProgressFields, async (req: AuthRequest, res) => {
  try {
    const {
      studentId,
      date,
      pagesMemorized,
      pagesRevised,
      attendance,
      concentration,
      notes
    } = req.body;

    console.log(`📊 Saisie progrès - Élève: ${studentId}, Date: ${date}, Pages mémorisées: ${pagesMemorized}, Pages révisées: ${pagesRevised}`);

    // Normalize date to YYYY-MM-DD format
    const normalizedDate = new Date(date).toISOString().split('T')[0];
    console.log(`📅 Date normalisée: ${normalizedDate}`);

    const pointsEarned = calculatePoints({
      pagesMemorized,
      pagesRevised,
      attendance,
      concentration
    });

    console.log(`✨ Ajout nouveau progrès - Points: ${pointsEarned}`);

    // Always insert new progress (allow multiple entries per day)
    const result = await query(
      `INSERT INTO progress 
       (student_id, date, pages_memorized, pages_revised, attendance, concentration, points_earned, notes, teacher_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [studentId, normalizedDate, pagesMemorized, pagesRevised, attendance, concentration, pointsEarned, notes, req.user.id]
    );

    // Create point transaction
    await query(
      `INSERT INTO point_transactions (student_id, type, points, description, date)
       VALUES ($1, $2, $3, $4, $5)`,
      [studentId, 'daily_progress', pointsEarned, 'Progrès quotidien', normalizedDate]
    );

    // Add points to student totals
    console.log(`💰 Ajout de ${pointsEarned} points pour l'élève ${studentId}`);
    
    await query(
      `UPDATE students 
       SET total_points = total_points + $1,
           monthly_points = monthly_points + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [pointsEarned, studentId]
    );

    res.status(201).json(transformProgress(result.rows[0]));
  } catch (error) {
    console.error('Error creating/updating progress:', error);
    res.status(500).json({ message: 'Failed to create/update progress' });
  }
});

// Get progress by student
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, limit } = req.query;

    let queryText = 'SELECT * FROM progress WHERE student_id = $1';
    const params: any[] = [studentId];

    if (startDate) {
      queryText += ' AND date >= $2';
      params.push(startDate);
    }

    if (endDate) {
      queryText += ` AND date <= $${params.length + 1}`;
      params.push(endDate);
    }

    queryText += ' ORDER BY date DESC';

    if (limit) {
      queryText += ` LIMIT ${parseInt(limit as string)}`;
    }

    const result = await query(queryText, params);
    res.json(result.rows.map(transformProgress));
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ message: 'Failed to fetch progress' });
  }
});

export default router;
