import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { authMiddleware, roleMiddleware } from '../middleware/auth';

const router = Router();

// Algerian phone validation: 10 digits starting with 05, 06, or 07
const validateAlgerianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\s/g, '');
  return /^0[567]\d{8}$/.test(cleaned);
};

// Arabic text validation: must contain Arabic characters
const validateArabicText = (text: string): boolean => {
  return /[\u0600-\u06FF]/.test(text);
};

// Helper function to transform snake_case to camelCase
const transformRegistration = (registration: any) => ({
  id: registration.id,
  parentName: registration.parent_name,
  parentPhone: registration.parent_phone,
  studentFirstName: registration.student_first_name,
  studentLastName: registration.student_last_name,
  classCode: registration.class_code,
  className: registration.class_name,
  status: registration.status,
  source: registration.source || null,
  existingStudentId: registration.existing_student_id || null,
  createdAt: registration.created_at,
  updatedAt: registration.updated_at
});

// Create registration request
router.post('/', async (req, res) => {
  try {
    const { parentName, parentPhone, childFirstName, childLastName, classId } = req.body;

    // Validate Algerian phone number
    const cleanedPhone = (parentPhone || '').replace(/\s/g, '');
    if (!validateAlgerianPhone(cleanedPhone)) {
      return res.status(400).json({
        message: 'رقم الهاتف غير صالح. يجب أن يكون رقماً جزائرياً مكوناً من 10 أرقام يبدأ بـ 05 أو 06 أو 07'
      });
    }

    // Validate Arabic names
    if (!validateArabicText(parentName)) {
      return res.status(400).json({ message: 'يجب كتابة اسم ولي الأمر بالحروف العربية' });
    }
    if (!validateArabicText(childFirstName)) {
      return res.status(400).json({ message: 'يجب كتابة اسم الطفل بالحروف العربية' });
    }
    if (!validateArabicText(childLastName)) {
      return res.status(400).json({ message: 'يجب كتابة لقب الطفل بالحروف العربية' });
    }

    // Verify class ID exists
    const classResult = await query('SELECT id, name FROM classes WHERE id = $1', [classId]);
    if (classResult.rows.length === 0) {
      return res.status(400).json({ message: 'الحلقة المختارة غير موجودة' });
    }

    // Check for duplicate student: same first name + same class + same parent name
    const duplicateCheck = await query(
      `SELECT s.id FROM students s
       JOIN users u ON s.parent_id = u.id
       WHERE LOWER(TRIM(s.first_name)) = LOWER(TRIM($1))
         AND s.class_id = $2
         AND LOWER(TRIM(u.name)) = LOWER(TRIM($3))`,
      [childFirstName, classId, parentName]
    );
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'هذا الطفل مسجل بالفعل في هذه الحلقة تحت نفس اسم الوالد'
      });
    }

    // Also check pending registrations for same duplicate
    const pendingDuplicateCheck = await query(
      `SELECT id FROM registration_requests
       WHERE LOWER(TRIM(student_first_name)) = LOWER(TRIM($1))
         AND class_code = $2
         AND LOWER(TRIM(parent_name)) = LOWER(TRIM($3))
         AND status = 'pending'`,
      [childFirstName, String(classId), parentName]
    );
    if (pendingDuplicateCheck.rows.length > 0) {
      return res.status(400).json({
        message: 'يوجد طلب تسجيل قيد المراجعة لهذا الطفل في نفس الحلقة'
      });
    }

    const result = await query(
      `INSERT INTO registration_requests 
       (parent_name, parent_phone, student_first_name, student_last_name, class_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [parentName || null, cleanedPhone, childFirstName, childLastName, String(classId)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating registration:', error);
    res.status(500).json({ message: 'فشل في إنشاء طلب التسجيل' });
  }
});

// Get all registration requests
router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT rr.*, c.name as class_name 
       FROM registration_requests rr
       LEFT JOIN classes c ON rr.class_code = CAST(c.id AS TEXT)
       ORDER BY rr.created_at DESC`
    );
    res.json(result.rows.map(transformRegistration));
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ message: 'Failed to fetch registrations' });
  }
});

