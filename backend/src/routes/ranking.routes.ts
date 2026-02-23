import { Router } from 'express';
import { query } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Helper function to transform snake_case to camelCase
const transformRanking = (ranking: any) => ({
  rank: ranking.rank,
  studentId: ranking.student_id,
  studentName: ranking.student_name,
  points: ranking.points,
  classId: ranking.class_id,
  className: ranking.class_name
});

// Get global ranking (public endpoint for landing page)
router.get('/global', async (req, res) => {
  try {
    const { period, classType } = req.query; // period: 'monthly' | 'total'; classType: 'hifz' | 'talqin'
    const pointsColumn = period === 'monthly' ? 'monthly_points' : 'total_points';
    const classTypeClause = classType ? `AND c.class_type = '${classType}'` : '';

    const result = await query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY s.${pointsColumn} DESC) as rank,
        s.id as student_id,
        CONCAT(s.first_name, ' ', SUBSTRING(s.last_name, 1, 1), '.') as student_name,
        s.${pointsColumn} as points,
        c.id as class_id,
        c.name as class_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE s.${pointsColumn} > 0 ${classTypeClause}
      ORDER BY s.${pointsColumn} DESC
      LIMIT 50
    `);

    res.json(result.rows.map(transformRanking));
  } catch (error) {
    console.error('Error fetching global ranking:', error);
    res.status(500).json({ message: 'Failed to fetch ranking' });
  }
});

// Get class ranking
router.get('/class/:classId', authMiddleware, async (req, res) => {
  try {
    const { classId } = req.params;
    const { period } = req.query; // 'monthly' or 'total'
    const pointsColumn = period === 'monthly' ? 'monthly_points' : 'total_points';

    const result = await query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY ${pointsColumn} DESC) as rank,
        id as student_id,
        CONCAT(first_name, ' ', last_name) as student_name,
        ${pointsColumn} as points,
        class_id,
        NULL as class_name
      FROM students
      WHERE class_id = $1 AND ${pointsColumn} > 0
      ORDER BY ${pointsColumn} DESC
    `, [classId]);

    res.json(result.rows.map(transformRanking));
  } catch (error) {
    console.error('Error fetching class ranking:', error);
    res.status(500).json({ message: 'Failed to fetch ranking' });
  }
});

export default router;
