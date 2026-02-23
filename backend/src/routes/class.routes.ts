import { Router } from 'express';
import { query } from '../config/database';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

// Helper function to transform snake_case to camelCase
const transformClass = (classData: any) => ({
  id: classData.id,
  name: classData.name,
  code: classData.code,
  classType: classData.class_type || 'hifz',
  teacherId: classData.teacher_id,
  teacherName: classData.teacher_name,
  studentCount: parseInt(classData.student_count) || 0,
  createdAt: classData.created_at,
  updatedAt: classData.updated_at
});

// Get all classes (public - for registration)
router.get('/public', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.id, c.name, c.class_type, COALESCE(c.teacher_name, u.name) as teacher_name
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      ORDER BY c.name
    `);

    res.json(result.rows.map(row => ({
      id: row.id,
      name: row.name,
      classType: row.class_type || 'hifz',
      teacherName: row.teacher_name
    })));
  } catch (error) {
    console.error('Error fetching public classes:', error);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
});

// Get all classes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, 
             COALESCE(c.teacher_name, u.name) as teacher_name,
             (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      ORDER BY c.name
    `);

    res.json(result.rows.map(transformClass));
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
});

// Get class by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT c.*, 
             COALESCE(c.teacher_name, u.name) as teacher_name,
             (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(transformClass(result.rows[0]));
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ message: 'Failed to fetch class' });
  }
});

// Create class
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, teacherName, classType = 'hifz' } = req.body;

    // Generate a unique code from teacher name + random suffix
    const baseCode = (teacherName || 'CLS')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
    const code = `${baseCode}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const result = await query(
      'INSERT INTO classes (name, code, teacher_name, class_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, code, teacherName, classType]
    );

    // Add student_count = 0 for new class
    const classData = { ...result.rows[0], student_count: 0 };
    res.status(201).json(transformClass(classData));
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ message: 'Failed to create class' });
  }
});

export default router;