// Get requests for the authenticated parent (for notification polling)
router.get('/my-requests', authMiddleware, async (req: any, res) => {
  try {
    const userResult = await query('SELECT phone FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const phone = userResult.rows[0].phone;

    const result = await query(
      `SELECT rr.*, c.name as class_name
       FROM registration_requests rr
       LEFT JOIN classes c ON rr.class_code = CAST(c.id AS TEXT)
       WHERE rr.parent_phone = $1
          OR rr.existing_student_id IN (
               SELECT s.id FROM students s WHERE s.parent_id = $2
             )
       ORDER BY rr.updated_at DESC
       LIMIT 50`,
      [phone, req.user.id]
    );
    res.json(result.rows.map(transformRegistration));
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// Approve registration
router.post('/:id/approve', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get registration request
    const regResult = await query('SELECT * FROM registration_requests WHERE id = $1', [id]);

    if (regResult.rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const registration = regResult.rows[0];

    // Handle halaqah change: update class, do NOT create new student
    if (registration.source === 'halaqah_change_authenticated') {
      if (registration.existing_student_id && registration.class_code) {
        // Look up student for fallback if needed
        let studentId = registration.existing_student_id;
        await query(
          'UPDATE students SET class_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [parseInt(registration.class_code), studentId]
        );
      }
      await query(
        'UPDATE registration_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['approved', id]
      );
      return res.json({ message: 'Class change approved successfully' });
    }

    // Get class ID
    const classResult = await query('SELECT id, name FROM classes WHERE id = $1', [parseInt(registration.class_code)]);
    const classId = classResult.rows[0].id;

    // Create or get parent user
    let parentResult = await query('SELECT id FROM users WHERE phone = $1', [registration.parent_phone]);
    let parentId: number;

    if (parentResult.rows.length === 0) {
      // Create parent user
      const parentName = registration.parent_name || `Parent de ${registration.student_first_name}`;
      const newParent = await query(
        `INSERT INTO users (role, name, phone) 
         VALUES ('parent', $1, $2)
         RETURNING id`,
        [parentName, registration.parent_phone]
      );
      parentId = newParent.rows[0].id;
    } else {
      parentId = parentResult.rows[0].id;
    }

    // Create student
    await query(
      `INSERT INTO students (first_name, last_name, parent_id, class_id)
       VALUES ($1, $2, $3, $4)`,
      [registration.student_first_name, registration.student_last_name, parentId, classId]
    );

    // Update registration status
    await query(
      'UPDATE registration_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['approved', id]
    );

    res.json({ message: 'Registration approved successfully' });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ message: 'Failed to approve registration' });
  }
});

// Reject registration
router.post('/:id/reject', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    await query(
      'UPDATE registration_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['rejected', id]
    );

    res.json({ message: 'Registration rejected' });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ message: 'Failed to reject registration' });
  }
});

