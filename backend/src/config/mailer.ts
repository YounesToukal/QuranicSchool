import nodemailer from 'nodemailer';

// Create transporter — reads from env vars at call time so .env is loaded first
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface NotifyAdminOptions {
  senderName: string;
  senderRole: string;
  subject: string;
  message: string;
  messageType?: string;
  replyEmail?: string;
}

const TYPE_LABELS: Record<string, string> = {
  inquiry: 'استفسار',
  suggestion: 'اقتراح',
  complaint: 'شكوى',
  tech: 'دعم تقني',
};

export async function notifyAdmin(opts: NotifyAdminOptions): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const smtpUser = process.env.SMTP_USER;

  if (!adminEmail || !smtpUser || !process.env.SMTP_PASS) {
    // Email not configured — skip silently (don't break the request)
    return;
  }

  const typeLabel = opts.messageType ? (TYPE_LABELS[opts.messageType] || opts.messageType) : '';
  const roleLabel = opts.senderRole === 'visitor' ? 'زائر' : opts.senderRole === 'teacher' ? 'معلم' : 'ولي أمر';

  const replyToHeader = opts.replyEmail || smtpUser;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#1e4a4c;padding:24px 32px;text-align:center;">
            <p style="margin:0 0 4px;color:#D4AF37;font-size:11px;letter-spacing:3px;text-transform:uppercase;">مسجد مالك بن نبي حي مالكي بن عكنون</p>
            <p style="margin:0;color:#f0e6c8;font-size:18px;font-weight:bold;">رسالة جديدة وردت على المنصة</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #f0ebe0;">
                  <span style="color:#888;font-size:12px;">المُرسِل</span><br/>
                  <strong style="color:#1e4a4c;">${opts.senderName}</strong>
                  <span style="margin-right:8px;padding:2px 8px;background:#e8f4f5;color:#1e4a4c;border-radius:20px;font-size:11px;">${roleLabel}</span>
                </td>
              </tr>
              ${typeLabel ? `
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #f0ebe0;">
                  <span style="color:#888;font-size:12px;">نوع الرسالة</span><br/>
                  <strong style="color:#D4AF37;">${typeLabel}</strong>
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #f0ebe0;">
                  <span style="color:#888;font-size:12px;">الموضوع</span><br/>
                  <strong style="color:#1e4a4c;">${opts.subject}</strong>
                </td>
              </tr>
              ${opts.replyEmail ? `
              <tr>
                <td style="padding:6px 0;border-bottom:1px solid #f0ebe0;">
                  <span style="color:#888;font-size:12px;">بريد الرد</span><br/>
                  <a href="mailto:${opts.replyEmail}" style="color:#1e4a4c;">${opts.replyEmail}</a>
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding:16px 0 0;">
                  <span style="color:#888;font-size:12px;">نص الرسالة</span>
                  <div style="margin-top:8px;padding:16px;background:#f9f6f0;border-right:3px solid #D4AF37;border-radius:6px;color:#333;line-height:1.8;font-size:14px;">
                    ${opts.message.replace(/\n/g, '<br/>')}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f6f0;padding:14px 32px;text-align:center;border-top:1px solid #e8e0d0;">
            <p style="margin:0;color:#aaa;font-size:11px;">المنصة القرآنية الرقمية · مسجد مالك بن نبي حي مالكي بن عكنون</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"المنصة القرآنية" <${smtpUser}>`,
      to: adminEmail,
      replyTo: replyToHeader,
      subject: `[رسالة جديدة] ${opts.subject}`,
      html,
    });
  } catch (err) {
    // Log but never throw — email failure must not break the API response
    console.error('⚠️  Email notification failed:', err);
  }
}

interface NotifyTeacherOptions {
  teacherEmail: string;
  teacherName: string;
  senderName: string;
  subject: string;
  message: string;
  replyEmail?: string;
  studentName?: string;
}

export async function notifyTeacher(opts: NotifyTeacherOptions): Promise<void> {
  const smtpUser = process.env.SMTP_USER;
  if (!smtpUser || !process.env.SMTP_PASS) return;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#1e4a4c;padding:24px 32px;text-align:center;">
          <p style="margin:0;color:#f0e6c8;font-size:18px;font-weight:bold;">رسالة جديدة من ولي أمر</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p>السلام عليكم ${opts.teacherName}،</p>
          <p>تلقّيت رسالة جديدة من <strong>${opts.senderName}</strong>${opts.studentName ? ` (وليّ ${opts.studentName})` : ''}:</p>
          <p style="font-weight:bold;">${opts.subject}</p>
          <div style="padding:16px;background:#f9f6f0;border-right:3px solid #D4AF37;border-radius:6px;line-height:1.8;">
            ${opts.message.replace(/\n/g, '<br/>')}
          </div>
          ${opts.replyEmail ? `<p style="margin-top:16px;">للرد: <a href="mailto:${opts.replyEmail}">${opts.replyEmail}</a></p>` : ''}
        </td></tr>
        <tr><td style="background:#f9f6f0;padding:14px 32px;text-align:center;border-top:1px solid #e8e0d0;">
          <p style="margin:0;color:#aaa;font-size:11px;">المنصة القرآنية الرقمية · مسجد مالك بن نبي حي مالكي بن عكنون</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"المنصة القرآنية" <${smtpUser}>`,
      to: opts.teacherEmail,
      replyTo: opts.replyEmail || smtpUser,
      subject: `[رسالة من ولي أمر] ${opts.subject}`,
      html,
    });
  } catch (err) {
    console.error('⚠️  notifyTeacher email failed:', err);
  }
}

interface NotifyParentReplyOptions {
  parentEmail: string;
  teacherName: string;
  originalSubject: string;
  replyText: string;
}

export async function notifyParentReply(opts: NotifyParentReplyOptions): Promise<void> {
  const smtpUser = process.env.SMTP_USER;
  if (!smtpUser || !process.env.SMTP_PASS) return;

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#1e4a4c;padding:24px 32px;text-align:center;">
          <p style="margin:0;color:#f0e6c8;font-size:18px;font-weight:bold;">رد المعلم على رسالتك</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p>السلام عليكم،</p>
          <p>أجاب المعلم <strong>${opts.teacherName}</strong> على رسالتك بخصوص: <strong>${opts.originalSubject}</strong></p>
          <div style="padding:16px;background:#f9f6f0;border-right:3px solid #D4AF37;border-radius:6px;line-height:1.8;">
            ${opts.replyText.replace(/\n/g, '<br/>')}
          </div>
        </td></tr>
        <tr><td style="background:#f9f6f0;padding:14px 32px;text-align:center;border-top:1px solid #e8e0d0;">
          <p style="margin:0;color:#aaa;font-size:11px;">المنصة القرآنية الرقمية · مسجد مالك بن نبي حي مالكي بن عكنون</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"المنصة القرآنية" <${smtpUser}>`,
      to: opts.parentEmail,
      subject: `[رد على رسالتك] ${opts.originalSubject}`,
      html,
    });
  } catch (err) {
    console.error('⚠️  notifyParentReply email failed:', err);
  }
}
