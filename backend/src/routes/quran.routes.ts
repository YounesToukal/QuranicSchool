import { Router } from 'express';
import { query } from '../config/database';

const router = Router();

// Get all surahs
router.get('/surahs', async (req, res) => {
  try {
    const result = await query('SELECT * FROM surahs ORDER BY number');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching surahs:', error);
    res.status(500).json({ message: 'Failed to fetch surahs' });
  }
});

// Get all hizbs
router.get('/hizbs', async (req, res) => {
  try {
    const result = await query(`
      SELECT h.*, 
             ARRAY_AGG(DISTINCT s.number ORDER BY s.number) as surahs
      FROM hizbs h
      LEFT JOIN surahs s ON s.number BETWEEN h.start_surah AND h.end_surah
      GROUP BY h.id, h.number
      ORDER BY h.number
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hizbs:', error);
    res.status(500).json({ message: 'Failed to fetch hizbs' });
  }
});

// Get verses by surah
router.get('/surahs/:surahId/verses', async (req, res) => {
  try {
    const { surahId } = req.params;
    const result = await query(
      'SELECT * FROM verses WHERE surah_id = $1 ORDER BY number',
      [surahId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching verses:', error);
    res.status(500).json({ message: 'Failed to fetch verses' });
  }
});

// Get daily verse (random)
router.get('/daily-verse', async (req, res) => {
  try {
    const result = await query(`
      SELECT v.*, s.name as surah_name, s.name_arabic as surah_name_arabic
      FROM verses v
      JOIN surahs s ON v.surah_id = s.id
      WHERE v.text_french IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 1
    `);

    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Error fetching daily verse:', error);
    res.status(500).json({ message: 'Failed to fetch daily verse' });
  }
});

export default router;
