import { Router } from 'express';
import { query } from '../config/database';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

// ─── STATISTICS ───────────────────────────────────────────────────────────────

// Get overview statistics
router.get('/stats/overview', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    // Total progress metrics
    const progressStats = await query(`
      SELECT 
        COALESCE(SUM(pages_memorized), 0) as total_pages_memorized,
        COALESCE(SUM(pages_revised), 0) as total_pages_revised,
        COUNT(DISTINCT student_id) as active_students,
        COUNT(*) as total_sessions
      FROM progress
    `);

    // Student progress by hizb
    const hizbProgress = await query(`
      SELECT 
        current_hizb,
        COUNT(*) as student_count
      FROM students
      WHERE current_hizb IS NOT NULL
      GROUP BY current_hizb
      ORDER BY current_hizb
    `);

    // Teacher activity
    const teacherActivity = await query(`
      SELECT 
        u.name as teacher_name,
        COUNT(DISTINCT p.id) as log_count,
        COALESCE(SUM(p.pages_memorized), 0) as total_pages_logged,
        COUNT(DISTINCT s.id) as students_taught
      FROM users u
      LEFT JOIN classes c ON c.teacher_id = u.id
      LEFT JOIN students s ON s.class_id = c.id
      LEFT JOIN progress p ON (p.teacher_id = u.id OR p.student_id = s.id)
      WHERE u.role = 'teacher'
      GROUP BY u.id, u.name
      ORDER BY log_count DESC
    `);

    // Recent activity (last 7 days)
    const recentActivity = await query(`
      SELECT 
        DATE(date) as activity_date,
        COUNT(*) as sessions,
        COALESCE(SUM(pages_memorized), 0) as pages_memorized,
        COALESCE(SUM(pages_revised), 0) as pages_revised
      FROM progress
      WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(date)
      ORDER BY activity_date DESC
    `);

    // Average pages per student
    const avgProgress = await query(`
      SELECT 
        AVG(current_page) as avg_page,
        AVG(current_hizb) as avg_hizb
      FROM students
      WHERE current_page > 0
    `);

    res.json({
      progressStats: {
        totalPagesMemorized: parseInt(progressStats.rows[0].total_pages_memorized) || 0,
        totalPagesRevised: parseInt(progressStats.rows[0].total_pages_revised) || 0,
        activeStudents: parseInt(progressStats.rows[0].active_students) || 0,
        totalSessions: parseInt(progressStats.rows[0].total_sessions) || 0,
      },
      hizbProgress: hizbProgress.rows.map(row => ({
        hizb: parseInt(row.current_hizb),
        studentCount: parseInt(row.student_count),
      })),
      teacherActivity: teacherActivity.rows.map(row => ({
        teacherName: row.teacher_name || 'Non assigné',
        logCount: parseInt(row.log_count),
        totalPagesLogged: parseInt(row.total_pages_logged),
        studentsTaught: parseInt(row.students_taught),
      })),
      recentActivity: recentActivity.rows.map(row => ({
        date: row.activity_date,
        sessions: parseInt(row.sessions),
        pagesMemorized: parseInt(row.pages_memorized),
        pagesRevised: parseInt(row.pages_revised),
      })),
      avgProgress: {
        avgPage: parseFloat(avgProgress.rows[0]?.avg_page) || 0,
        avgHizb: parseFloat(avgProgress.rows[0]?.avg_hizb) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// ─── USERS CRUD ───────────────────────────────────────────────────────────────

// List all users (teachers and parents)
router.get('/users', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id, u.role, u.name, u.phone, u.email,
        u.is_suspended, u.suspension_reason, u.created_at,
        u.login_count,
        COUNT(s.id) as student_count
      FROM users u
      LEFT JOIN students s ON s.parent_id = u.id
      WHERE u.role IN ('teacher', 'parent')
      GROUP BY u.id
      ORDER BY u.role, u.name
    `);
    res.json(result.rows.map(r => ({
      id: r.id,
      role: r.role,
      name: r.name,
      phone: r.phone,
      email: r.email,
      isSuspended: r.is_suspended,
      suspensionReason: r.suspension_reason,
      studentCount: parseInt(r.student_count) || 0,
      loginCount: parseInt(r.login_count) || 0,
      createdAt: r.created_at,
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user
router.put('/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, role } = req.body;
    const result = await query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        role = COALESCE($4, role),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [name || null, phone || null, email || null, role || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ id: result.rows[0].id, name: result.rows[0].name, phone: result.rows[0].phone });
  } catch (error: any) {
    if (error.code === '23505') return res.status(400).json({ message: 'رقم الهاتف مستخدم بالفعل' });
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Suspend / activate user
router.post('/users/:id/suspend', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend, reason } = req.body; // suspend: boolean
    await query(
      `UPDATE users SET is_suspended = $1, suspension_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [!!suspend, suspend ? (reason || null) : null, id]
    );
    res.json({ message: suspend ? 'Account suspended' : 'Account activated' });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ message: 'Failed to update account status' });
  }
});

