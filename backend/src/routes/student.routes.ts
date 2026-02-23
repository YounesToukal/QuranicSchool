import { Router } from 'express';
import { query } from '../config/database';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import { validateIntId } from '../middleware/security';

const router = Router();

// Helper function to transform snake_case to camelCase
const transformStudent = (student: any) => ({
  id: student.id,
  firstName: student.first_name,
  lastName: student.last_name,
  parentId: student.parent_id,
  classId: student.class_id,
  photoUrl: student.photo_url,
  totalPoints: student.total_points,
  monthlyPoints: student.monthly_points,
  currentHizb: student.current_hizb,
  currentSurah: student.current_surah,
  currentPage: student.current_page,
  createdAt: student.created_at,
  updatedAt: student.updated_at
});

// Get student by ID
router.get('/:id', authMiddleware, validateIntId, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM students WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(transformStudent(result.rows[0]));
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Failed to fetch student' });
  }
});

// Get students by parent
router.get('/parent/:parentId', authMiddleware, async (req, res) => {
  try {
    const { parentId } = req.params;
    const result = await query('SELECT * FROM students WHERE parent_id = $1', [parentId]);
    res.json(result.rows.map(transformStudent));
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Get students by class
router.get('/class/:classId', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const { classId } = req.params;
    const result = await query('SELECT * FROM students WHERE class_id = $1 ORDER BY first_name', [classId]);
    res.json(result.rows.map(transformStudent));
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Update student
router.put('/:id', authMiddleware, validateIntId, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentHizb, currentSurah, currentPage, totalPoints, monthlyPoints } = req.body;

    const result = await query(
      `UPDATE students 
       SET current_hizb = COALESCE($1, current_hizb),
           current_surah = COALESCE($2, current_surah),
           current_page = COALESCE($3, current_page),
           total_points = COALESCE($4, total_points),
           monthly_points = COALESCE($5, monthly_points),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [currentHizb, currentSurah, currentPage, totalPoints, monthlyPoints, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(transformStudent(result.rows[0]));
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Failed to update student' });
  }
});

export default router;
