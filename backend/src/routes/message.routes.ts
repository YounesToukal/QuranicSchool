import { Router } from 'express';
import { query } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { notifyAdmin, notifyTeacher, notifyParentReply } from '../config/mailer';
import { publicMessageLimiter } from '../middleware/security';

const router = Router();

// Send message (to admin or teacher)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { subject, message, replyEmail, messageType, targetTeacherId, studentName } = req.body;
    const senderId = req.user.id;
    const senderName = req.user.name;
    const senderRole = req.user.role;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Sujet et message requis' });
    }
    if (senderRole === 'admin') {
      return res.status(403).json({ message: 'Les admins ne peuvent pas envoyer de messages' });
    }

    const result = await query(
      `INSERT INTO messages (sender_id, sender_name, sender_role, subject, message, reply_email, message_type, target_teacher_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [senderId, senderName, senderRole, subject, message, replyEmail || null, messageType || 'inquiry', targetTeacherId || null]
    );

    if (targetTeacherId) {
      // Notify teacher (+ CC admin)
      const teacherRow = await query(`SELECT name, email FROM users WHERE id = $1`, [targetTeacherId]);
      if (teacherRow.rows.length > 0) {
        const teacher = teacherRow.rows[0];
        if (teacher.email) {
          notifyTeacher({
            teacherEmail: teacher.email,
            teacherName: teacher.name,
            senderName,
            subject,
            message,
            replyEmail: replyEmail || undefined,
            studentName: studentName || undefined,
          });
        }
      }
    } else {
      // Notify admin
      notifyAdmin({
        senderName,
        senderRole,
        subject,
        message,
        messageType: messageType || 'inquiry',
        replyEmail: replyEmail || undefined,
      });
    }

    res.status(201).json({ message: 'Message envoyÃ© avec succÃ¨s', data: result.rows[0] });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
});

// Public contact (unauthenticated visitors)
router.post('/public', async (req, res) => {
  try {
    const { senderName, subject, message, replyEmail, messageType } = req.body;
    if (!senderName || !message) {
      return res.status(400).json({ message: 'Ø§Ù„Ø§Ø³Ù… ÙˆØ§Ù„Ø±Ø³Ø§Ù„Ø© Ù…Ø·Ù„ÙˆØ¨Ø§Ù†' });
    }
    const finalSubject = subject?.trim() || 'Ø±Ø³Ø§Ù„Ø© Ù…Ù† Ø²Ø§Ø¦Ø±';
    await query(
      `INSERT INTO messages (sender_id, sender_name, sender_role, subject, message, reply_email, message_type)
       VALUES (NULL, $1, 'visitor', $2, $3, $4, $5)`,
      [senderName.trim(), finalSubject, message.trim(), replyEmail?.trim() || null, messageType || 'inquiry']
    );
    notifyAdmin({
      senderName: senderName.trim(),
      senderRole: 'visitor',
      subject: finalSubject,
      message: message.trim(),
      messageType: messageType || 'inquiry',
      replyEmail: replyEmail?.trim() || undefined,
    });
    res.status(201).json({ message: 'ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø±Ø³Ø§Ù„ØªÙƒ Ø¨Ù†Ø¬Ø§Ø­' });
  } catch (error) {
    console.error('Error sending public message:', error);
    res.status(500).json({ message: 'ÙØ´Ù„ ÙÙŠ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ø³Ø§Ù„Ø©' });
  }
});

// Parent: get their teachers (one entry per child with a teacher)
router.get('/parent-teachers', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Parents uniquement' });
    }
    const result = await query(
      `SELECT s.id AS student_id,
              s.first_name || ' ' || s.last_name AS student_name,
              u.id AS teacher_id,
              u.name AS teacher_name
       FROM students s
       JOIN classes c ON s.class_id = c.id
       JOIN users u ON c.teacher_id = u.id
       WHERE s.parent_id = $1
       ORDER BY s.first_name`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching parent teachers:', error);
    res.status(500).json({ message: 'Erreur' });
  }
});

// Teacher: get inbox (messages directed to them)
router.get('/my-inbox', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Enseignants uniquement' });
    }
    const result = await query(
      `SELECT * FROM messages
       WHERE target_teacher_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching teacher inbox:', error);
    res.status(500).json({ message: 'Erreur' });
  }
});

// Teacher: inbox unread count
router.get('/my-inbox/unread-count', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Enseignants uniquement' });
    }
    const result = await query(
      `SELECT COUNT(*) AS count FROM messages WHERE target_teacher_id = $1 AND is_read = FALSE`,
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
});

// Teacher: reply to a message
router.patch('/:id/reply', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Enseignants uniquement' });
    }
    const { id } = req.params;
    const { replyText } = req.body;
    if (!replyText?.trim()) {
      return res.status(400).json({ message: 'Texte de rÃ©ponse requis' });
    }
    // Verify this message belongs to this teacher
    const check = await query(
      `SELECT * FROM messages WHERE id = $1 AND target_teacher_id = $2`,
      [id, req.user.id]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: 'Message introuvable' });
    }
    const msg = check.rows[0];
    const result = await query(
      `UPDATE messages
       SET teacher_reply = $1, teacher_replied_at = NOW(), is_read = TRUE
       WHERE id = $2
       RETURNING *`,
      [replyText.trim(), id]
    );
    // Send reply email to parent if they left a reply_email
    if (msg.reply_email) {
      notifyParentReply({
        parentEmail: msg.reply_email,
        teacherName: req.user.name,
        originalSubject: msg.subject,
        replyText: replyText.trim(),
      });
    }
    res.json({ message: 'RÃ©ponse enregistrÃ©e', data: result.rows[0] });
  } catch (error) {
    console.error('Error replying to message:', error);
    res.status(500).json({ message: 'Erreur' });
  }
});

// Parent: get their sent messages (so they can see teacher replies)
router.get('/my-sent', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Parents uniquement' });
    }
    const result = await query(
      `SELECT m.*, u.name AS teacher_name
       FROM messages m
       LEFT JOIN users u ON m.target_teacher_id = u.id
       WHERE m.sender_id = $1
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur' });
  }
});

// Get all messages (admin only)
router.get('/all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'AccÃ¨s non autorisÃ©' });
    }
    const result = await query(`SELECT * FROM messages ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration des messages' });
  }
});

// Mark message as read (admin or owning teacher)
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    let result;
    if (req.user.role === 'admin') {
      result = await query(`UPDATE messages SET is_read = TRUE WHERE id = $1 RETURNING *`, [id]);
    } else if (req.user.role === 'teacher') {
      result = await query(
        `UPDATE messages SET is_read = TRUE WHERE id = $1 AND target_teacher_id = $2 RETURNING *`,
        [id, req.user.id]
      );
    } else {
      return res.status(403).json({ message: 'AccÃ¨s non autorisÃ©' });
    }
    if (!result || result.rows.length === 0) {
      return res.status(404).json({ message: 'Message non trouvÃ©' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Erreur lors de la mise Ã  jour du message' });
  }
});

// Delete message (admin only)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'AccÃ¨s non autorisÃ©' });
    }
    const { id } = req.params;
    const result = await query(`DELETE FROM messages WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Message non trouvÃ©' });
    }
    res.json({ message: 'Message supprimÃ© avec succÃ¨s' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du message' });
  }
});

// Get unread count (admin only)
router.get('/unread-count', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'AccÃ¨s non autorisÃ©' });
    }
    const result = await query(`SELECT COUNT(*) as count FROM messages WHERE is_read = FALSE AND target_teacher_id IS NULL`);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Erreur lors de la rÃ©cupÃ©ration du compteur' });
  }
});

export default router;