// Delete user
router.delete('/users/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// ─── STUDENTS CRUD ────────────────────────────────────────────────────────────

// List all students with parent and class info
router.get('/students', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT
        s.id, s.first_name, s.last_name,
        s.total_points, s.monthly_points,
        s.current_hizb, s.current_surah, s.current_page,
        s.created_at,
        u.id as parent_id, u.name as parent_name, u.phone as parent_phone,
        u.is_suspended as parent_suspended,
        c.id as class_id, c.name as class_name, c.class_type
      FROM students s
      LEFT JOIN users u ON s.parent_id = u.id
      LEFT JOIN classes c ON s.class_id = c.id
      ORDER BY s.last_name, s.first_name
    `);
    res.json(result.rows.map(r => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      totalPoints: r.total_points,
      monthlyPoints: r.monthly_points,
      currentHizb: r.current_hizb,
      currentSurah: r.current_surah,
      currentPage: r.current_page,
      createdAt: r.created_at,
      parentId: r.parent_id,
      parentName: r.parent_name,
      parentPhone: r.parent_phone,
      parentSuspended: r.parent_suspended,
      classId: r.class_id,
      className: r.class_name,
      classType: r.class_type,
    })));
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Update student (name, class, points)
router.put('/students/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, classId, totalPoints, monthlyPoints, currentHizb, currentSurah, currentPage } = req.body;
    const result = await query(
      `UPDATE students SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        class_id = COALESCE($3, class_id),
        total_points = COALESCE($4, total_points),
        monthly_points = COALESCE($5, monthly_points),
        current_hizb = COALESCE($6, current_hizb),
        current_surah = COALESCE($7, current_surah),
        current_page = COALESCE($8, current_page),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [firstName || null, lastName || null, classId || null, totalPoints ?? null, monthlyPoints ?? null,
       currentHizb ?? null, currentSurah ?? null, currentPage ?? null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json({ id: result.rows[0].id });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Failed to update student' });
  }
});

// Delete student
router.delete('/students/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM students WHERE id = $1', [id]);
    res.json({ message: 'Student deleted' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Failed to delete student' });
  }
});

// ─── CLASSES CRUD ─────────────────────────────────────────────────────────────