// Halaqah change for authenticated parent → creates a registration_request in registration tab
router.post('/halaqah-change-authenticated', authMiddleware, async (req: any, res) => {
  try {
    const { newClassId, existingStudentId } = req.body;

    if (!newClassId || !existingStudentId) {
      return res.status(400).json({ message: 'الحلقة الجديدة ورقم الطالب مطلوبان' });
    }

    const userResult = await query('SELECT id, name, phone FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    const parentUser = userResult.rows[0];

    // Verify the student belongs to this parent
    const studentResult = await query(
      'SELECT id, first_name, last_name FROM students WHERE id = $1 AND parent_id = $2',
      [existingStudentId, req.user.id]
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ message: 'الطالب غير موجود أو لا ينتمي إلى هذا الحساب' });
    }
    const student = studentResult.rows[0];

    // Verify new class exists
    const classResult = await query('SELECT id FROM classes WHERE id = $1', [newClassId]);
    if (classResult.rows.length === 0) {
      return res.status(400).json({ message: 'الحلقة المختارة غير موجودة' });
    }

    // Prevent duplicate pending request
    const pendingCheck = await query(
      `SELECT id FROM registration_requests
       WHERE existing_student_id = $1 AND source = 'halaqah_change_authenticated' AND status = 'pending'`,
      [existingStudentId]
    );
    if (pendingCheck.rows.length > 0) {
      return res.status(400).json({ message: 'يوجد طلب تغيير حلقة قيد المراجعة لهذا الطالب' });
    }

    const result = await query(
      `INSERT INTO registration_requests
         (parent_name, parent_phone, student_first_name, student_last_name, class_code, source, existing_student_id)
       VALUES ($1, $2, $3, $4, $5, 'halaqah_change_authenticated', $6)
       RETURNING *`,
      [parentUser.name, parentUser.phone || null, student.first_name, student.last_name, String(newClassId), existingStudentId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating halaqah change request:', error);
    res.status(500).json({ message: 'فشل في إنشاء طلب تغيير الحلقة' });
  }
});

// Add a child for an already-authenticated parent → creates a registration_request directly
router.post('/add-child-authenticated', authMiddleware, async (req: any, res) => {
  try {
    const { childFirstName, classId } = req.body;

    if (!childFirstName || !classId) {
      return res.status(400).json({ message: 'اسم الطفل والحلقة مطلوبان' });
    }

    // Get the parent user from DB using the JWT user id
    const userResult = await query('SELECT id, name, phone FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }
    const parentUser = userResult.rows[0];

    // Derive family name from parent's full name (last word)
    const nameParts = (parentUser.name || '').trim().split(/\s+/);
    const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : parentUser.name;

    // Verify class exists
    const classResult = await query('SELECT id, name FROM classes WHERE id = $1', [classId]);
    if (classResult.rows.length === 0) {
      return res.status(400).json({ message: 'الحلقة المختارة غير موجودة' });
    }

    // Prevent duplicate pending request
    const pendingCheck = await query(
      `SELECT id FROM registration_requests
       WHERE LOWER(TRIM(student_first_name)) = LOWER(TRIM($1))
         AND class_code = $2
         AND parent_phone = $3
         AND status = 'pending'`,
      [childFirstName, String(classId), parentUser.phone]
    );
    if (pendingCheck.rows.length > 0) {
      return res.status(400).json({ message: 'يوجد طلب تسجيل قيد المراجعة لهذا الطفل في نفس الحلقة' });
    }

    const result = await query(
      `INSERT INTO registration_requests
         (parent_name, parent_phone, student_first_name, student_last_name, class_code, source)
       VALUES ($1, $2, $3, $4, $5, 'add_child_authenticated')
       RETURNING *`,
      [parentUser.name, parentUser.phone || null, childFirstName.trim(), familyName, String(classId)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating add-child registration:', error);
    res.status(500).json({ message: 'فشل في إنشاء طلب التسجيل' });
  }
});

// Submit a recovery request (wrong number / add child to existing account)
router.post('/recovery', async (req, res) => {
  try {
    const {
      requestType,        // 'wrong_number' | 'add_child' | 'halaqah_change'
      requesterName,
      currentPhone,
      newPhone,
      childNameForLookup, // name of existing registered child to identify the account
      newChildFirstName,
      newChildLastName,
      newClassId,
      existingStudentId,
    } = req.body;

    if (!requesterName || !childNameForLookup || !requestType) {
      return res.status(400).json({ message: 'بيانات الطلب غير مكتملة' });
    }

    if (!validateArabicText(requesterName)) {
      return res.status(400).json({ message: 'يجب كتابة الاسم بالحروف العربية' });
    }

    // Verify that the child/parent actually exists in our records (students or approved registrations)
    const childLookup = `%${childNameForLookup.trim()}%`;
    const parentLookup = `%${requesterName.trim()}%`;

    const existingRecord = await query(
      `SELECT s.id FROM students s
       INNER JOIN users u ON s.parent_id = u.id
       WHERE s.first_name ILIKE $1
         AND u.name ILIKE $2
       LIMIT 1`,
      [childLookup, parentLookup]
    );

    // Also check pending/approved registration_requests in case they haven't been processed yet
    const pendingRecord = existingRecord.rows.length === 0
      ? await query(
          `SELECT id FROM registration_requests
           WHERE student_first_name ILIKE $1
             AND parent_name ILIKE $2
             AND status IN ('pending', 'approved')
           LIMIT 1`,
          [childLookup, parentLookup]
        )
      : { rows: [{}] };

    if (existingRecord.rows.length === 0 && pendingRecord.rows.length === 0) {
      return res.status(404).json({
        notFound: true,
        message: 'لم يُعثر على أي سجل مرتبط بهذه المعلومات'
      });
    }

    // For wrong_number: validate new phone
    if (requestType === 'wrong_number' && newPhone) {
      const cleanedNew = newPhone.replace(/\s/g, '');
      if (!validateAlgerianPhone(cleanedNew)) {
        return res.status(400).json({
          message: 'رقم الهاتف الجديد غير صالح. يجب أن يكون رقماً جزائرياً من 10 أرقام يبدأ بـ 05 أو 06 أو 07'
        });
      }
    }

    const result = await query(
      `INSERT INTO recovery_requests
         (request_type, requester_name, current_phone, new_phone, child_name_for_lookup,
          new_child_first_name, new_child_last_name, new_class_id, existing_student_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        requestType,
        requesterName,
        currentPhone || null,
        newPhone ? newPhone.replace(/\s/g, '') : null,
        childNameForLookup,
        newChildFirstName || null,
        newChildLastName || null,
        newClassId || null,
        existingStudentId || null,
      ]
    );

    res.status(201).json({ message: 'تم إرسال طلب الاسترداد بنجاح', id: result.rows[0].id });
  } catch (error) {
    console.error('Error creating recovery request:', error);
    res.status(500).json({ message: 'فشل في إرسال طلب الاسترداد' });
  }
});

export default router;