// Update class
router.put('/classes/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, teacherName, classType } = req.body;
    const result = await query(
      `UPDATE classes SET
        name = COALESCE($1, name),
        teacher_name = COALESCE($2, teacher_name),
        class_type = COALESCE($3, class_type),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [name || null, teacherName || null, classType || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Class not found' });
    res.json({ id: result.rows[0].id });
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ message: 'Failed to update class' });
  }
});

// Delete class
router.delete('/classes/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    // Check if there are students in this class
    const students = await query('SELECT COUNT(*) as cnt FROM students WHERE class_id = $1', [id]);
    if (parseInt(students.rows[0].cnt) > 0) {
      return res.status(400).json({ message: 'لا يمكن حذف الحلقة وبها طلاب. انقل الطلاب أولاً' });
    }
    await query('DELETE FROM classes WHERE id = $1', [id]);
    res.json({ message: 'Class deleted' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ message: 'Failed to delete class' });
  }
});

// ─── RECOVERY REQUESTS ────────────────────────────────────────────────────────

// List all recovery requests
router.get('/recovery-requests', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT
        r.*,
        c.name as new_class_name,
        s.first_name as student_first_name, s.last_name as student_last_name
      FROM recovery_requests r
      LEFT JOIN classes c ON r.new_class_id = c.id
      LEFT JOIN students s ON r.existing_student_id = s.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows.map(r => ({
      id: r.id,
      requestType: r.request_type,
      requesterName: r.requester_name,
      currentPhone: r.current_phone,
      newPhone: r.new_phone,
      childNameForLookup: r.child_name_for_lookup,
      newChildFirstName: r.new_child_first_name,
      newChildLastName: r.new_child_last_name,
      newClassId: r.new_class_id,
      newClassName: r.new_class_name,
      existingStudentId: r.existing_student_id,
      existingStudentName: r.student_first_name ? `${r.student_first_name} ${r.student_last_name}` : null,
      status: r.status,
      adminNotes: r.admin_notes,
      createdAt: r.created_at,
    })));
  } catch (error) {
    console.error('Error fetching recovery requests:', error);
    res.status(500).json({ message: 'Failed to fetch recovery requests' });
  }
});

// Approve recovery request
router.post('/recovery-requests/:id/approve', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const reqResult = await query('SELECT * FROM recovery_requests WHERE id = $1', [id]);
    if (reqResult.rows.length === 0) return res.status(404).json({ message: 'Request not found' });

    const recReq = reqResult.rows[0];

    // Handle wrong_number: update the parent's phone
    if (recReq.request_type === 'wrong_number' && recReq.new_phone) {
      // Find the parent by old phone or by existing student
      let parentId: number | null = null;
      if (recReq.current_phone) {
        const parentRes = await query('SELECT id FROM users WHERE phone = $1', [recReq.current_phone]);
        if (parentRes.rows.length > 0) parentId = parentRes.rows[0].id;
      }
      if (!parentId && recReq.existing_student_id) {
        const studentRes = await query('SELECT parent_id FROM students WHERE id = $1', [recReq.existing_student_id]);
        if (studentRes.rows.length > 0) parentId = studentRes.rows[0].parent_id;
      }
      if (parentId) {
        await query('UPDATE users SET phone = $1, is_suspended = FALSE, suspension_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [recReq.new_phone, parentId]);
      }
    }

    // Handle add_child: create new registration request
    if (recReq.request_type === 'add_child' && recReq.new_child_first_name && recReq.new_class_id) {
      // Find parent
      let parentPhone = recReq.current_phone;
      if (recReq.existing_student_id) {
        const studentRes = await query('SELECT u.phone FROM students s JOIN users u ON s.parent_id = u.id WHERE s.id = $1', [recReq.existing_student_id]);
        if (studentRes.rows.length > 0) parentPhone = studentRes.rows[0].phone;
      }
      await query(
        `INSERT INTO registration_requests (parent_name, parent_phone, student_first_name, student_last_name, class_code, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [recReq.requester_name, parentPhone, recReq.new_child_first_name, recReq.new_child_last_name || '', String(recReq.new_class_id)]
      );
    }

    // Handle halaqah_change: update student's class
    if (recReq.request_type === 'halaqah_change' && recReq.new_class_id) {
      let studentId = recReq.existing_student_id;

      // Fallback: look up by parent phone + child first name if ID not stored
      if (!studentId && recReq.current_phone && recReq.child_name_for_lookup) {
        const lookup = await query(
          `SELECT s.id FROM students s
           JOIN users u ON s.parent_id = u.id
           WHERE u.phone = $1
             AND s.first_name ILIKE $2
           LIMIT 1`,
          [recReq.current_phone, `%${recReq.child_name_for_lookup.trim()}%`]
        );
        if (lookup.rows.length > 0) studentId = lookup.rows[0].id;
      }

      if (studentId) {
        await query(
          'UPDATE students SET class_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [recReq.new_class_id, studentId]
        );
      }
    }

    await query(
      `UPDATE recovery_requests SET status = 'approved', admin_notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [adminNotes || null, id]
    );
    res.json({ message: 'Recovery request approved' });
  } catch (error) {
    console.error('Error approving recovery request:', error);
    res.status(500).json({ message: 'Failed to approve recovery request' });
  }
});

// Suspend account via recovery (pending identity verification)
router.post('/recovery-requests/:id/suspend', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const reqResult = await query('SELECT * FROM recovery_requests WHERE id = $1', [id]);
    if (reqResult.rows.length === 0) return res.status(404).json({ message: 'Request not found' });
    const recReq = reqResult.rows[0];

    // Suspend the parent account for identity verification
    if (recReq.current_phone) {
      await query(
        `UPDATE users SET is_suspended = TRUE, suspension_reason = $1, updated_at = CURRENT_TIMESTAMP WHERE phone = $2`,
        ['في انتظار التحقق من الهوية', recReq.current_phone]
      );
    }

    await query(
      `UPDATE recovery_requests SET status = 'suspended', admin_notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [adminNotes || 'تعليق مؤقت – التحقق من الهوية', id]
    );
    res.json({ message: 'Account suspended for identity check' });
  } catch (error) {
    console.error('Error suspending via recovery:', error);
    res.status(500).json({ message: 'Failed to suspend account' });
  }
});

// Reject recovery request
router.post('/recovery-requests/:id/reject', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    await query(
      `UPDATE recovery_requests SET status = 'rejected', admin_notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [adminNotes || null, id]
    );
    res.json({ message: 'Recovery request rejected' });
  } catch (error) {
    console.error('Error rejecting recovery request:', error);
    res.status(500).json({ message: 'Failed to reject recovery request' });
  }
});

export default router;
