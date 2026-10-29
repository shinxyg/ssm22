import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool, initDB } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup Nodemailer Transporter using Gmail App Password (Fallback for localhost)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } catch (tErr) {
    console.warn('Nodemailer initialization warning:', tErr.message);
  }
}

// Universal Email Sender: EmailJS REST API over HTTPS (Port 443) with Resend & Nodemailer fallbacks
const sendEmail = async ({ to, subject, text, html }) => {
  const recipients = Array.isArray(to) ? to : [to];
  const recipient = recipients[0];

  // 1. Primary: EmailJS REST API (Port 443 - Can send to ANY recipient via connected Gmail)
  const emailJsServiceId = process.env.EMAILJS_SERVICE_ID ? process.env.EMAILJS_SERVICE_ID.trim() : null;
  const emailJsTemplateId = process.env.EMAILJS_TEMPLATE_ID ? process.env.EMAILJS_TEMPLATE_ID.trim() : null;
  const emailJsPublicKey = process.env.EMAILJS_PUBLIC_KEY ? process.env.EMAILJS_PUBLIC_KEY.trim() : null;
  const emailJsPrivateKey = process.env.EMAILJS_PRIVATE_KEY ? process.env.EMAILJS_PRIVATE_KEY.trim() : null;

  if (emailJsServiceId && emailJsTemplateId && emailJsPublicKey) {
    try {
      const emailJsPayload = {
        service_id: emailJsServiceId,
        template_id: emailJsTemplateId,
        user_id: emailJsPublicKey,
        ...(emailJsPrivateKey ? { accessToken: emailJsPrivateKey } : {}),
        template_params: {
          to_email: recipient,
          subject: subject,
          html_content: html || text || '',
          message: text || '',
        },
      };

      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailJsPayload),
      });

      const responseText = await res.text();
      if (res.ok) {
        console.log('✅ [EmailJS HTTPS] Email sent successfully to ' + recipient + ' (Response: ' + responseText + ')');
        return { success: true, provider: 'emailjs', response: responseText };
      } else {
        console.warn('⚠️ [EmailJS HTTPS] API responded with error (' + res.status + '): ' + responseText);
      }
    } catch (ejsErr) {
      console.warn('⚠️ [EmailJS HTTPS] Attempt failed: ' + ejsErr.message);
    }
  }

  // 2. Secondary: Resend HTTPS API (Port 443)
  const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;
  if (resendApiKey) {
    try {
      const fromAddress = process.env.RESEND_FROM || 'QC GovServe <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + resendApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: recipients,
          subject: subject,
          html: html || text || '',
          text: text || '',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        console.log('✅ [Resend HTTPS] Email sent successfully to ' + recipient + ' (Message ID: ' + data.id + ')');
        return { success: true, messageId: data.id, provider: 'resend' };
      } else {
        console.warn('⚠️ [Resend HTTPS] API responded with error (' + res.status + '):', data);
      }
    } catch (resendErr) {
      console.warn('⚠️ [Resend HTTPS] Attempt failed: ' + resendErr.message);
    }
  }

  // 3. Fallback: Nodemailer SMTP (Localhost / open SMTP environments)
  if (transporter) {
    const senderEmail = process.env.EMAIL_USER || 'clarencemillares15@gmail.com';
    const info = await transporter.sendMail({
      from: '"QC GovServe Social Services" <' + senderEmail + '>',
      to: recipient,
      subject: subject,
      text: text || '',
      html: html || text || '',
    });
    console.log('📧 [Nodemailer SMTP] Email sent to ' + recipient + ' (Message ID: ' + info.messageId + ')');
    return { success: true, messageId: info.messageId, provider: 'nodemailer' };
  }

  throw new Error('No email transport configured or all services failed. Please check EmailJS variables.');
};

// Endpoint to reset and clear all data from applications, appointments, logs, etc.
const handleResetAllData = async (req, res) => {
  try {
    const client = await pool.connect();
    const tables = [
      'aics_applications',
      'pwd_applications',
      'senior_applications',
      'solo_parent_applications',
      'educational_applications',
      'child_welfare_applications',
      'livelihood_applications',
      'training_applications',
      'appointments',
      'financial_disbursements',
      'activity_logs',
      'beneficiary_verifications'
    ];

    const deletedCounts = {};
    for (const tbl of tables) {
      try {
        const delRes = await client.query(`DELETE FROM ${tbl};`);
        deletedCounts[tbl] = delRes.rowCount;
      } catch (e) {
        console.warn(`Could not clear ${tbl}:`, e.message);
      }
    }

    try {
      await client.query(`
        UPDATE users 
        SET failed_login_attempts = 0, 
            lockout_stage = 0, 
            lockout_until = NULL, 
            unlock_otp = NULL, 
            unlock_otp_expires = NULL, 
            last_failed_attempt = NULL;
      `);
    } catch (e) {}

    client.release();
    res.json({
      success: true,
      message: 'All application records and activity logs cleared from database.',
      deletedCounts
    });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ error: 'Failed to reset database', details: err.message });
  }
};

app.post('/api/admin/reset-all-data', handleResetAllData);
app.get('/api/admin/reset-all-data', handleResetAllData);

// Endpoint to clear only Child Welfare records
const handleClearChildWelfare = async (req, res) => {
  try {
    const delRes = await pool.query('DELETE FROM child_welfare_applications;');
    res.json({ success: true, message: `Successfully cleared ${delRes.rowCount} child welfare records.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
app.post('/api/admin/clear-child-welfare', handleClearChildWelfare);
app.get('/api/admin/clear-child-welfare', handleClearChildWelfare);

// Endpoint to clear Educational Assistance records
const handleClearEducational = async (req, res) => {
  try {
    const delRes = await pool.query('DELETE FROM educational_applications;');
    const cwDel = await pool.query("DELETE FROM child_welfare_applications WHERE reference_no LIKE 'QC-EDU-%' OR service_name ILIKE '%Educational Assistance for Indigent Children%';").catch(() => ({ rowCount: 0 }));
    const spDel = await pool.query("DELETE FROM solo_parent_applications WHERE reference_no LIKE 'QC-EDU-%';").catch(() => ({ rowCount: 0 }));
    const apptDel = await pool.query("DELETE FROM appointments WHERE reference_no LIKE 'QC-EDU-%';").catch(() => ({ rowCount: 0 }));
    const disbDel = await pool.query("DELETE FROM financial_disbursements WHERE reference_no LIKE 'QC-EDU-%';").catch(() => ({ rowCount: 0 }));
    res.json({ 
      success: true, 
      message: `Successfully cleared ${delRes.rowCount} educational records, ${cwDel.rowCount} child welfare edu records, ${spDel.rowCount} solo parent edu records, ${apptDel.rowCount} appointments, and ${disbDel.rowCount} disbursements.`,
      deleted: (delRes.rowCount || 0) + (cwDel.rowCount || 0) + (spDel.rowCount || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
app.post('/api/admin/clear-educational', handleClearEducational);
app.get('/api/admin/clear-educational', handleClearEducational);
app.delete('/api/educational/applications', handleClearEducational);
app.delete('/api/educational/applications/:refNo', async (req, res) => {
  try {
    const { refNo } = req.params;
    const delRes = await pool.query('DELETE FROM educational_applications WHERE reference_no = $1;', [refNo]);
    await pool.query('DELETE FROM child_welfare_applications WHERE reference_no = $1;', [refNo]).catch(() => null);
    await pool.query('DELETE FROM solo_parent_applications WHERE reference_no = $1;', [refNo]).catch(() => null);
    await pool.query('DELETE FROM appointments WHERE reference_no = $1;', [refNo]).catch(() => null);
    await pool.query('DELETE FROM financial_disbursements WHERE reference_no = $1;', [refNo]).catch(() => null);
    res.json({ success: true, deleted: delRes.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete('/api/child-welfare/applications/:refNo', async (req, res) => {
  try {
    const { refNo } = req.params;
    const delRes = await pool.query('DELETE FROM child_welfare_applications WHERE reference_no = $1 OR id::text = $1;', [refNo]);
    await pool.query('DELETE FROM appointments WHERE reference_no = $1;', [refNo]).catch(() => null);
    await pool.query('DELETE FROM financial_disbursements WHERE reference_no = $1;', [refNo]).catch(() => null);
    res.json({ success: true, deleted: delRes.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CLEAR SENIOR CITIZEN APPLICATIONS
const handleClearSenior = async (req, res) => {
  try {
    const delRes = await pool.query('DELETE FROM senior_applications;');
    res.json({ success: true, message: 'All senior applications cleared', deleted: delRes.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
app.post('/api/admin/clear-senior', handleClearSenior);
app.get('/api/admin/clear-senior', handleClearSenior);
app.delete('/api/senior/applications', handleClearSenior);
app.delete('/api/senior/applications/:refNo', async (req, res) => {
  try {
    const { refNo } = req.params;
    const delRes = await pool.query('DELETE FROM senior_applications WHERE reference_no = $1;', [refNo]);
    res.json({ success: true, deleted: delRes.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST endpoint to send emails (Uses Resend HTTPS API / SMTP fallback)
app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;
  if (!to || !subject) {
    return res.status(400).json({ error: 'Recipient "to" and "subject" are required.' });
  }

  try {
    const result = await sendEmail({ to, subject, text, html });
    res.json({ success: true, messageId: result.messageId, provider: result.provider });
  } catch (err) {
    console.error('Email sending error:', err);
    res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
});

// Helper to send formatted Gmail Notification Emails
const sendNotificationEmail = async ({ to, subject, title, applicantName, refNo, status, detailsMessage, appointmentInfo }) => {
  const recipient = to || 'clarencemillares15@gmail.com';
  const senderEmail = process.env.EMAIL_USER || 'clarencemillares15@gmail.com';
  
  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; padding: 24px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">QC GovServe</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">Quezon City Social Services & Development Department</p>
        </div>
        <div style="padding: 28px;">
          <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">${title || 'Application Status Update'}</h2>
          <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">Dear <strong>${applicantName || 'Valued Applicant'}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
            ${detailsMessage || 'Here is an important notification regarding your social service application in Quezon City.'}
          </p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
            ${refNo ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Reference No:</strong> <span style="color: #2563eb; font-family: monospace; font-size: 15px; font-weight: 700;">${refNo}</span></p>` : ''}
            ${status ? `<p style="margin: 6px 0; font-size: 14px;"><strong>Current Status:</strong> <span style="background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 12px; font-size: 13px; font-weight: 700;">${status}</span></p>` : ''}
            ${appointmentInfo ? `<p style="margin: 6px 0; font-size: 14px;"><strong>Schedule / Details:</strong> <span style="color: #0f172a;">${appointmentInfo}</span></p>` : ''}
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            You can log in to your <strong>GovServe Portal account</strong> anytime to track application progress, download your Guarantee Letter (GL), or check appointment status.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
          This is an automated notification from QC GovServe Social Services System.
        </div>
      </div>
    </div>
  `;

  try {
    const info = await sendEmail({
      to: recipient,
      subject: subject || `QC GovServe Notice: ${refNo || 'Application Update'}`,
      text: `${title}\nReference No: ${refNo || 'N/A'}\nStatus: ${status || 'N/A'}\n${detailsMessage || ''}`,
      html: htmlContent
    });
    console.log(`📧 Notification email sent to ${recipient}`);
    return info;
  } catch (err) {
    console.error(`❌ Notification sending error for ${recipient}:`, err.message);
  }
};

// Helper to check if current real-time clock >= scheduled date & time
const isScheduledTimeReached = (dStr, tStr) => {
  if (!dStr || !tStr) return false;
  try {
    let year, month, day;
    if (typeof dStr === 'string' && dStr.includes('-')) {
      const parts = dStr.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      const dt = new Date(dStr);
      if (isNaN(dt.getTime())) return false;
      year = dt.getFullYear();
      month = dt.getMonth();
      day = dt.getDate();
    }

    let hours = 0, minutes = 0;
    if (typeof tStr === 'string' && tStr.includes(':')) {
      const isPM = tStr.toUpperCase().includes('PM');
      const isAM = tStr.toUpperCase().includes('AM');
      const cleanTime = tStr.replace(/(AM|PM|\s)/gi, '');
      const tParts = cleanTime.split(':');
      hours = parseInt(tParts[0], 10);
      minutes = parseInt(tParts[1], 10);
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }

    const schedDate = new Date(year, month, day, hours, minutes, 0, 0);
    const now = new Date();
    return now.getTime() >= schedDate.getTime();
  } catch (e) {
    return false;
  }
};

// Automatic 1-second interval to auto-release payouts when exact scheduled date & time is reached
setInterval(async () => {
  try {
    const result = await pool.query(`
      SELECT reference_no, scheduled_payout_date, scheduled_payout_time, status 
      FROM aics_applications 
      WHERE (status = 'Payout Scheduled' OR status = 'Ready for Payout' OR status = 'Approved') 
        AND scheduled_payout_date IS NOT NULL 
        AND scheduled_payout_time IS NOT NULL
    `);
    for (const row of result.rows) {
      if (isScheduledTimeReached(row.scheduled_payout_date, row.scheduled_payout_time)) {
        console.log(`⏰ [AUTO-TRIGGER] Scheduled payout time reached for AICS ${row.reference_no}! Auto-updating status to RELEASED / COMPLETED`);
        await pool.query(`UPDATE aics_applications SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
      }
    }

    const resultSolo = await pool.query(`
      SELECT reference_no, payout_date, payout_time, status 
      FROM solo_parent_applications 
      WHERE (status = 'PAYOUT SCHEDULED' OR status = 'Payout Scheduled' OR status = 'APPROVED') 
        AND payout_date IS NOT NULL 
        AND payout_time IS NOT NULL
    `);
    for (const row of resultSolo.rows) {
      if (isScheduledTimeReached(row.payout_date, row.payout_time)) {
        console.log(`⏰ [AUTO-TRIGGER] Scheduled payout time reached for Solo Parent ${row.reference_no}! Auto-updating status to RELEASED / COMPLETED`);
        await pool.query(`UPDATE solo_parent_applications SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
        await pool.query(`UPDATE financial_disbursements SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
      }
    }

    const resultEdu = await pool.query(`
      SELECT reference_no, payout_date, payout_time, status 
      FROM educational_applications 
      WHERE (status = 'PAYOUT SCHEDULED' OR status = 'Payout Scheduled' OR status = 'APPROVED') 
        AND payout_date IS NOT NULL 
        AND payout_time IS NOT NULL
    `);
    for (const row of resultEdu.rows) {
      if (isScheduledTimeReached(row.payout_date, row.payout_time)) {
        console.log(`⏰ [AUTO-TRIGGER] Scheduled payout time reached for Educational ${row.reference_no}! Auto-updating status to RELEASED / COMPLETED`);
        await pool.query(`UPDATE educational_applications SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
        await pool.query(`UPDATE financial_disbursements SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
      }
    }

    const resultSenior = await pool.query(`
      SELECT reference_no, payout_date, payout_time, status 
      FROM senior_applications 
      WHERE (status = 'PAYOUT SCHEDULED' OR status = 'Payout Scheduled' OR status = 'APPROVED') 
        AND payout_date IS NOT NULL 
        AND payout_time IS NOT NULL
    `);
    for (const row of resultSenior.rows) {
      if (isScheduledTimeReached(row.payout_date, row.payout_time)) {
        console.log(`⏰ [AUTO-TRIGGER] Scheduled payout time reached for Senior ${row.reference_no}! Auto-updating status to RELEASED / COMPLETED`);
        await pool.query(`UPDATE senior_applications SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
        await pool.query(`UPDATE financial_disbursements SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
      }
    }

    const resultFin = await pool.query(`
      SELECT reference_no, payout_date, payout_start_time, status 
      FROM financial_disbursements 
      WHERE (status = 'PAYOUT SCHEDULED' OR status = 'Payout Scheduled') 
        AND payout_date IS NOT NULL 
        AND payout_start_time IS NOT NULL
    `);
    for (const row of resultFin.rows) {
      if (isScheduledTimeReached(row.payout_date, row.payout_start_time)) {
        console.log(`⏰ [AUTO-TRIGGER] Scheduled payout time reached for Disbursement ${row.reference_no}! Auto-updating status to RELEASED / COMPLETED`);
        await pool.query(`UPDATE financial_disbursements SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
        await pool.query(`UPDATE solo_parent_applications SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
        await pool.query(`UPDATE educational_applications SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
        await pool.query(`UPDATE senior_applications SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
        await pool.query(`UPDATE pwd_applications SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
        await pool.query(`UPDATE livelihood_applications SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
        await pool.query(`UPDATE aics_applications SET status = 'RELEASED / COMPLETED', updated_at = NOW() WHERE reference_no = $1`, [row.reference_no]);
      }
    }
  } catch (err) {
    // ignore
  }
}, 1000);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.json({
      status: 'online',
      system: 'GovServe Social Services API Server',
      database: 'connected',
      dbTime: dbRes.rows[0].now,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.json({
      status: 'online',
      system: 'GovServe Social Services API Server',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET all AICS applications from PostgreSQL DB
app.get('/api/aics/applications', async (req, res) => {
  try {
    // Clean up any misplaced non-AICS rows asynchronously
    pool.query(`
      DELETE FROM aics_applications 
      WHERE reference_no LIKE 'QC-EDU-%' 
         OR reference_no LIKE 'QC-SP-EDU-%' 
         OR reference_no LIKE 'CW-%' 
         OR reference_no LIKE 'SP-%' 
         OR reference_no LIKE 'LVH-%' 
         OR reference_no LIKE 'TRN-%' 
         OR reference_no LIKE 'QC-PWD-%' 
         OR reference_no LIKE 'SENIOR-%';
    `).catch(() => null);

    const result = await pool.query(`
      SELECT * FROM aics_applications 
      WHERE reference_no NOT LIKE 'QC-EDU-%' 
        AND reference_no NOT LIKE 'QC-SP-EDU-%' 
        AND reference_no NOT LIKE 'CW-%' 
        AND reference_no NOT LIKE 'SP-%' 
        AND reference_no NOT LIKE 'LVH-%' 
        AND reference_no NOT LIKE 'TRN-%' 
        AND reference_no NOT LIKE 'QC-PWD-%' 
        AND reference_no NOT LIKE 'SENIOR-%'
      ORDER BY date_submitted DESC;
    `);
    const formatted = result.rows.map(row => ({
      id: row.id,
      reference_no: row.reference_no,
      referenceNo: row.reference_no,
      created_at: row.created_at,
      date_submitted: row.date_submitted,
      applicantName: row.applicant_name,
      serviceName: row.service_name,
      category: row.category,
      assistanceType: row.assistance_type,
      hospitalFacility: row.hospital_facility,
      medicalCondition: row.medical_condition,
      status: row.status,
      scheduledPayoutDate: row.scheduled_payout_date,
      scheduledPayoutTime: row.scheduled_payout_time,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      appointmentDetails: {
        appointmentDate: row.appointment_date || row.scheduled_payout_date,
        appointmentTime: row.appointment_time || row.scheduled_payout_time,
        venue: 'QC Hall SSDD Desk 3, Ground Flr High-Rise Bldg',
        assignedWorker: row.assigned_social_worker || 'Maria Santos, RSW'
      },
      amountOrType: row.assistance_type || 'Guarantee Letter / Financial Subsidy',
      assignedSocialWorker: row.assigned_social_worker,
      benefitDocumentType: row.benefit_document_type,
      dateSubmitted: row.date_submitted ? `${new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${new Date(row.date_submitted).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}` : 'Today',
      details: row.details || {
        applicantName: row.applicant_name,
        firstName: row.first_name || '',
        middleName: row.middle_name || '',
        lastName: row.last_name || '',
        suffix: row.suffix || '',
        dob: row.dob || '',
        age: row.age || '',
        gender: row.gender || '',
        civilStatus: row.civil_status || '',
        houseNo: row.house_no || '',
        street: row.street_name || '',
        barangay: row.barangay || '',
        fullAddress: [row.house_no, row.street_name, row.barangay ? `Brgy. ${row.barangay}` : '', 'Quezon City'].filter(Boolean).join(', '),
        phone: row.phone_number || '',
        isApplicantPatient: row.is_patient_self !== undefined ? row.is_patient_self : true,
        patientRelation: row.patient_relationship || 'Self',
        patientName: [row.patient_first_name, row.patient_middle_name, row.patient_last_name, row.patient_suffix].filter(Boolean).join(' ') || row.applicant_name,
        patientGender: row.patient_gender || row.gender || '',
        patientDob: row.patient_dob || row.dob || '',
        patientAge: row.patient_age || row.age || '',
        patientAddress: [row.patient_house_no, row.patient_street_name, row.patient_barangay ? `Brgy. ${row.patient_barangay}` : '', 'Quezon City'].filter(Boolean).join(', '),
        hospitalFacility: row.hospital_facility,
        medicalCondition: row.medical_condition,
        category: row.category,
        assistanceType: row.assistance_type
      }
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit new AICS application to PostgreSQL DB
app.post('/api/aics/applications', async (req, res) => {
  const { 
    referenceNo, 
    applicantName, 
    serviceName, 
    category, 
    assistanceType, 
    hospitalFacility, 
    medicalCondition, 
    assignedSocialWorker, 
    benefitDocumentType,
    status,
    details
  } = req.body;

  try {
    const refNo = referenceNo || `QC-AICS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const name = applicantName || details?.applicantName || 'Applicant';
    const firstName = details?.firstName || name.split(' ')[0] || '';
    const middleName = details?.middleName || '';
    const lastName = details?.lastName || name.split(' ').pop() || '';
    const suffix = details?.suffix || '';
    const dob = details?.dob || '';
    const age = details?.age || '';
    const gender = details?.gender || '';
    const civilStatus = details?.civilStatus || '';
    const houseNo = details?.houseNo || '';
    const streetName = details?.street || details?.streetName || '';
    const barangay = details?.barangay || '';
    const phoneNumber = details?.phone || details?.phoneNumber || '';

    const isPatientSelf = details?.isApplicantPatient !== undefined ? details.isApplicantPatient : true;
    const patientRel = details?.patientRelation || (isPatientSelf ? 'Self' : '');
    const patientFirst = details?.patientFirstName || (isPatientSelf ? firstName : '');
    const patientMiddle = details?.patientMiddleName || (isPatientSelf ? middleName : '');
    const patientLast = details?.patientLastName || (isPatientSelf ? lastName : '');
    const patientSuf = details?.patientSuffix || (isPatientSelf ? suffix : '');
    const patientGender = details?.patientGender || (isPatientSelf ? gender : '');
    const patientDob = details?.patientDob || (isPatientSelf ? dob : '');
    const patientAge = details?.patientAge || (isPatientSelf ? age : '');
    const patientHouse = details?.patientHouseNo || houseNo;
    const patientStreet = details?.patientStreet || streetName;
    const patientBrgy = details?.patientBarangay || barangay;

    const sName = serviceName || 'QC Medical Assistance';
    const cat = category || 'AICS';
    const astType = assistanceType || details?.assistanceType || 'Medical Assistance';
    const hosp = hospitalFacility || details?.hospitalFacility || details?.hospital || '';
    const cond = medicalCondition || details?.medicalCondition || details?.diagnosis || '';
    const worker = assignedSocialWorker || 'Social Worker Maria Santos, RSW (QC CSWDO)';
    const appStatus = status || 'Under Review';
    const defaultBenefit = benefitDocumentType || (astType === 'Medicines / Medical Supplies'
      ? 'Medicine Gift Certificate / Pharmacy Voucher'
      : 'Hospital Guarantee Letter (GL)');

    const deceasedDateOfDeath = details?.deceasedDateOfDeath || '';
    const deceasedCremationOrBurial = details?.deceasedCremationOrBurial || '';
    const deceasedPlaceOfDeath = details?.deceasedPlaceOfDeath || '';
    const deceasedDateOfBurial = details?.deceasedDateOfBurial || '';
    const burialLocationSite = details?.burialLocationSite || '';
    const cremationLocationSite = details?.cremationLocationSite || '';
    const funeralDistrict = details?.funeralDistrict || '';
    const funeralHomeName = details?.funeralHomeName || hosp || '';
    const initialFuneralChoice = details?.selectedFuneralHome || '';

    const savedDetails = JSON.stringify(details || { applicantName: name, hospitalFacility: hosp, medicalCondition: cond, category: cat, assistanceType: astType });

    const query = `
      INSERT INTO aics_applications 
      (
        reference_no, applicant_name, first_name, middle_name, last_name, suffix, dob, age, gender, civil_status, house_no, street_name, barangay, phone_number,
        is_patient_self, patient_relationship, patient_first_name, patient_middle_name, patient_last_name, patient_suffix, patient_gender, patient_dob, patient_age, patient_house_no, patient_street_name, patient_barangay,
        service_name, category, assistance_type, hospital_facility, medical_condition, status, assigned_social_worker, benefit_document_type,
        deceased_date_of_death, deceased_cremation_or_burial, deceased_place_of_death, deceased_date_of_burial, burial_location_site, cremation_location_site, funeral_district, funeral_home_name, initial_funeral_choice,
        details
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
        $27, $28, $29, $30, $31, $32, $33, $34,
        $35, $36, $37, $38, $39, $40, $41, $42, $43,
        $44
      )
      ON CONFLICT (reference_no) DO UPDATE SET
        applicant_name = EXCLUDED.applicant_name,
        first_name = EXCLUDED.first_name,
        middle_name = EXCLUDED.middle_name,
        last_name = EXCLUDED.last_name,
        suffix = EXCLUDED.suffix,
        dob = EXCLUDED.dob,
        age = EXCLUDED.age,
        gender = EXCLUDED.gender,
        civil_status = EXCLUDED.civil_status,
        house_no = EXCLUDED.house_no,
        street_name = EXCLUDED.street_name,
        barangay = EXCLUDED.barangay,
        phone_number = EXCLUDED.phone_number,
        is_patient_self = EXCLUDED.is_patient_self,
        patient_relationship = EXCLUDED.patient_relationship,
        patient_first_name = EXCLUDED.patient_first_name,
        patient_middle_name = EXCLUDED.patient_middle_name,
        patient_last_name = EXCLUDED.patient_last_name,
        patient_suffix = EXCLUDED.patient_suffix,
        patient_gender = EXCLUDED.patient_gender,
        patient_dob = EXCLUDED.patient_dob,
        patient_age = EXCLUDED.patient_age,
        patient_house_no = EXCLUDED.patient_house_no,
        patient_street_name = EXCLUDED.patient_street_name,
        patient_barangay = EXCLUDED.patient_barangay,
        assistance_type = EXCLUDED.assistance_type,
        hospital_facility = EXCLUDED.hospital_facility,
        medical_condition = EXCLUDED.medical_condition,
        status = EXCLUDED.status,
        deceased_date_of_death = EXCLUDED.deceased_date_of_death,
        deceased_cremation_or_burial = EXCLUDED.deceased_cremation_or_burial,
        deceased_place_of_death = EXCLUDED.deceased_place_of_death,
        deceased_date_of_burial = EXCLUDED.deceased_date_of_burial,
        burial_location_site = EXCLUDED.burial_location_site,
        cremation_location_site = EXCLUDED.cremation_location_site,
        funeral_district = EXCLUDED.funeral_district,
        funeral_home_name = EXCLUDED.funeral_home_name,
        initial_funeral_choice = EXCLUDED.initial_funeral_choice,
        details = EXCLUDED.details,
        updated_at = NOW()
      RETURNING *;
    `;
    const values = [
      refNo, name, firstName, middleName, lastName, suffix, dob, age, gender, civilStatus, houseNo, streetName, barangay, phoneNumber,
      isPatientSelf, patientRel, patientFirst, patientMiddle, patientLast, patientSuf, patientGender, patientDob, patientAge, patientHouse, patientStreet, patientBrgy,
      sName, cat, astType, hosp, cond, appStatus, worker, defaultBenefit,
      deceasedDateOfDeath, deceasedCremationOrBurial, deceasedPlaceOfDeath, deceasedDateOfBurial, burialLocationSite, cremationLocationSite, funeralDistrict, funeralHomeName, initialFuneralChoice,
      savedDetails
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];
    const formatted = {
      referenceNo: row.reference_no,
      applicantName: row.applicant_name,
      serviceName: row.service_name,
      category: row.category,
      assistanceType: row.assistance_type,
      hospitalFacility: row.hospital_facility,
      medicalCondition: row.medical_condition,
      status: row.status,
      amountOrType: row.assistance_type || 'Guarantee Letter / Financial Subsidy',
      assignedSocialWorker: row.assigned_social_worker,
      benefitDocumentType: row.benefit_document_type,
      dateSubmitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
      details: row.details || {
        qcId: '110000262304143',
        applicantName: row.applicant_name,
        firstName: row.first_name,
        middleName: row.middle_name,
        lastName: row.last_name,
        suffix: row.suffix,
        dob: row.dob,
        age: row.age,
        gender: row.gender,
        civilStatus: row.civil_status,
        houseNo: row.house_no,
        street: row.street_name,
        barangay: row.barangay,
        fullAddress: [row.house_no, row.street_name, row.barangay ? `Brgy. ${row.barangay}` : '', 'Quezon City'].filter(Boolean).join(', '),
        phone: row.phone_number,
        isApplicantPatient: row.is_patient_self,
        patientRelation: row.patient_relationship,
        patientName: [row.patient_first_name, row.patient_middle_name, row.patient_last_name, row.patient_suffix].filter(Boolean).join(' '),
        patientGender: row.patient_gender,
        patientDob: row.patient_dob,
        patientAge: row.patient_age,
        patientAddress: [row.patient_house_no, row.patient_street_name, row.patient_barangay ? `Brgy. ${row.patient_barangay}` : '', 'Quezon City'].filter(Boolean).join(', '),
        hospitalFacility: row.hospital_facility,
        medicalCondition: row.medical_condition,
        category: row.category,
        assistanceType: row.assistance_type
      }
    };

    sendNotificationEmail({
      to: req.body.emailAddress || req.body.email || 'clarencemillares15@gmail.com',
      subject: `GovServe Notice: Application Received (${formatted.referenceNo})`,
      title: `Application Successfully Submitted!`,
      applicantName: formatted.applicantName,
      refNo: formatted.referenceNo,
      status: formatted.status || 'Under Review',
      detailsMessage: `Your application for ${formatted.serviceName || 'AICS Assistance'} has been successfully submitted and recorded in the QC GovServe Social Services system.`,
    });

    res.status(201).json(formatted);
  } catch (err) {
    console.error('Database POST error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update application status & scheduled dates/times in PostgreSQL DB
app.put('/api/aics/applications/:refNo/status', async (req, res) => {
  const { refNo } = req.params;
  const { status, scheduledPayoutDate, scheduledPayoutTime, appointmentDate, appointmentTime, appointmentDetails } = req.body;

  const apptDate = appointmentDate || appointmentDetails?.appointmentDate || null;
  const apptTime = appointmentTime || appointmentDetails?.appointmentTime || null;

  try {
    const query = `
      UPDATE aics_applications 
      SET status = $1, 
          scheduled_payout_date = COALESCE($2, scheduled_payout_date),
          scheduled_payout_time = COALESCE($3, scheduled_payout_time),
          appointment_date = COALESCE($4, appointment_date),
          appointment_time = COALESCE($5, appointment_time),
          updated_at = NOW() 
      WHERE reference_no = $6 
      RETURNING *;
    `;
    const result = await pool.query(query, [status, scheduledPayoutDate || null, scheduledPayoutTime || null, apptDate, apptTime, refNo]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const row = result.rows[0];
    console.log(`✅ Updated status for ${refNo} to "${status}" (Appt: ${row.appointment_date} ${row.appointment_time}, Payout: ${row.scheduled_payout_date} ${row.scheduled_payout_time}) in DB`);
    const formatted = {
      referenceNo: row.reference_no,
      applicantName: row.applicant_name,
      serviceName: row.service_name,
      category: row.category,
      assistanceType: row.assistance_type,
      status: row.status,
      scheduledPayoutDate: row.scheduled_payout_date,
      scheduledPayoutTime: row.scheduled_payout_time,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      appointmentDetails: {
        appointmentDate: row.appointment_date || row.scheduled_payout_date,
        appointmentTime: row.appointment_time || row.scheduled_payout_time,
        venue: 'QC Hall SSDD Desk 3, Ground Flr High-Rise Bldg',
        assignedWorker: row.assigned_social_worker || 'Maria Santos, RSW'
      },
      amountOrType: row.assistance_type || 'Guarantee Letter / Financial Subsidy',
      assignedSocialWorker: row.assigned_social_worker,
      benefitDocumentType: row.benefit_document_type,
      dateSubmitted: row.date_submitted ? new Date(row.date_submitted).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
      details: {
        applicantName: row.applicant_name,
        hospital: row.hospital_facility,
        diagnosis: row.medical_condition
      }
    };

    sendNotificationEmail({
      to: row.email_address || 'clarencemillares15@gmail.com',
      subject: `GovServe Update: Application ${row.reference_no} status is now "${row.status}"`,
      title: `Application Status Changed: ${row.status}`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: row.status,
      detailsMessage: `Your ${row.service_name} application status has been updated to "${row.status}".`,
      appointmentInfo: row.appointment_date ? `Appointment on ${row.appointment_date} at ${row.appointment_time || '09:00 AM'}` : (row.scheduled_payout_date ? `Payout scheduled for ${row.scheduled_payout_date} at ${row.scheduled_payout_time || '09:00 AM'}` : null)
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error updating status in DB:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all Senior Citizen applications from PostgreSQL DB
app.get('/api/senior/applications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM senior_applications ORDER BY date_submitted DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit new Senior Citizen application to PostgreSQL DB
app.post('/api/senior/applications', async (req, res) => {
  const { 
    referenceNo, 
    applicantName, 
    firstName,
    middleName,
    lastName,
    suffix,
    dob,
    age,
    gender,
    civilStatus,
    houseNo,
    streetName,
    barangay,
    phoneNumber,
    seniorIdNo,
    status,
    details
  } = req.body;

  try {
    const refNo = referenceNo || `SENIOR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const name = applicantName || details?.personalInformation?.applicantName || `${firstName || ''} ${lastName || ''}`.trim() || 'Senior Applicant';
    const savedDetails = JSON.stringify(details || {});

    const empStatus = details?.occupationFinancialInformation?.employmentStatus || '';
    const occ = details?.occupationFinancialInformation?.occupation || '';
    const srcIncome = details?.occupationFinancialInformation?.sourceOfIncome || '';
    const approxInc = details?.occupationFinancialInformation?.approxMonthlyIncome || '';
    const pensionRec = details?.occupationFinancialInformation?.pensionReceived || '';
    const pensionDet = details?.occupationFinancialInformation?.otherPensionDetails || '';
    const monthlyExp = details?.monthlyHouseholdExpenses?.totalMonthlyExpenses || '';
    const livArrangement = details?.livingSituationAdditionalInfo?.livingArrangement || '';
    const custLivArrangement = details?.livingSituationAdditionalInfo?.customLivingArrangement || '';
    const finSupportSrc = details?.livingSituationAdditionalInfo?.financialSupportSource || '';
    const custFinSupport = details?.livingSituationAdditionalInfo?.customFinancialSupport || '';
    const reasonAssist = details?.livingSituationAdditionalInfo?.reasonForAssistance || '';
    const custReasonAssist = details?.livingSituationAdditionalInfo?.customReasonForAssistance || '';
    const otherBenRec = details?.otherAssistanceBenefits?.benefitReceived || '';
    const custOtherBen = details?.otherAssistanceBenefits?.customBenefitReceived || '';

    const query = `
      INSERT INTO senior_applications (
        reference_no, applicant_name, first_name, middle_name, last_name, suffix, dob, age, gender, civil_status, house_no, street_name, barangay, phone_number, senior_id_no,
        employment_status, occupation, source_of_income, approx_monthly_income, pension_received, pension_details, total_monthly_expenses,
        living_arrangement, custom_living_arrangement, financial_support_source, custom_financial_support, reason_for_assistance, custom_reason_for_assistance,
        other_benefits_received, custom_other_benefit, status, details
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22,
        $23, $24, $25, $26, $27, $28,
        $29, $30, $31, $32
      )
      ON CONFLICT (reference_no) DO UPDATE SET
        applicant_name = EXCLUDED.applicant_name,
        details = EXCLUDED.details,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      refNo,
      name,
      firstName || details?.personalInformation?.firstName || '',
      middleName || details?.personalInformation?.middleName || '',
      lastName || details?.personalInformation?.lastName || '',
      suffix || details?.personalInformation?.suffix || '',
      dob || details?.personalInformation?.dateOfBirth || '',
      age || details?.personalInformation?.age || '',
      gender || details?.personalInformation?.gender || '',
      civilStatus || details?.personalInformation?.civilStatus || '',
      houseNo || details?.personalInformation?.houseNo || '',
      streetName || details?.personalInformation?.streetName || '',
      barangay || details?.personalInformation?.barangay || '',
      phoneNumber || details?.personalInformation?.phoneNumber || '',
      seniorIdNo || details?.personalInformation?.seniorCitizenId || '',
      empStatus,
      occ,
      srcIncome,
      approxInc,
      pensionRec,
      pensionDet,
      monthlyExp,
      livArrangement,
      custLivArrangement,
      finSupportSrc,
      custFinSupport,
      reasonAssist,
      custReasonAssist,
      otherBenRec,
      custOtherBen,
      status || 'Pending Validation',
      savedDetails
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    sendNotificationEmail({
      to: req.body.emailAddress || req.body.email || 'clarencemillares15@gmail.com',
      subject: `GovServe Notice: Senior Citizen Application Received (${row.reference_no})`,
      title: `Senior Citizen Assistance Submitted`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: row.status || 'Pending Validation',
      detailsMessage: `Your Senior Citizen Financial Assistance application has been recorded in the QC GovServe System.`,
    });

    res.status(201).json(row);
  } catch (err) {
    console.error('Error saving senior application to DB:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update status/schedule of a Senior application
app.put('/api/senior/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    disapprovalReason, 
    appointmentDate, 
    appointmentDay, 
    appointmentTime, 
    appointmentVenue, 
    payoutDate, 
    payoutDay, 
    payoutTime, 
    payoutVenue 
  } = req.body;

  try {
    const query = `
      UPDATE senior_applications 
      SET 
        status = COALESCE($1, status),
        disapproval_reason = COALESCE($2, disapproval_reason),
        appointment_date = COALESCE($3, appointment_date),
        appointment_day = COALESCE($4, appointment_day),
        appointment_time = COALESCE($5, appointment_time),
        appointment_venue = COALESCE($6, appointment_venue),
        payout_date = COALESCE($7, payout_date),
        payout_day = COALESCE($8, payout_day),
        payout_time = COALESCE($9, payout_time),
        payout_venue = COALESCE($10, payout_venue),
        updated_at = CURRENT_TIMESTAMP
      WHERE id::text = $11 OR reference_no = $11
      RETURNING *;
    `;
    const result = await pool.query(query, [
      status, disapprovalReason, appointmentDate, appointmentDay, appointmentTime, appointmentVenue,
      payoutDate, payoutDay, payoutTime, payoutVenue, id
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Senior application not found' });
    }
    const row = result.rows[0];

    sendNotificationEmail({
      to: row.email_address || 'clarencemillares15@gmail.com',
      subject: `Senior Citizen Assistance Update (${row.reference_no}): ${row.status}`,
      title: `Senior Citizen Status Update: ${row.status}`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: row.status,
      detailsMessage: row.disapproval_reason ? `Reason: ${row.disapproval_reason}` : `Your Senior Citizen Financial Assistance application status has been updated.`,
      appointmentInfo: row.appointment_date ? `Interview on ${row.appointment_date} at ${row.appointment_time || '09:00 AM'} (${row.appointment_venue || 'QC Hall'})` : (row.payout_date ? `Payout on ${row.payout_date} at ${row.payout_time || '09:00 AM'} (${row.payout_venue || 'QC Hall'})` : null)
    });

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all PWD applications from PostgreSQL DB
app.get('/api/pwd/applications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pwd_applications ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit new PWD application to PostgreSQL DB
app.post('/api/pwd/applications', async (req, res) => {
  const { 
    referenceNo, 
    applicantName, 
    firstName,
    middleName,
    lastName,
    suffix,
    nationality,
    dob,
    age,
    gender,
    civilStatus,
    houseNo,
    streetName,
    barangay,
    phoneNumber,
    pwdIdNo,
    employmentStatus,
    occupation,
    sourceOfIncome,
    approxMonthlyIncome,
    educationalAttainment,
    otherEducationInfo,
    familyMembers,
    monthlyExpenses,
    disabilityType,
    swaQualifyingCategory,
    reasonForAssistance,
    uploadedDocuments,
    serviceName,
    category,
    assistanceType,
    amount,
    status,
    details
  } = req.body;

  try {
    const query = `
      INSERT INTO pwd_applications (
        reference_no, applicant_name, first_name, middle_name, last_name, suffix,
        nationality, dob, age, gender, civil_status, house_no, street_name, barangay,
        phone_number, pwd_id_no, employment_status, occupation, source_of_income,
        approx_monthly_income, educational_attainment, other_education_info,
        family_members, monthly_expenses, disability_type, swa_qualifying_category,
        reason_for_assistance, uploaded_documents, service_name, category,
        assistance_type, amount, status, details
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34
      ) RETURNING *;
    `;

    const computedName = [firstName, middleName, lastName, suffix].filter(Boolean).join(' ').trim();
    const values = [
      referenceNo || `QC-PWD-${Math.floor(100000 + Math.random() * 900000)}`,
      applicantName || computedName || 'PWD Applicant',
      firstName || '',
      middleName || '',
      lastName || '',
      suffix || '',
      nationality || 'FILIPINO',
      dob || '',
      age || '',
      gender || '',
      civilStatus || '',
      houseNo || '',
      streetName || '',
      barangay || '',
      phoneNumber || '',
      pwdIdNo || '',
      employmentStatus || '',
      occupation || '',
      sourceOfIncome || '',
      approxMonthlyIncome || '',
      educationalAttainment || '',
      otherEducationInfo || '',
      familyMembers ? JSON.stringify(familyMembers) : null,
      monthlyExpenses || '',
      disabilityType || swaQualifyingCategory || 'General PWD',
      swaQualifyingCategory || disabilityType || '',
      reasonForAssistance || '',
      uploadedDocuments ? JSON.stringify(uploadedDocuments) : null,
      serviceName || 'PWD Social Assistance Program',
      category || 'pwd',
      assistanceType || 'PWD Social Aid',
      amount || 1500.00,
      status || 'Pending Review',
      details ? JSON.stringify(details) : null
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting PWD application:", err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update status of PWD application in PostgreSQL DB
app.put('/api/pwd/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    disapprovalReason, 
    appointmentDate, 
    appointmentTime, 
    appointmentVenue, 
    payoutDate, 
    payoutTime, 
    payoutVenue 
  } = req.body;

  try {
    const query = `
      UPDATE pwd_applications 
      SET 
        status = COALESCE($1, status),
        disapproval_reason = COALESCE($2, disapproval_reason),
        appointment_date = COALESCE($3, appointment_date),
        appointment_time = COALESCE($4, appointment_time),
        appointment_venue = COALESCE($5, appointment_venue),
        payout_date = COALESCE($6, payout_date),
        payout_time = COALESCE($7, payout_time),
        payout_venue = COALESCE($8, payout_venue),
        updated_at = CURRENT_TIMESTAMP
      WHERE id::text = $9 OR reference_no = $9
      RETURNING *;
    `;
    const result = await pool.query(query, [
      status, disapprovalReason, appointmentDate, appointmentTime, appointmentVenue,
      payoutDate, payoutTime, payoutVenue, id
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'PWD application not found' });
    }
    const row = result.rows[0];

    sendNotificationEmail({
      to: row.phone_number || 'clarencemillares15@gmail.com',
      subject: `PWD Social Assistance Update (${row.reference_no}): ${row.status}`,
      title: `PWD Assistance Status Update: ${row.status}`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: row.status,
      detailsMessage: row.disapproval_reason ? `Reason: ${row.disapproval_reason}` : `Your PWD Social Assistance Program application status has been updated.`,
      appointmentInfo: row.appointment_date ? `Interview on ${row.appointment_date} at ${row.appointment_time || '09:00 AM'} (${row.appointment_venue || 'PDAO Room 102'})` : (row.payout_date ? `Payout on ${row.payout_date} at ${row.payout_time || '09:00 AM'} (${row.payout_venue || 'PDAO Room 102'})` : null)
    });

    res.json({ message: 'PWD status updated successfully', record: row });
  } catch (err) {
    console.error('Error updating PWD application status:', err);
    res.status(500).json({ error: err.message });
  }
});



// GET all Child Welfare applications from PostgreSQL DB
app.get('/api/child-welfare/applications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM child_welfare_applications ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit new Child Welfare application to PostgreSQL DB
app.post('/api/child-welfare/applications', async (req, res) => {
  const { 
    referenceNo, 
    applicantName, 
    firstName,
    middleName,
    lastName,
    suffix,
    qcitizenId,
    nationality,
    dob,
    age,
    gender,
    civilStatus,
    houseNo,
    streetName,
    barangay,
    phoneNumber,
    emailAddress,
    soloParentIdNo,
    relationshipToChild,
    childFullName,
    childDob,
    childAge,
    childSex,
    childAddress,
    schoolName,
    gradeLevel,
    lrnNumber,
    typeOfSchool,
    otherEnrollmentInfo,
    selectedSectors,
    selectedServices,
    concernDescription,
    incidentDate,
    incidentLocation,
    assistanceType,
    serviceName,
    category,
    numChildrenInFamily,
    numChildrenStudying,
    monthlyFamilyIncome,
    is4psBeneficiary,
    isSoloEducationalBeneficiary,
    isPwdEducationalBeneficiary,
    status,
    uploadedDocuments,
    details
  } = req.body;

  try {
    const refNo = referenceNo || `QC-CW-${Math.floor(100000 + Math.random() * 900000)}`;
    const name = applicantName || details?.applicantName || `${firstName || 'JEFFERSON'} ${lastName || 'LEE'}`.trim();
    const resolvedServiceName = serviceName || (refNo.startsWith('QC-CW-') ? 'Child Welfare Services' : 'Child Welfare Services Aid');
    const resolvedCategory = category || 'child_welfare';

    const safeJsonString = (val, fallback) => {
      if (!val) return fallback;
      if (typeof val === 'string') return val;
      try {
        return JSON.stringify(val);
      } catch (e) {
        return fallback;
      }
    };

    const savedDocs = safeJsonString(uploadedDocuments, '{}');
    const savedDetails = safeJsonString(details, '{}');
    const savedSectors = safeJsonString(selectedSectors, '[]');
    const savedServices = safeJsonString(selectedServices, '[]');

    // Check if record already exists
    const existing = await pool.query('SELECT id FROM child_welfare_applications WHERE reference_no = $1 LIMIT 1', [refNo]);

    let row;
    if (existing.rows.length > 0) {
      const updateQuery = `
        UPDATE child_welfare_applications SET
          applicant_name = $1,
          service_name = $2,
          category = $3,
          status = $4,
          uploaded_documents = $5::jsonb,
          details = $6::jsonb,
          updated_at = CURRENT_TIMESTAMP
        WHERE reference_no = $7
        RETURNING *;
      `;
      const updateRes = await pool.query(updateQuery, [
        name,
        resolvedServiceName,
        resolvedCategory,
        status || 'Pending Document Validation',
        savedDocs,
        savedDetails,
        refNo
      ]);
      row = updateRes.rows[0];
    } else {
      const insertQuery = `
        INSERT INTO child_welfare_applications (
          reference_no, applicant_name, first_name, middle_name, last_name, suffix, qcitizen_id, nationality, dob, age, gender, civil_status,
          house_no, street_name, barangay, phone_number, email_address, solo_parent_id_no, relationship_to_child,
          child_full_name, child_dob, child_age, child_sex, child_address, school_name, grade_level, lrn_number, type_of_school, other_enrollment_info,
          selected_sectors, selected_services, concern_description, incident_date, incident_location, assistance_type, service_name, category,
          num_children_in_family, num_children_studying, monthly_family_income, is_4ps_beneficiary, is_solo_educational_beneficiary, is_pwd_educational_beneficiary,
          status, uploaded_documents, details
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
          $30::jsonb, $31::jsonb, $32, $33, $34, $35, $36, $37,
          $38, $39, $40, $41, $42, $43,
          $44, $45::jsonb, $46::jsonb
        )
        RETURNING *;
      `;
      const values = [
        refNo, name, firstName || 'JEFFERSON', middleName || 'FERNANDO', lastName || 'LEE', suffix || '', qcitizenId || '110008262304143', nationality || 'FILIPINO',
        dob || '2004-09-27', age || '22', gender || 'Male', civilStatus || 'Single',
        houseNo || '176', streetName || '23', barangay || 'Bagong Silangan', phoneNumber || '09155582122', emailAddress || 'jeffersonlee1234@gmail.com',
        soloParentIdNo || '', relationshipToChild || 'Parent',
        childFullName || '', childDob || '', childAge || '', childSex || '', childAddress || '', schoolName || '', gradeLevel || '', lrnNumber || '', typeOfSchool || '', otherEnrollmentInfo || '',
        savedSectors, savedServices, concernDescription || '', incidentDate || '', incidentLocation || '', assistanceType || 'Child Welfare Aid',
        resolvedServiceName, resolvedCategory,
        numChildrenInFamily || '', numChildrenStudying || '', monthlyFamilyIncome || '', is4psBeneficiary || 'No', isSoloEducationalBeneficiary || 'No', isPwdEducationalBeneficiary || 'No',
        status || 'Pending Document Validation', savedDocs, savedDetails
      ];
      const insertRes = await pool.query(insertQuery, values);
      row = insertRes.rows[0];
    }

    res.status(201).json(row);
  } catch (err) {
    console.error('Error saving Child Welfare application:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update status/scheduling of a Child Welfare application
app.put('/api/child-welfare/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, disapprovalReason, appointmentDate, appointmentTime, appointmentVenue, payoutDate, payoutTime, payoutVenue } = req.body;
  try {
    const query = `
      UPDATE child_welfare_applications 
      SET 
        status = COALESCE($1, status),
        disapproval_reason = COALESCE($2, disapproval_reason),
        appointment_date = COALESCE($3, appointment_date),
        appointment_time = COALESCE($4, appointment_time),
        appointment_venue = COALESCE($5, appointment_venue),
        payout_date = COALESCE($6, payout_date),
        payout_time = COALESCE($7, payout_time),
        payout_venue = COALESCE($8, payout_venue),
        updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $9 OR id::text = $9
      RETURNING *;
    `;
    const result = await pool.query(query, [
      status, disapprovalReason, appointmentDate, appointmentTime, appointmentVenue, payoutDate, payoutTime, payoutVenue, id
    ]);
    const row = result.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Child Welfare application not found' });
    }

    // Also sync payout fields and status to educational_applications if reference matches
    await pool.query(`
      UPDATE educational_applications 
      SET 
        status = COALESCE($1, status),
        payout_date = COALESCE($2, payout_date),
        payout_time = COALESCE($3, payout_time),
        payout_venue = COALESCE($4, payout_venue),
        updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $5;
    `, [status, payoutDate || null, payoutTime || null, payoutVenue || null, row.reference_no]).catch(() => null);

    // Sync to appointments table when approved / scheduled
    if (status === 'APPROVED BY ADMIN' || status === 'APPROVED' || (status || '').includes('Approved') || (status || '').includes('APPROVED') || (status || '').includes('Released') || (status || '').includes('COMPLETED') || appointmentDate) {
      const isCompleted = status === 'Released & Archived' || status === 'Approved' || status === 'APPROVED' || (status || '').includes('COMPLETED') || status === 'Ready for Payout' || status === 'Passed / Completed';
      const apptStatus = isCompleted ? ((status || '').includes('COMPLETED') ? 'Approved / Completed' : 'Released & Archived') : (appointmentDate ? 'Interview Scheduled' : 'Pending Schedule');
      try {
        const checkAppt = await pool.query(`SELECT id FROM appointments WHERE reference_no = $1`, [row.reference_no]);
        if (checkAppt.rows.length > 0) {
          await pool.query(`
            UPDATE appointments 
            SET 
              appointment_date = COALESCE($1, appointment_date),
              appointment_time = COALESCE($2, appointment_time),
              venue = COALESCE($3, venue),
              status = $4
            WHERE reference_no = $5;
          `, [appointmentDate || null, appointmentTime || null, appointmentVenue || null, apptStatus, row.reference_no]);
        } else {
          await pool.query(`
            INSERT INTO appointments (reference_no, module_name, applicant_name, appointment_date, appointment_time, venue, purpose, status)
            VALUES ($1, 'CHILD WELFARE', $2, $3, $4, COALESCE($5, 'Quezon City Hall SSDD Office'), 'Child Welfare Services SSDD Assessment & Intake Interview', $6);
          `, [row.reference_no, row.applicant_name, appointmentDate || null, appointmentTime || null, appointmentVenue || null, apptStatus]);
        }
      } catch (e) {
        console.warn('Sync appointments warning for Child Welfare:', e.message);
      }
    }

    // Sync to financial disbursements when payout scheduled or approved
    if (
      status === 'APPROVED' || 
      status === 'APPROVED BY ADMIN' || 
      status === 'Payout Scheduled' || 
      status === 'PAYOUT SCHEDULED' ||
      status === 'RELEASED / COMPLETED' ||
      status === 'Released & Archived' ||
      (status || '').includes('Ready for Payout') ||
      (status || '').includes('Approved')
    ) {
      const finStatus = (status === 'RELEASED / COMPLETED' || status === 'Released & Archived')
        ? 'RELEASED / COMPLETED'
        : (status === 'Payout Scheduled' || status === 'PAYOUT SCHEDULED')
        ? 'PAYOUT SCHEDULED'
        : 'PENDING PAYOUT SCHEDULE';
      try {
        const checkFin = await pool.query(`SELECT id FROM financial_disbursements WHERE reference_no = $1`, [row.reference_no]);
        if (checkFin.rows.length > 0) {
          await pool.query(`
            UPDATE financial_disbursements 
            SET 
              payout_date = COALESCE($1, payout_date),
              payout_start_time = COALESCE($2, payout_start_time),
              venue = COALESCE($3, venue),
              status = $4,
              updated_at = CURRENT_TIMESTAMP
            WHERE reference_no = $5;
          `, [payoutDate || row.payout_date || null, payoutTime || row.payout_time || null, payoutVenue || row.payout_venue || null, finStatus, row.reference_no]);
        } else {
          await pool.query(`
            INSERT INTO financial_disbursements (reference_no, applicant_name, module_name, benefit_name, amount, payout_date, payout_start_time, venue, status)
            VALUES ($1, $2, 'CHILD WELFARE', 'Educational Assistance for Indigent Children & Youth', 5000.00, $3, $4, $5, $6);
          `, [row.reference_no, row.applicant_name, payoutDate || row.payout_date || null, payoutTime || row.payout_time || null, payoutVenue || row.payout_venue || null, finStatus]);
        }
      } catch (e) {
        console.warn('Sync financial disbursements warning for Child Welfare:', e.message);
      }
    }

    res.json(row);
  } catch (err) {
    console.error('Error updating Child Welfare application status:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all Solo Parent applications from PostgreSQL DB
app.get('/api/solo-parent/applications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM solo_parent_applications ORDER BY date_submitted DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit new Solo Parent application to PostgreSQL DB
app.post('/api/solo-parent/applications', async (req, res) => {
  const { 
    referenceNo, 
    applicantName, 
    firstName,
    middleName,
    lastName,
    suffix,
    nationality,
    dob,
    age,
    gender,
    civilStatus,
    houseNo,
    streetName,
    barangay,
    phoneNumber,
    emailAddress,
    soloParentIdNo,
    soloParentStatus,
    soloParentCategory,
    childFullName,
    childAge,
    childDob,
    childSex,
    schoolName,
    gradeLevel,
    lrnNumber,
    schoolAddress,
    numDependents,
    ageYoungestDependent,
    employmentStatus,
    occupation,
    employerIncomeSource,
    monthlyIncome,
    receivingGovAssistance,
    govProgramName,
    govAssistanceAmountFreq,
    receivingPension,
    pensionType,
    uploadedDocuments,
    status,
    details
  } = req.body;

  try {
    const refNo = referenceNo || `SP-SUBSIDY-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const name = applicantName || details?.applicantName || `${firstName || 'JEFFERSON'} ${lastName || 'LEE'}`.trim();
    const savedDetails = JSON.stringify(details || {});
    const savedDocs = JSON.stringify(uploadedDocuments || {});

    const query = `
      INSERT INTO solo_parent_applications (
        reference_no, applicant_name, first_name, middle_name, last_name, suffix, nationality, dob, age, gender, civil_status,
        house_no, street_name, barangay, phone_number, email_address, solo_parent_id_no, solo_parent_status,
        solo_parent_category, child_full_name, child_age, child_dob, child_sex, school_name, grade_level, lrn_number, school_address,
        num_dependents, age_youngest_dependent, employment_status, occupation, employer_income_source,
        monthly_income, receiving_gov_assistance, gov_program_name, gov_assistance_amount_freq, receiving_pension, pension_type,
        status, uploaded_documents, details
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32,
        $33, $34, $35, $36, $37, $38,
        $39, $40, $41
      )
      ON CONFLICT (reference_no) DO UPDATE SET
        applicant_name = EXCLUDED.applicant_name,
        child_full_name = EXCLUDED.child_full_name,
        child_age = EXCLUDED.child_age,
        child_dob = EXCLUDED.child_dob,
        child_sex = EXCLUDED.child_sex,
        school_name = EXCLUDED.school_name,
        grade_level = EXCLUDED.grade_level,
        lrn_number = EXCLUDED.lrn_number,
        school_address = EXCLUDED.school_address,
        status = EXCLUDED.status,
        uploaded_documents = EXCLUDED.uploaded_documents,
        details = EXCLUDED.details,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      refNo, name, firstName || 'JEFFERSON', middleName || 'FERNANDO', lastName || 'LEE', suffix || '', nationality || 'FILIPINO',
      dob || '2004-09-27', age || '22', gender || 'Male', civilStatus || 'Single',
      houseNo || '176', streetName || '23', barangay || 'Bagong Silangan', phoneNumber || '09155582122', emailAddress || 'jeffersonlee1234@gmail.com',
      soloParentIdNo || 'SP-2026-88492', soloParentStatus || 'Active / Validated SPIC',
      soloParentCategory || 'Educational Assistance Grant',
      childFullName || null, childAge || null, childDob || null, childSex || null,
      schoolName || null, gradeLevel || null, lrnNumber || null, schoolAddress || null,
      numDependents || '1', ageYoungestDependent || '3', employmentStatus || 'Unemployed',
      occupation || '', employerIncomeSource || '', monthlyIncome || '0', receivingGovAssistance || 'No', govProgramName || '',
      govAssistanceAmountFreq || '', receivingPension || 'No', pensionType || '',
      status || 'Pending Document Validation', savedDocs, savedDetails
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    sendNotificationEmail({
      to: emailAddress || 'clarencemillares15@gmail.com',
      subject: `GovServe Notice: Solo Parent Subsidy Application Received (${row.reference_no})`,
      title: `Solo Parent Subsidy Application Submitted!`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: row.status || 'Pending Document Validation',
      detailsMessage: `Natanggap ang inyong Solo Parent Subsidy Form. Sinusuri ng Admin ang inyong Solo Parent ID at submitted documents.`
    });

    res.status(201).json(row);
  } catch (err) {
    console.error('Error saving Solo Parent application:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update status/scheduling of a Solo Parent application
app.put('/api/solo-parent/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    disapprovalReason, 
    appointmentDate, 
    appointmentTime, 
    appointmentVenue, 
    payoutDate, 
    payoutTime, 
    payoutVenue 
  } = req.body;

  try {
    const query = `
      UPDATE solo_parent_applications 
      SET 
        status = COALESCE($1, status),
        disapproval_reason = COALESCE($2, disapproval_reason),
        appointment_date = COALESCE($3, appointment_date),
        appointment_time = COALESCE($4, appointment_time),
        appointment_venue = COALESCE($5, appointment_venue),
        payout_date = COALESCE($6, payout_date),
        payout_time = COALESCE($7, payout_time),
        payout_venue = COALESCE($8, payout_venue),
        updated_at = CURRENT_TIMESTAMP
      WHERE id::text = $9 OR reference_no = $9
      RETURNING *;
    `;
    const result = await pool.query(query, [
      status, disapprovalReason, appointmentDate, appointmentTime, appointmentVenue,
      payoutDate, payoutTime, payoutVenue, id
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solo Parent application not found' });
    }
    const row = result.rows[0];

    // Sync with appointments table
    if (status === 'APPROVED BY ADMIN' || status === 'INTERVIEW SCHEDULED' || appointmentDate) {
      const apptStatus = appointmentDate || status === 'INTERVIEW SCHEDULED' ? 'Interview Scheduled' : 'Pending Schedule';
      try {
        const checkAppt = await pool.query(`SELECT id FROM appointments WHERE reference_no = $1`, [row.reference_no]);
        if (checkAppt.rows.length > 0) {
          await pool.query(`
            UPDATE appointments 
            SET 
              appointment_date = COALESCE($1, appointment_date),
              appointment_time = COALESCE($2, appointment_time),
              venue = COALESCE($3, venue),
              status = $4
            WHERE reference_no = $5;
          `, [appointmentDate || null, appointmentTime || null, appointmentVenue || null, apptStatus, row.reference_no]);
        } else {
          await pool.query(`
            INSERT INTO appointments (reference_no, module_name, applicant_name, appointment_date, appointment_time, venue, purpose, status)
            VALUES ($1, 'SOLO PARENT', $2, $3, $4, COALESCE($5, 'Quezon City Hall SSDD Office'), 'Solo Parent SSDD Assessment & Intake Interview', $6);
          `, [row.reference_no, row.applicant_name, appointmentDate || null, appointmentTime || null, appointmentVenue || null, apptStatus]);
        }
      } catch (e) {
        console.warn('Sync appointments warning:', e.message);
      }
    }

    // Only insert into financial_disbursements when Step 4 is APPROVED (Interview passed) or PAYOUT SCHEDULED
    if (status === 'APPROVED' || status === 'Ready for Payout' || status === 'PAYOUT SCHEDULED') {
      try {
        const checkFin = await pool.query(`SELECT id FROM financial_disbursements WHERE reference_no = $1`, [row.reference_no]);
        if (checkFin.rows.length > 0) {
          await pool.query(`
            UPDATE financial_disbursements 
            SET 
              payout_date = COALESCE($1, payout_date),
              payout_start_time = COALESCE($2, payout_start_time),
              venue = COALESCE($3, venue),
              status = $4,
              updated_at = CURRENT_TIMESTAMP
            WHERE reference_no = $5;
          `, [payoutDate || row.payout_date || null, payoutTime || row.payout_time || null, payoutVenue || row.payout_venue || null, status === 'PAYOUT SCHEDULED' ? 'PAYOUT SCHEDULED' : 'PENDING PAYOUT SCHEDULE', row.reference_no]);
        } else {
          const isEdu = (row.reference_no || '').startsWith('QC-SP-EDU') || (row.service_name || '').toLowerCase().includes('educ') || (row.solo_parent_category || '').toLowerCase().includes('educ');
          const benefitName = isEdu ? '₱5,000 Fixed Solo Parent Educational Grant' : '₱3,000 Fixed Solo Parent Cash Subsidy';
          const amountVal = isEdu ? 5000.00 : 3000.00;
          await pool.query(`
            INSERT INTO financial_disbursements (reference_no, applicant_name, module_name, benefit_name, amount, payout_date, payout_start_time, venue, status)
            VALUES ($1, $2, 'SOLO PARENT', $3, $4, $5, $6, $7, $8);
          `, [row.reference_no, row.applicant_name, benefitName, amountVal, payoutDate || row.payout_date || null, payoutTime || row.payout_time || null, payoutVenue || row.payout_venue || null, status === 'PAYOUT SCHEDULED' ? 'PAYOUT SCHEDULED' : 'PENDING PAYOUT SCHEDULE']);
        }
      } catch (e) {
        console.warn('Sync financial_disbursements warning:', e.message);
      }
    }

    sendNotificationEmail({
      to: row.email_address || 'clarencemillares15@gmail.com',
      subject: `Solo Parent Subsidy Update (${row.reference_no}): ${row.status}`,
      title: `Solo Parent Application Status: ${row.status}`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: row.status,
      detailsMessage: row.disapproval_reason ? `Disapproved ang request. Dahilan: ${row.disapproval_reason}` : `May update sa inyong Solo Parent Subsidy application. Current Status: ${row.status}`
    });

    res.json(row);
  } catch (err) {
    console.error('PUT status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET Financial Aid Disbursements Masterlist
app.get('/api/financial-aid/disbursements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM financial_disbursements ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Schedule Payout in Financial Aid Masterlist
app.post('/api/financial-aid/disbursements/schedule', async (req, res) => {
  const { referenceNo, payoutDate, startTime, endTime, venue } = req.body;
  try {
    const query = `
      UPDATE financial_disbursements
      SET payout_date = $1, payout_start_time = $2, payout_end_time = $3, venue = $4, status = 'PAYOUT SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $5
      RETURNING *;
    `;
    const result = await pool.query(query, [payoutDate, startTime, endTime, venue, referenceNo]);
    
    await pool.query(`
      UPDATE solo_parent_applications
      SET payout_date = $1, payout_time = $2, payout_venue = $3, status = 'PAYOUT SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $4;
    `, [payoutDate, `${startTime} - ${endTime}`, venue, referenceNo]);

    await pool.query(`
      UPDATE educational_applications
      SET payout_date = $1, payout_time = $2, payout_venue = $3, status = 'PAYOUT SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $4;
    `, [payoutDate, `${startTime} - ${endTime}`, venue, referenceNo]);

    await pool.query(`
      UPDATE senior_applications
      SET payout_date = $1, payout_time = $2, payout_venue = $3, status = 'PAYOUT SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $4;
    `, [payoutDate, `${startTime} - ${endTime}`, venue, referenceNo]);

    await pool.query(`
      UPDATE pwd_applications
      SET payout_date = $1, payout_time = $2, payout_venue = $3, status = 'PAYOUT SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $4;
    `, [payoutDate, `${startTime} - ${endTime}`, venue, referenceNo]);

    await pool.query(`
      UPDATE livelihood_applications
      SET payout_date = $1, payout_time = $2, payout_venue = $3, status = 'PAYOUT SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $4;
    `, [payoutDate, `${startTime} - ${endTime}`, venue, referenceNo]);

    await pool.query(`
      UPDATE aics_applications
      SET scheduled_payout_date = $1, scheduled_payout_time = $2, status = 'PAYOUT SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $3;
    `, [payoutDate, `${startTime} - ${endTime}`, referenceNo]);

    // Send automated Financial Payout confirmation email to applicant
    try {
      const disbRow = result.rows[0];
      if (disbRow) {
        const emailQuery = `
          SELECT email_address as email FROM solo_parent_applications WHERE reference_no = $1
          UNION ALL
          SELECT email_address as email FROM educational_applications WHERE reference_no = $1
          UNION ALL
          SELECT email_address as email FROM senior_applications WHERE reference_no = $1
          UNION ALL
          SELECT email_address as email FROM livelihood_applications WHERE reference_no = $1
          UNION ALL
          SELECT email_address as email FROM aics_applications WHERE reference_no = $1
          LIMIT 1;
        `;
        const emailCheck = await pool.query(emailQuery, [referenceNo]);
        const recipientEmail = emailCheck.rows[0]?.email;
        if (recipientEmail) {
          sendNotificationEmail({
            to: recipientEmail,
            subject: `GovServe Notice: Financial Aid Payout Scheduled (${referenceNo})`,
            title: 'Financial Aid Payout Scheduled!',
            applicantName: disbRow.applicant_name,
            refNo: referenceNo,
            status: 'PAYOUT SCHEDULED',
            detailsMessage: `Naitakda na ang release ng inyong tulong-pinansyal (${disbRow.benefit_name || 'Financial Assistance'}) na nagkakahalaga ng ₱${Number(disbRow.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}.`,
            appointmentInfo: `Petsa: ${payoutDate} | Oras: ${startTime} - ${endTime} | Lugar: ${venue || 'Quezon City SSDD Office'}`
          });
        }
      }
    } catch (payoutErr) {
      console.warn('Payout notification email warning:', payoutErr.message);
    }

    res.json(result.rows[0] || { success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all Educational Assistance applications from PostgreSQL DB
app.get('/api/educational/applications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM educational_applications ORDER BY date_submitted DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit new Educational Assistance application to PostgreSQL DB
app.post('/api/educational/applications', async (req, res) => {
  const { 
    referenceNo, 
    applicantName, 
    firstName,
    middleName,
    lastName,
    suffix,
    nationality,
    dob,
    age,
    gender,
    civilStatus,
    houseNo,
    streetName,
    barangay,
    phoneNumber,
    emailAddress,
    soloParentIdNo,
    relationshipToChild,
    childFullName,
    childDob,
    childAge,
    childSex,
    schoolName,
    gradeLevel,
    lrnNumber,
    typeOfSchool,
    otherEnrollmentInfo,
    numChildrenInFamily,
    numChildrenStudying,
    monthlyFamilyIncome,
    is4psBeneficiary,
    isSoloEducationalBeneficiary,
    isPwdEducationalBeneficiary,
    uploadedDocuments,
    status,
    details
  } = req.body;

  try {
    const refNo = referenceNo || `QC-EDU-${Math.floor(100000 + Math.random() * 900000)}`;
    const name = applicantName || details?.applicantName || `${firstName || 'JEFFERSON'} ${lastName || 'LEE'}`.trim();
    const savedDetails = JSON.stringify(details || {});
    const savedDocs = JSON.stringify(uploadedDocuments || {});

    const query = `
      INSERT INTO educational_applications (
        reference_no, applicant_name, first_name, middle_name, last_name, suffix, nationality, dob, age, gender, civil_status,
        house_no, street_name, barangay, phone_number, email_address, solo_parent_id_no, relationship_to_child,
        child_full_name, child_dob, child_age, child_sex, school_name, grade_level, lrn_number, type_of_school, other_enrollment_info,
        num_children_in_family, num_children_studying, monthly_family_income, is_4ps_beneficiary, is_solo_educational_beneficiary, is_pwd_educational_beneficiary,
        status, uploaded_documents, details
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32, $33,
        $34, $35, $36
      )
      ON CONFLICT (reference_no) DO UPDATE SET
        applicant_name = EXCLUDED.applicant_name,
        status = EXCLUDED.status,
        uploaded_documents = EXCLUDED.uploaded_documents,
        details = EXCLUDED.details,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      refNo, name, firstName || 'JEFFERSON', middleName || 'FERNANDO', lastName || 'LEE', suffix || '', nationality || 'FILIPINO',
      dob || '2004-09-27', age || '22', gender || 'Male', civilStatus || 'Solo Parent',
      houseNo || '176', streetName || '23', barangay || 'Bagong Silangan', phoneNumber || '09155582122', emailAddress || 'jeffersonlee1234@gmail.com',
      soloParentIdNo || 'SP-23123', relationshipToChild || 'Parent',
      childFullName || '', childDob || '', childAge || '', childSex || '', schoolName || '', gradeLevel || '', lrnNumber || '', typeOfSchool || '', otherEnrollmentInfo || '',
      numChildrenInFamily || '', numChildrenStudying || '', monthlyFamilyIncome || '', is4psBeneficiary || 'No', isSoloEducationalBeneficiary || 'Yes', isPwdEducationalBeneficiary || 'No',
      status || 'Pending Document Validation', savedDocs, savedDetails
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    if (refNo.startsWith('QC-EDU')) {
      pool.query(`
        INSERT INTO child_welfare_applications (
          reference_no, applicant_name, first_name, middle_name, last_name, suffix, qcitizen_id, nationality, dob, age, gender, civil_status,
          house_no, street_name, barangay, phone_number, email_address, solo_parent_id_no, relationship_to_child,
          child_full_name, child_dob, child_age, child_sex, school_name, grade_level, lrn_number, type_of_school, other_enrollment_info,
          num_children_in_family, num_children_studying, monthly_family_income, is_4ps_beneficiary, is_solo_educational_beneficiary, is_pwd_educational_beneficiary,
          service_name, category, amount, status, uploaded_documents, details
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33, $34,
          $35, $36, $37, $38, $39, $40
        ) ON CONFLICT (reference_no) DO UPDATE SET
          status = EXCLUDED.status,
          uploaded_documents = EXCLUDED.uploaded_documents,
          details = EXCLUDED.details,
          updated_at = CURRENT_TIMESTAMP;
      `, [
        refNo, name, firstName || 'JEFFERSON', middleName || 'FERNANDO', lastName || 'LEE', suffix || '', soloParentIdNo || '110008262304143', nationality || 'FILIPINO', dob || '2004-09-27', age || '22', gender || 'Male', civilStatus || 'Single',
        houseNo || '176', streetName || '23', barangay || 'Bagong Silangan', phoneNumber || '09155582122', emailAddress || 'jeffersonlee1234@gmail.com', soloParentIdNo || '', relationshipToChild || 'Parent',
        childFullName || '', childDob || '', childAge || '', childSex || '', schoolName || '', gradeLevel || '', lrnNumber || '', typeOfSchool || '', otherEnrollmentInfo || '',
        numChildrenInFamily || '', numChildrenStudying || '', monthlyFamilyIncome || '', is4psBeneficiary || 'No', isSoloEducationalBeneficiary || 'No', isPwdEducationalBeneficiary || 'No',
        'Educational Assistance for Indigent Children & Youth', 'childwelfare', 5000.00, status || 'Pending Document Validation', savedDocs, savedDetails
      ]).catch(err => console.warn('Child Welfare sync warning:', err));
    }

    sendNotificationEmail({
      to: emailAddress || 'clarencemillares15@gmail.com',
      subject: `GovServe Notice: Educational Assistance Application Received (${row.reference_no})`,
      title: `Educational Assistance Application Submitted!`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: row.status || 'Pending Document Validation',
      detailsMessage: `Natanggap ang inyong Solo Parent Educational Assistance application for ${row.child_full_name || 'beneficiary'}. Sinusuri ng Admin ang submitted documents.`
    });

    res.status(201).json(row);
  } catch (err) {
    console.error('Error saving Educational Assistance application:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update status/scheduling of an Educational Assistance application
app.put('/api/educational/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    disapprovalReason, 
    appointmentDate, 
    appointmentTime, 
    appointmentVenue, 
    payoutDate, 
    payoutTime, 
    payoutVenue 
  } = req.body;

  try {
    const query = `
      UPDATE educational_applications 
      SET 
        status = COALESCE($1, status),
        disapproval_reason = COALESCE($2, disapproval_reason),
        appointment_date = COALESCE($3, appointment_date),
        appointment_time = COALESCE($4, appointment_time),
        appointment_venue = COALESCE($5, appointment_venue),
        payout_date = COALESCE($6, payout_date),
        payout_time = COALESCE($7, payout_time),
        payout_venue = COALESCE($8, payout_venue),
        updated_at = CURRENT_TIMESTAMP
      WHERE id::text = $9 OR reference_no = $9
      RETURNING *;
    `;
    const result = await pool.query(query, [
      status, disapprovalReason, appointmentDate, appointmentTime, appointmentVenue,
      payoutDate, payoutTime, payoutVenue, id
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Educational application not found' });
    }
    const row = result.rows[0];

    // Also sync payout fields and status to child_welfare_applications if reference matches
    await pool.query(`
      UPDATE child_welfare_applications 
      SET 
        status = COALESCE($1, status),
        payout_date = COALESCE($2, payout_date),
        payout_time = COALESCE($3, payout_time),
        payout_venue = COALESCE($4, payout_venue),
        updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $5;
    `, [status, payoutDate || null, payoutTime || null, payoutVenue || null, row.reference_no]).catch(() => null);

    // Sync to appointments table when approved / scheduled
    if (status === 'APPROVED BY ADMIN' || status === 'APPROVED' || (status || '').includes('Approved') || (status || '').includes('APPROVED') || appointmentDate) {
      const apptStatus = appointmentDate ? 'Interview Scheduled' : 'Pending Schedule';
      try {
        const checkAppt = await pool.query(`SELECT id FROM appointments WHERE reference_no = $1`, [row.reference_no]);
        if (checkAppt.rows.length > 0) {
          await pool.query(`
            UPDATE appointments 
            SET 
              appointment_date = COALESCE($1, appointment_date),
              appointment_time = COALESCE($2, appointment_time),
              venue = COALESCE($3, venue),
              status = $4
            WHERE reference_no = $5;
          `, [appointmentDate || null, appointmentTime || null, appointmentVenue || null, apptStatus, row.reference_no]);
        } else {
          await pool.query(`
            INSERT INTO appointments (reference_no, module_name, applicant_name, appointment_date, appointment_time, venue, purpose, status)
            VALUES ($1, 'EDUCATIONAL', $2, $3, $4, COALESCE($5, 'Quezon City Hall SSDD Office'), 'Educational Assistance SSDD Assessment & Intake Interview', $6);
          `, [row.reference_no, row.applicant_name, appointmentDate || null, appointmentTime || null, appointmentVenue || null, apptStatus]);
        }
      } catch (e) {
        console.warn('Sync appointments warning for Educational:', e.message);
      }
    }

    // If status becomes "APPROVED", "Approved & Ready for Payout", "Payout Scheduled", or "RELEASED", sync to financial_disbursements
    if (
      status === 'APPROVED' || 
      status === 'APPROVED BY ADMIN' || 
      status === 'Payout Scheduled' || 
      status === 'PAYOUT SCHEDULED' ||
      status === 'RELEASED / COMPLETED' ||
      status === 'Released & Archived' ||
      (status || '').includes('Ready for Payout') ||
      (status || '').includes('Approved')
    ) {
      const finStatus = (status === 'RELEASED / COMPLETED' || status === 'Released & Archived')
        ? 'RELEASED / COMPLETED'
        : (status === 'Payout Scheduled' || status === 'PAYOUT SCHEDULED')
        ? 'PAYOUT SCHEDULED'
        : 'PENDING PAYOUT SCHEDULE';
      const checkFin = await pool.query(`SELECT id FROM financial_disbursements WHERE reference_no = $1`, [row.reference_no]);
      if (checkFin.rows.length > 0) {
        await pool.query(`
          UPDATE financial_disbursements 
          SET 
            payout_date = COALESCE($1, payout_date),
            payout_start_time = COALESCE($2, payout_start_time),
            venue = COALESCE($3, venue),
            status = $4,
            updated_at = CURRENT_TIMESTAMP
          WHERE reference_no = $5;
        `, [payoutDate || row.payout_date || null, payoutTime || row.payout_time || null, payoutVenue || row.payout_venue || null, finStatus, row.reference_no]);
      } else {
        const benefitName = (row.reference_no || '').startsWith('QC-SP-EDU')
          ? 'Solo Parent Educational Assistance Program'
          : 'Educational Assistance for Indigent Children & Youth';
        await pool.query(`
          INSERT INTO financial_disbursements (reference_no, applicant_name, module_name, benefit_name, amount, payout_date, payout_start_time, venue, status)
          VALUES ($1, $2, 'EDUCATIONAL', $3, 5000.00, $4, $5, $6, $7);
        `, [row.reference_no, row.applicant_name, benefitName, payoutDate || row.payout_date || null, payoutTime || row.payout_time || null, payoutVenue || row.payout_venue || null, finStatus]);
      }
    }

    sendNotificationEmail({
      to: row.email_address || 'clarencemillares15@gmail.com',
      subject: `Educational Assistance Update (${row.reference_no}): ${row.status}`,
      title: `Educational Assistance Status: ${row.status}`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: row.status,
      detailsMessage: row.disapproval_reason ? `Disapproved ang request. Dahilan: ${row.disapproval_reason}` : `May update sa inyong Educational Assistance application. Current Status: ${row.status}`
    });

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all Livelihood Assistance applications from PostgreSQL DB
app.get('/api/livelihood/applications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM livelihood_applications ORDER BY date_submitted DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit new Livelihood Assistance application to PostgreSQL DB
app.post('/api/livelihood/applications', async (req, res) => {
  const {
    referenceNo,
    applicantName,
    firstName,
    middleName,
    lastName,
    suffix,
    nationality,
    dob,
    age,
    gender,
    civilStatus,
    bloodType,
    houseNo,
    streetName,
    barangay,
    phoneNumber,
    emailAddress,
    sector,
    employmentStatus,
    hasExistingBusiness,
    typeOfBusiness,
    specifiedOtherBusiness,
    assistanceType,
    reasonForAssistance,
    requestedMaterialsItems,
    uploadedDocuments,
    details,
    amount
  } = req.body;

  try {
    const query = `
      INSERT INTO livelihood_applications (
        reference_no, applicant_name, program_name, first_name, middle_name, last_name, suffix, nationality,
        dob, age, gender, civil_status, blood_type, house_no, street_name, barangay, phone_number,
        email_address, sector, employment_status, has_existing_business, type_of_business,
        specified_other_business, assistance_type, reason_for_assistance, requested_materials_items,
        uploaded_documents, details, amount, service_name, category, status
      ) VALUES (
        $1, $2, 'Livelihood Assistance Program', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27, COALESCE($28, 15000.00), 'Livelihood Capital Assistance Grant', 'livelihood', 'Pending Document Validation'
      )
      ON CONFLICT (reference_no) DO UPDATE SET
        applicant_name = EXCLUDED.applicant_name,
        sector = EXCLUDED.sector,
        employment_status = EXCLUDED.employment_status,
        has_existing_business = EXCLUDED.has_existing_business,
        type_of_business = EXCLUDED.type_of_business,
        specified_other_business = EXCLUDED.specified_other_business,
        assistance_type = EXCLUDED.assistance_type,
        reason_for_assistance = EXCLUDED.reason_for_assistance,
        requested_materials_items = EXCLUDED.requested_materials_items,
        uploaded_documents = EXCLUDED.uploaded_documents,
        details = EXCLUDED.details,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [
      referenceNo || `LVH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      applicantName || `${firstName || ''} ${lastName || ''}`.trim() || 'Applicant',
      firstName, middleName, lastName, suffix, nationality || 'FILIPINO',
      dob, age, gender, civilStatus, bloodType, houseNo, streetName, barangay, phoneNumber,
      emailAddress, sector, employmentStatus, hasExistingBusiness, typeOfBusiness,
      specifiedOtherBusiness, assistanceType, reasonForAssistance,
      requestedMaterialsItems ? JSON.stringify(requestedMaterialsItems) : null,
      uploadedDocuments ? JSON.stringify(uploadedDocuments) : null,
      details ? JSON.stringify(details) : null,
      amount || 15000.00
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    sendNotificationEmail({
      to: emailAddress || 'clarencemillares15@gmail.com',
      subject: `GovServe Notice: Livelihood Application Received (${row.reference_no})`,
      title: `Livelihood Application Received!`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: 'Pending Document Validation',
      detailsMessage: `Natanggap ang inyong Livelihood Program Assistance form. Sinusuri na ng SSDD Admin ang inyong requirements.`
    });

    res.status(201).json(row);
  } catch (err) {
    console.error('Error saving Livelihood application:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update status/scheduling of a Livelihood application
app.put('/api/livelihood/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    disapprovalReason, 
    appointmentDate, 
    appointmentTime, 
    appointmentVenue, 
    payoutDate, 
    payoutTime, 
    payoutVenue 
  } = req.body;

  try {
    const query = `
      UPDATE livelihood_applications 
      SET 
        status = COALESCE($1, status),
        disapproval_reason = COALESCE($2, disapproval_reason),
        appointment_date = COALESCE($3, appointment_date),
        appointment_time = COALESCE($4, appointment_time),
        appointment_venue = COALESCE($5, appointment_venue),
        payout_date = COALESCE($6, payout_date),
        payout_time = COALESCE($7, payout_time),
        payout_venue = COALESCE($8, payout_venue),
        updated_at = CURRENT_TIMESTAMP
      WHERE id::text = $9 OR reference_no = $9
      RETURNING *;
    `;
    const result = await pool.query(query, [
      status, disapprovalReason, appointmentDate, appointmentTime, appointmentVenue,
      payoutDate, payoutTime, payoutVenue, id
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Livelihood application not found' });
    }
    const row = result.rows[0];

    // Sync with appointments table
    if (status === 'APPROVED BY ADMIN' || status === 'INTERVIEW SCHEDULED' || status === 'SITE ASSESSMENT SCHEDULED' || appointmentDate) {
      const apptStatus = appointmentDate || status.includes('SCHEDULED') ? 'Interview Scheduled' : 'Pending Schedule';
      try {
        const checkAppt = await pool.query(`SELECT id FROM appointments WHERE reference_no = $1`, [row.reference_no]);
        if (checkAppt.rows.length > 0) {
          await pool.query(`
            UPDATE appointments 
            SET 
              appointment_date = COALESCE($1, appointment_date),
              appointment_time = COALESCE($2, appointment_time),
              venue = COALESCE($3, venue),
              status = $4
            WHERE reference_no = $5;
          `, [appointmentDate || null, appointmentTime || null, appointmentVenue || null, apptStatus, row.reference_no]);
        } else {
          await pool.query(`
            INSERT INTO appointments (reference_no, module_name, applicant_name, appointment_date, appointment_time, venue, purpose, status)
            VALUES ($1, 'LIVELIHOOD', $2, $3, $4, COALESCE($5, 'Quezon City Hall SSDD Office'), 'Livelihood Assessment & Site Inspection Interview', $6);
          `, [row.reference_no, row.applicant_name, appointmentDate || null, appointmentTime || null, appointmentVenue || null, apptStatus]);
        }
      } catch (e) {
        console.warn('Sync appointments warning:', e.message);
      }
    }

    // Sync with financial_disbursements table
    if (status === 'APPROVED' || status === 'APPROVED FOR LIVELIHOOD GRANT' || status === 'Payout Scheduled' || status === 'PAYOUT SCHEDULED') {
      const finStatus = (status === 'Payout Scheduled' || status === 'PAYOUT SCHEDULED') ? 'PAYOUT SCHEDULED' : 'PENDING PAYOUT SCHEDULE';
      try {
        const checkFin = await pool.query(`SELECT id FROM financial_disbursements WHERE reference_no = $1`, [row.reference_no]);
        if (checkFin.rows.length > 0) {
          await pool.query(`
            UPDATE financial_disbursements 
            SET 
              payout_date = COALESCE($1, payout_date),
              payout_start_time = COALESCE($2, payout_start_time),
              venue = COALESCE($3, venue),
              status = $4,
              updated_at = CURRENT_TIMESTAMP
            WHERE reference_no = $5;
          `, [payoutDate || row.payout_date || null, payoutTime || row.payout_time || null, payoutVenue || row.payout_venue || null, finStatus, row.reference_no]);
        } else {
          await pool.query(`
            INSERT INTO financial_disbursements (reference_no, applicant_name, module_name, benefit_name, amount, payout_date, payout_start_time, venue, status)
            VALUES ($1, $2, 'LIVELIHOOD', '₱15,000 Livelihood Capital Assistance Grant', 15000.00, $3, $4, $5, $6);
          `, [row.reference_no, row.applicant_name, payoutDate || row.payout_date || null, payoutTime || row.payout_time || null, payoutVenue || row.payout_venue || null, finStatus]);
        }
      } catch (e) {
        console.warn('Sync financial_disbursements warning:', e.message);
      }
    }

    sendNotificationEmail({
      to: row.email_address || 'clarencemillares15@gmail.com',
      subject: `Livelihood Assistance Update (${row.reference_no}): ${row.status}`,
      title: `Livelihood Assistance Status: ${row.status}`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: row.status,
      detailsMessage: row.disapproval_reason ? `Disapproved ang request. Dahilan: ${row.disapproval_reason}` : `May update sa inyong Livelihood Assistance application. Current Status: ${row.status}`
    });

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Livelihood application from DB to allow re-applying
app.delete('/api/livelihood/applications/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM livelihood_applications WHERE reference_no = $1 OR id::text = $1 RETURNING *', [id]);
    await pool.query('DELETE FROM appointments WHERE reference_no = $1', [id]).catch(() => null);
    await pool.query('DELETE FROM financial_disbursements WHERE reference_no = $1', [id]).catch(() => null);
    res.json({ success: true, message: `Livelihood application ${id} deleted successfully.`, deletedCount: result.rowCount });
  } catch (err) {
    console.error('DELETE livelihood application error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE clear all Livelihood and Training program applications and their linked appointments
app.delete('/api/clear-livelihood-training', async (req, res) => {
  try {
    const livRes = await pool.query('DELETE FROM livelihood_applications RETURNING reference_no;');
    const trnRes = await pool.query('DELETE FROM training_applications RETURNING reference_no;');
    const apptRes = await pool.query(`
      DELETE FROM appointments 
      WHERE reference_no LIKE 'LVH-%' 
         OR reference_no LIKE 'TRN-%' 
         OR LOWER(module_name) LIKE '%livelihood%' 
         OR LOWER(module_name) LIKE '%training%'
      RETURNING reference_no;
    `).catch(() => ({ rowCount: 0 }));
    const disbRes = await pool.query(`
      DELETE FROM financial_disbursements 
      WHERE reference_no LIKE 'LVH-%' 
         OR reference_no LIKE 'TRN-%' 
         OR LOWER(module_name) LIKE '%livelihood%' 
         OR LOWER(module_name) LIKE '%training%'
      RETURNING reference_no;
    `).catch(() => ({ rowCount: 0 }));

    res.json({
      success: true,
      message: 'Successfully cleared Livelihood and Training program records.',
      livelihoodDeleted: livRes.rowCount,
      trainingDeleted: trnRes.rowCount,
      appointmentsDeleted: apptRes.rowCount,
      disbursementsDeleted: disbRes.rowCount
    });
  } catch (err) {
    console.error('Error clearing livelihood and training data:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all Skills Training Program applications from PostgreSQL DB
app.get('/api/training/applications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM training_applications ORDER BY date_submitted DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST submit new Skills Training Program application to PostgreSQL DB
app.post('/api/training/applications', async (req, res) => {
  const {
    referenceNo,
    courseTitle,
    batchName,
    applicantName,
    firstName,
    middleName,
    lastName,
    suffix,
    nationality,
    dob,
    age,
    gender,
    civilStatus,
    houseNo,
    streetName,
    barangay,
    phoneNumber,
    emailAddress,
    highestEdu,
    schoolName,
    trainingPurpose,
    purposeReason,
    previousTraining,
    docRequestLetter,
    docQcId,
    docIndigency,
    uploadedDocuments,
    status,
    details
  } = req.body;

  try {
    const refNo = referenceNo || `TRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const name = applicantName || details?.applicantName || `${firstName || 'JEFFERSON'} ${lastName || 'LEE'}`.trim();
    const savedDetails = JSON.stringify(details || {});
    const savedDocs = JSON.stringify(uploadedDocuments || {
      docRequestLetter,
      docQcId,
      docIndigency
    });

    const query = `
      INSERT INTO training_applications (
        reference_no, course_title, batch_name, applicant_name, first_name, middle_name, last_name, suffix,
        nationality, dob, age, gender, civil_status, house_no, street_name, barangay, phone_number,
        highest_edu, school_name, training_purpose, purpose_reason, previous_training,
        doc_request_letter, doc_qc_id, doc_indigency, status, uploaded_documents, details
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22,
        $23, $24, $25, COALESCE($26, 'Pending Document Validation'), $27, $28
      )
      ON CONFLICT (reference_no) DO UPDATE SET
        course_title = EXCLUDED.course_title,
        batch_name = EXCLUDED.batch_name,
        applicant_name = EXCLUDED.applicant_name,
        highest_edu = EXCLUDED.highest_edu,
        school_name = EXCLUDED.school_name,
        training_purpose = EXCLUDED.training_purpose,
        purpose_reason = EXCLUDED.purpose_reason,
        previous_training = EXCLUDED.previous_training,
        doc_request_letter = EXCLUDED.doc_request_letter,
        doc_qc_id = EXCLUDED.doc_qc_id,
        doc_indigency = EXCLUDED.doc_indigency,
        uploaded_documents = EXCLUDED.uploaded_documents,
        details = EXCLUDED.details,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      refNo,
      courseTitle || 'Bread and Pastry Making',
      batchName || '3rd Batch 2026',
      name,
      firstName || 'JEFFERSON',
      middleName || 'FERNANDO',
      lastName || 'LEE',
      suffix || '',
      nationality || 'FILIPINO',
      dob || '27/09/2004',
      age || '22',
      gender || 'Male',
      civilStatus || 'Single',
      houseNo || '176',
      streetName || '23',
      barangay || 'Bagong Silangan',
      phoneNumber || '09155582122',
      highestEdu || 'College Level',
      schoolName || '',
      trainingPurpose || 'Employment / Job Application',
      purposeReason || '',
      previousTraining || 'Yes - TESDA Accredited Course',
      typeof docRequestLetter === 'string' ? docRequestLetter : JSON.stringify(docRequestLetter || {}),
      typeof docQcId === 'string' ? docQcId : JSON.stringify(docQcId || {}),
      typeof docIndigency === 'string' ? docIndigency : JSON.stringify(docIndigency || {}),
      status || 'Pending Document Validation',
      savedDocs,
      savedDetails
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    sendNotificationEmail({
      to: emailAddress || 'clarencemillares15@gmail.com',
      subject: `GovServe Notice: Training Application Received (${row.reference_no})`,
      title: `Training Application Submitted!`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: row.status || 'Pending Document Validation',
      detailsMessage: `Natanggap ang inyong Training Application Form para sa ${row.course_title}. Sinusuri ng Admin ang Barangay Clearance, Valid ID, at Qualification Form.`
    });

    res.status(201).json(row);
  } catch (err) {
    console.error('Error saving Training application:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update status/scheduling of a Training application
app.put('/api/training/applications/:id/status', async (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    rejectionReason,
    disapprovalReason, 
    appointmentDate, 
    appointmentTime, 
    appointmentVenue,
    orientationDate,
    orientationTime,
    orientationVenue
  } = req.body;

  const apptDate = orientationDate || appointmentDate;
  const apptTime = orientationTime || appointmentTime;
  const apptVenue = orientationVenue || appointmentVenue;
  const reason = rejectionReason || disapprovalReason;

  try {
    const query = `
      UPDATE training_applications 
      SET 
        status = COALESCE($1, status),
        rejection_reason = COALESCE($2, rejection_reason),
        orientation_date = COALESCE($3, orientation_date),
        orientation_time = COALESCE($4, orientation_time),
        orientation_venue = COALESCE($5, orientation_venue),
        updated_at = CURRENT_TIMESTAMP
      WHERE id::text = $6 OR reference_no = $6
      RETURNING *;
    `;
    const result = await pool.query(query, [
      status, reason, apptDate, apptTime, apptVenue, id
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Training application not found' });
    }
    const row = result.rows[0];

    // Sync with appointments table
    if (status === 'APPROVED BY ADMIN' || status === 'SSDD VALIDATED' || status === 'TRAINING SCHEDULED / ORIENTATION APPOINTED' || apptDate) {
      const apptStatus = apptDate || status.includes('SCHEDULED') ? 'Orientation Scheduled' : 'Pending Schedule';
      try {
        const checkAppt = await pool.query(`SELECT id FROM appointments WHERE reference_no = $1`, [row.reference_no]);
        if (checkAppt.rows.length > 0) {
          await pool.query(`
            UPDATE appointments 
            SET 
              appointment_date = COALESCE($1, appointment_date),
              appointment_time = COALESCE($2, appointment_time),
              venue = COALESCE($3, venue),
              status = $4
            WHERE reference_no = $5;
          `, [apptDate || null, apptTime || null, apptVenue || null, apptStatus, row.reference_no]);
        } else {
          await pool.query(`
            INSERT INTO appointments (reference_no, module_name, applicant_name, appointment_date, appointment_time, venue, purpose, status)
            VALUES ($1, 'TRAINING', $2, $3, $4, COALESCE($5, 'Quezon City SSDD Training Center'), 'Skills Training Orientation & Initial Screening', $6);
          `, [row.reference_no, row.applicant_name, apptDate || null, apptTime || null, apptVenue || null, apptStatus]);
        }
      } catch (e) {
        console.warn('Sync training appointments warning:', e.message);
      }
    }

    sendNotificationEmail({
      to: 'clarencemillares15@gmail.com',
      subject: `Training Application Update (${row.reference_no}): ${row.status}`,
      title: `Training Application Status: ${row.status}`,
      applicantName: row.applicant_name,
      refNo: row.reference_no,
      status: row.status,
      detailsMessage: row.rejection_reason ? `Disapproved ang aplikasyon. Dahilan: ${row.rejection_reason}` : `May update sa inyong Training Application para sa ${row.course_title}. Current Status: ${row.status}`
    });

    res.json(row);
  } catch (err) {
    console.error('PUT training status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE Training application from DB to allow re-applying
app.delete('/api/training/applications/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM training_applications WHERE reference_no = $1 OR id::text = $1 RETURNING *', [id]);
    await pool.query('DELETE FROM appointments WHERE reference_no = $1', [id]).catch(() => null);
    res.json({ success: true, message: `Training application ${id} deleted successfully.`, deletedCount: result.rowCount });
  } catch (err) {
    console.error('DELETE training application error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET all appointments from PostgreSQL DB
app.get('/api/appointments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM appointments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST schedule new appointment in PostgreSQL DB
app.post('/api/appointments', async (req, res) => {
  const { 
    referenceNo, 
    moduleName, 
    applicantName, 
    appointmentDate, 
    appointmentTime, 
    venue, 
    purpose, 
    socialWorkerNotes 
  } = req.body;

  try {
    const checkAppt = await pool.query(`SELECT id FROM appointments WHERE reference_no = $1`, [referenceNo]);
    let result;
    if (checkAppt.rows.length > 0) {
      result = await pool.query(`
        UPDATE appointments 
        SET 
          appointment_date = COALESCE($1, appointment_date),
          appointment_time = COALESCE($2, appointment_time),
          venue = COALESCE($3, venue),
          purpose = COALESCE($4, purpose),
          status = 'Interview Scheduled',
          social_worker_notes = COALESCE($5, social_worker_notes)
        WHERE reference_no = $6
        RETURNING *;
      `, [appointmentDate, appointmentTime, venue, purpose, socialWorkerNotes, referenceNo]);
    } else {
      result = await pool.query(`
        INSERT INTO appointments 
        (reference_no, module_name, applicant_name, appointment_date, appointment_time, venue, purpose, social_worker_notes, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Interview Scheduled')
        RETURNING *;
      `, [
        referenceNo,
        moduleName || 'SOLO PARENT',
        applicantName || 'Applicant Name',
        appointmentDate,
        appointmentTime,
        venue || 'Quezon City Hall SSDD Office',
        purpose || 'Solo Parent SSDD Assessment & Intake Interview',
        socialWorkerNotes || 'Schedule set by Admin'
      ]);
    }
    const row = result.rows[0];

    // Sync status & date to solo_parent_applications
    await pool.query(`
      UPDATE solo_parent_applications 
      SET appointment_date = $1, appointment_time = $2, appointment_venue = $3, status = 'INTERVIEW SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $4;
    `, [appointmentDate, appointmentTime, venue, referenceNo]);

    // Sync to training_applications
    await pool.query(`
      UPDATE training_applications 
      SET orientation_date = $1, orientation_time = $2, orientation_venue = COALESCE($3, 'Quezon City Skills Development Center'), status = 'TRAINING SCHEDULED / ORIENTATION APPOINTED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $4;
    `, [appointmentDate, appointmentTime, venue, referenceNo]);

    // Sync to livelihood_applications
    await pool.query(`
      UPDATE livelihood_applications 
      SET appointment_date = $1, appointment_time = $2, appointment_venue = $3, status = 'SITE ASSESSMENT SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $4;
    `, [appointmentDate, appointmentTime, venue, referenceNo]);

    // Sync to educational_applications
    await pool.query(`
      UPDATE educational_applications 
      SET appointment_date = $1, appointment_time = $2, appointment_venue = $3, status = 'INTERVIEW SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $4;
    `, [appointmentDate, appointmentTime, venue, referenceNo]);

    // Sync to senior_applications
    await pool.query(`
      UPDATE senior_applications 
      SET appointment_date = $1, appointment_time = $2, appointment_venue = $3, status = 'INTERVIEW SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $4;
    `, [appointmentDate, appointmentTime, venue, referenceNo]);

    // Sync to aics_applications
    await pool.query(`
      UPDATE aics_applications 
      SET appointment_date = $1, appointment_time = $2, status = 'INTERVIEW SCHEDULED', updated_at = CURRENT_TIMESTAMP
      WHERE reference_no = $3;
    `, [appointmentDate, appointmentTime, referenceNo]);

    sendNotificationEmail({
      to: 'clarencemillares15@gmail.com',
      subject: `GovServe Notice: Appointment Scheduled (${referenceNo})`,
      title: `Appointment / Orientation Scheduled!`,
      applicantName: row.applicant_name,
      refNo: referenceNo,
      status: 'SCHEDULED',
      detailsMessage: `Naitakda ang inyong appointment/orientation schedule sa ${venue || 'Quezon City SSDD Office'}.`,
      appointmentInfo: `Petsa: ${appointmentDate} | Oras: ${appointmentTime} | Lugar: ${venue || 'QC Hall SSDD Office'}`
    });

    res.status(201).json(row);
  } catch (err) {
    console.error('Error saving appointment:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT update status/decision of an appointment in PostgreSQL DB
app.put('/api/appointments/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, socialWorkerNotes } = req.body;

  try {
    const query = `
      UPDATE appointments 
      SET status = $1, social_worker_notes = COALESCE($2, social_worker_notes)
      WHERE id::text = $3 OR reference_no = $3
      RETURNING *;
    `;
    const result = await pool.query(query, [status, socialWorkerNotes, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    const row = result.rows[0];
    // Sync status to all module application tables
    const refNo = row.reference_no;
    const isApprovedStatus = 
      status === 'APPROVED' || 
      status === 'Approved' || 
      status === 'Released & Archived' || 
      status === 'RELEASED / COMPLETED' || 
      status === 'Ready for Payout' || 
      status === 'Passed / Completed' || 
      status === 'Qualified / Enrolled';

    const isRejectedStatus = status === 'REJECTED' || status === 'Rejected' || status === 'Unqualified';
    const isFinancialAidRef = 
      refNo.startsWith('QC-EDU') || 
      refNo.startsWith('QC-SP-EDU') || 
      refNo.startsWith('SP-') || 
      refNo.startsWith('QC-PWD') || 
      refNo.startsWith('PWD-') || 
      refNo.startsWith('SENIOR-') || 
      refNo.startsWith('LVH-');

    const targetStatus = isApprovedStatus 
      ? (status === 'Approved' || status === 'APPROVED' 
          ? (isFinancialAidRef ? 'Approved & Ready for Payout' : 'Released & Archived') 
          : status) 
      : status;

    if (isApprovedStatus || isRejectedStatus) {
      await pool.query(`UPDATE solo_parent_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE reference_no = $2;`, [targetStatus, refNo]).catch(() => null);
      await pool.query(`UPDATE child_welfare_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE reference_no = $2;`, [targetStatus, refNo]).catch(() => null);
      await pool.query(`UPDATE educational_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE reference_no = $2;`, [targetStatus, refNo]).catch(() => null);
      await pool.query(`UPDATE livelihood_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE reference_no = $2;`, [targetStatus, refNo]).catch(() => null);
      await pool.query(`UPDATE training_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE reference_no = $2;`, [targetStatus, refNo]).catch(() => null);
      await pool.query(`UPDATE senior_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE reference_no = $2;`, [targetStatus, refNo]).catch(() => null);
      await pool.query(`UPDATE aics_applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE reference_no = $2;`, [targetStatus, refNo]).catch(() => null);
    }

    if (isApprovedStatus) {
      await pool.query(`
        INSERT INTO financial_disbursements (reference_no, applicant_name, module_name, benefit_name, amount, status)
        VALUES ($1, $2, COALESCE($3, 'SOCIAL WELFARE'), 'Social Services Welfare Assistance', 5000.00, 'PENDING PAYOUT SCHEDULE')
        ON CONFLICT (reference_no) DO UPDATE SET status = 'PENDING PAYOUT SCHEDULE', updated_at = CURRENT_TIMESTAMP;
      `, [refNo, row.applicant_name, row.module_name]).catch(() => null);
    }

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE reset all test data in PostgreSQL DB
app.delete('/api/reset-data', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE aics_applications, appointments, pwd_applications, senior_applications, livelihood_applications, solo_parent_applications, educational_applications, financial_disbursements RESTART IDENTITY CASCADE;');
    res.json({ success: true, message: 'All database records successfully cleared.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory anti-spam IP tracking (protects against random/fake email spam)
const ipLockoutMap = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || '127.0.0.1';
}

async function parseDeviceInfo(userAgent = '', clientIp = '') {
  const ua = userAgent || '';
  let deviceType = 'desktop';
  let osName = 'Windows 11 PC';
  let browserName = 'Google Chrome';

  // 1. Tablet detection
  if (/iPad|iPadOS/i.test(ua)) {
    deviceType = 'tablet';
    osName = 'Apple iPad (iPadOS)';
  } else if (/SM-T|SM-X|Samsung.*Tab/i.test(ua)) {
    deviceType = 'tablet';
    osName = 'Samsung Galaxy Tab (Android)';
  } else if (/Pad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    deviceType = 'tablet';
    osName = /Xiaomi|Redmi/i.test(ua) ? 'Xiaomi Pad (Android)' : 'Android Tablet';
  }
  // 2. Mobile Phone detection
  else if (/iPhone/i.test(ua)) {
    deviceType = 'mobile';
    osName = 'Apple iPhone (iOS)';
  } else if (/Android.*Mobile|Mobile.*Android/i.test(ua)) {
    deviceType = 'mobile';
    if (/Xiaomi|Redmi|POCO/i.test(ua) || /\b(21|22|23|24)[0-9A-Z]{4,}/i.test(ua)) {
      osName = 'Xiaomi / Redmi (Android)';
    } else if (/OPPO|CPH|PHT|PGEM/i.test(ua)) {
      osName = 'OPPO (Android)';
    } else if (/Realme|RMX/i.test(ua)) {
      osName = 'Realme (Android)';
    } else if (/vivo|V20|V21|V22|V23|V24/i.test(ua)) {
      osName = 'Vivo (Android)';
    } else if (/Infinix|TECNO|itel/i.test(ua)) {
      osName = 'Infinix / Tecno (Android)';
    } else if (/SM-|SAMSUNG|GT-|SCH-/i.test(ua)) {
      osName = 'Samsung Galaxy (Android)';
    } else {
      osName = 'Samsung Galaxy (Android)';
    }
  }
  // 3. Desktop & Laptop detection
  else if (/Windows NT 10.0/i.test(ua)) {
    deviceType = 'desktop';
    osName = 'Windows 11 PC';
  } else if (/Windows NT 6.3|Windows NT 6.2|Windows NT 6.1/i.test(ua)) {
    deviceType = 'desktop';
    osName = 'Windows 10 PC';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceType = 'desktop';
    osName = 'MacBook Pro (macOS)';
  } else if (/Linux/i.test(ua)) {
    deviceType = 'desktop';
    osName = 'Linux Desktop';
  }

  // Browser detection
  if (/Edg\//i.test(ua)) {
    browserName = 'Microsoft Edge';
  } else if (/OPR\/|Opera\//i.test(ua)) {
    browserName = 'Opera';
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browserName = deviceType === 'mobile' ? 'Chrome Mobile' : 'Google Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browserName = (deviceType === 'mobile' || deviceType === 'tablet') ? 'Mobile Safari' : 'Safari';
  } else if (/Firefox\//i.test(ua)) {
    browserName = 'Mozilla Firefox';
  }

  // 4. Dynamic Real-World Location via fast Geo-IP lookup
  let location = 'Quezon City, PH';
  const cleanIp = (clientIp || '').trim();
  const isPrivateOrLocal = !cleanIp || 
    cleanIp === '127.0.0.1' || 
    cleanIp === '::1' || 
    cleanIp.startsWith('10.') || 
    cleanIp.startsWith('192.168.') || 
    cleanIp.startsWith('172.');

  if (!isPrivateOrLocal) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const geoRes = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,city,regionName,countryCode`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.status === 'success') {
          // If the ISP gateway reports San Juan (the major PLDT Metro Manila hub for QC/North lines),
          // resolve it accurately to Quezon City, PH
          if (geoData.city === 'San Juan' || geoData.city === 'Mandaluyong') {
            location = 'Quezon City, PH';
          } else if (geoData.city) {
            location = `${geoData.city}, ${geoData.countryCode || 'PH'}`;
          }
        }
      }
    } catch (geoErr) {
      location = 'Quezon City, PH';
    }
  }

  return { deviceType, osName, browserName, location };
}

// GET /api/auth/check-email - Check if user account exists (prevents random/unregistered emails)
app.get('/api/auth/check-email', async (req, res) => {
  const { email } = req.query;
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, exists: false, message: 'Email query parameter is required.' });
  }

  try {
    let cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin@quezoncity.gov.ph') {
      cleanEmail = 'admin@gmail.com';
    }

    const result = await pool.query('SELECT id, email, first_name FROM users WHERE LOWER(email) = $1 LIMIT 1;', [cleanEmail]);
    if (result.rows.length > 0) {
      return res.json({ success: true, exists: true });
    } else {
      return res.json({ success: true, exists: false, message: 'This email address is not registered in GovServe.' });
    }
  } catch (err) {
    console.error('Check email error:', err);
    res.status(500).json({ success: false, exists: false, message: err.message });
  }
});

// GET /api/auth/lockout-status - Check if account or IP is currently locked
app.get('/api/auth/lockout-status', async (req, res) => {
  const { email } = req.query;
  const clientIp = getClientIp(req);
  const now = new Date();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const isDifferentDay = (d1, d2) => d1.getFullYear() !== d2.getFullYear() || d1.getMonth() !== d2.getMonth() || d1.getDate() !== d2.getDate();

  // Check IP-based lockout first (protects against random email spam)
  const ipData = ipLockoutMap.get(clientIp);
  if (ipData) {
    if (ipData.lastAttempt && (isDifferentDay(now, new Date(ipData.lastAttempt)) || now.getTime() - new Date(ipData.lastAttempt).getTime() >= TWENTY_FOUR_HOURS_MS)) {
      if (!ipData.lockoutUntil || ipData.lockoutUntil <= now) {
        ipLockoutMap.delete(clientIp);
      }
    }
  }

  const activeIpData = ipLockoutMap.get(clientIp);
  if (activeIpData && activeIpData.lockoutUntil && activeIpData.lockoutUntil > now) {
    const remainingSeconds = Math.ceil((activeIpData.lockoutUntil.getTime() - now.getTime()) / 1000);
    return res.json({
      isLocked: true,
      lockoutStage: activeIpData.stage || 1,
      lockoutUntil: activeIpData.lockoutUntil.toISOString(),
      remainingSeconds,
      message: activeIpData.stage >= 4
        ? 'Maximum login attempts exceeded. Access is locked for 24 hours calculated from the exact time this account was locked.'
        : 'Too many failed login attempts. Please wait for the lockout timer to expire.'
    });
  }

  if (!email) return res.json({ isLocked: false });

  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query('SELECT id, failed_login_attempts, lockout_stage, lockout_until, last_failed_attempt FROM users WHERE LOWER(email) = $1;', [cleanEmail]);
    if (result.rows.length === 0) return res.json({ isLocked: false });

    const user = result.rows[0];

    // Daily reset check: If a new calendar day or 24 hours have elapsed since the last failed attempt and no active lockout, reset attempts to 0!
    if (user.last_failed_attempt && (isDifferentDay(now, new Date(user.last_failed_attempt)) || now.getTime() - new Date(user.last_failed_attempt).getTime() >= TWENTY_FOUR_HOURS_MS)) {
      if (!user.lockout_until || new Date(user.lockout_until) <= now) {
        await pool.query(
          'UPDATE users SET failed_login_attempts = 0, lockout_stage = 0, lockout_until = NULL, last_failed_attempt = NULL WHERE id = $1;',
          [user.id]
        );
        return res.json({ isLocked: false, remainingAttempts: 3 });
      }
    }

    if (user.lockout_until && new Date(user.lockout_until) > now) {
      const remainingSeconds = Math.ceil((new Date(user.lockout_until).getTime() - now.getTime()) / 1000);
      return res.json({
        isLocked: true,
        lockoutStage: user.lockout_stage || 1,
        lockoutUntil: user.lockout_until,
        remainingSeconds,
        message: user.lockout_stage >= 4
          ? 'Maximum login attempts exceeded. Access is locked for 24 hours calculated from the exact time this account was locked.'
          : 'Too many failed login attempts. Please wait for the lockout timer to expire.'
      });
    }
    res.json({ isLocked: false, remainingAttempts: Math.max(0, 3 - (user.failed_login_attempts || 0)) });
  } catch (err) {
    res.json({ isLocked: false });
  }
});

// POST /api/login - Authenticate user or admin with 4-Stage Progressive Lockout & Daily Reset
app.post('/api/login', async (req, res) => {
  const { email, password, client_location } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  const clientIp = getClientIp(req);
  const now = new Date();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const isDifferentDay = (d1, d2) => d1.getFullYear() !== d2.getFullYear() || d1.getMonth() !== d2.getMonth() || d1.getDate() !== d2.getDate();

  // 1. Check IP-based lockout (protects against random/fake email spam) with daily reset
  const rawIpData = ipLockoutMap.get(clientIp);
  if (rawIpData) {
    if (rawIpData.lastAttempt && (isDifferentDay(now, new Date(rawIpData.lastAttempt)) || now.getTime() - new Date(rawIpData.lastAttempt).getTime() >= TWENTY_FOUR_HOURS_MS)) {
      if (!rawIpData.lockoutUntil || rawIpData.lockoutUntil <= now) {
        ipLockoutMap.delete(clientIp);
      }
    }
  }

  const ipData = ipLockoutMap.get(clientIp);
  if (ipData && ipData.lockoutUntil && ipData.lockoutUntil > now) {
    const remainingSeconds = Math.ceil((ipData.lockoutUntil.getTime() - now.getTime()) / 1000);
    const stage = ipData.stage || 1;
    return res.status(403).json({
      success: false,
      isLocked: true,
      lockoutStage: stage,
      lockoutUntil: ipData.lockoutUntil.toISOString(),
      remainingSeconds,
      message: stage >= 4
        ? 'Maximum login attempts exceeded. Access is locked for 24 hours calculated from the exact time this account was locked.'
        : 'Too many failed login attempts. Please wait for the lockout timer to expire.'
    });
  }

  try {
    let cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin@quezoncity.gov.ph') {
      cleanEmail = 'admin@gmail.com';
    }

    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1;', [cleanEmail]);

    // Handle non-existent / random email spam
    if (result.rows.length === 0) {
      const currentIpData = ipLockoutMap.get(clientIp) || { attempts: 0, lockoutUntil: null, stage: 0, lastAttempt: null };

      if (currentIpData.lockoutUntil && currentIpData.lockoutUntil <= now) {
        currentIpData.attempts = 0;
      }
      if (currentIpData.lastAttempt && (isDifferentDay(now, new Date(currentIpData.lastAttempt)) || now.getTime() - new Date(currentIpData.lastAttempt).getTime() >= TWENTY_FOUR_HOURS_MS)) {
        currentIpData.attempts = 0;
        currentIpData.stage = 0;
      }

      const newAttempts = currentIpData.attempts + 1;

      if (newAttempts >= 3) {
        let nextStage = (currentIpData.stage || 0) + 1;
        if (nextStage > 4) nextStage = 4;

        let lockDurationMinutes = 1;
        if (nextStage === 2) lockDurationMinutes = 5;
        else if (nextStage === 3) lockDurationMinutes = 15;
        else if (nextStage >= 4) lockDurationMinutes = 24 * 60;

        const lockoutUntilDate = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
        ipLockoutMap.set(clientIp, {
          attempts: 3,
          stage: nextStage,
          lockoutUntil: lockoutUntilDate,
          lastAttempt: now
        });

        const remainingSeconds = lockDurationMinutes * 60;
        return res.status(403).json({
          success: false,
          isLocked: true,
          lockoutStage: nextStage,
          lockoutUntil: lockoutUntilDate.toISOString(),
          remainingSeconds,
          message: nextStage >= 4
            ? 'Maximum login attempts exceeded. Access is locked for 24 hours calculated from the exact time this account was locked.'
            : `Too many failed login attempts. Account locked for ${lockDurationMinutes} minute(s).`
        });
      } else {
        ipLockoutMap.set(clientIp, {
          attempts: newAttempts,
          stage: currentIpData.stage || 0,
          lockoutUntil: null,
          lastAttempt: now
        });

        const remainingAttempts = 3 - newAttempts;
        return res.status(401).json({
          success: false,
          isLocked: false,
          remainingAttempts,
          message: `Invalid email address or password. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
        });
      }
    }

    const user = result.rows[0];

    // 2. Check if user account is currently locked
    if (user.lockout_until && new Date(user.lockout_until) > now) {
      const remainingSeconds = Math.ceil((new Date(user.lockout_until).getTime() - now.getTime()) / 1000);
      const stage = user.lockout_stage || 1;
      return res.status(403).json({
        success: false,
        isLocked: true,
        lockoutStage: stage,
        lockoutUntil: user.lockout_until,
        remainingSeconds,
        message: stage >= 4
          ? 'Maximum login attempts exceeded. Access is locked for 24 hours calculated from the exact time this account was locked.'
          : 'Too many failed login attempts. Please wait for the lockout timer to expire.'
      });
    }

    // 3. Validate password
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (err) {
      isMatch = false;
    }

    if (!isMatch && password === user.password) {
      isMatch = true;
    }

    // 4. Handle successful login
    if (isMatch) {
      ipLockoutMap.delete(clientIp);

      await pool.query(
        'UPDATE users SET failed_login_attempts = 0, lockout_stage = 0, lockout_until = NULL, unlock_otp = NULL, unlock_otp_expires = NULL, last_failed_attempt = NULL, is_online = TRUE, last_active = CURRENT_TIMESTAMP WHERE id = $1;',
        [user.id]
      );

      // Generate unique session token and record in user_sessions
      const sessionToken = `sess_${crypto.randomUUID()}`;
      const userAgent = req.headers['user-agent'] || '';
      const { deviceType, osName, browserName, location } = await parseDeviceInfo(userAgent, clientIp);
      const finalLocation = (client_location && typeof client_location === 'string' && client_location.trim() !== '')
        ? client_location.trim()
        : location;

      try {
        // Clean up previous session for the same device/browser to prevent accumulating duplicate rows
        await pool.query(
          'DELETE FROM user_sessions WHERE LOWER(email) = $1 AND os_name = $2 AND browser_name = $3;',
          [cleanEmail, osName, browserName]
        );

        await pool.query(`
          INSERT INTO user_sessions (user_id, email, session_token, device_type, os_name, browser_name, ip_address, location, signed_in_at, last_active_at, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, TRUE);
        `, [
          user.user_id || `USR-${user.id}`,
          cleanEmail,
          sessionToken,
          deviceType,
          osName,
          browserName,
          clientIp || '120.28.144.151',
          finalLocation
        ]);
      } catch (sessErr) {
        console.warn('Notice recording user_session on login:', sessErr.message);
      }

      const { password: _, unlock_otp: __, unlock_otp_expires: ___, ...userData } = user;
      userData.is_online = true;
      userData.presence = 'Online';
      userData.session_token = sessionToken;
      return res.json({ success: true, user: userData, session_token: sessionToken });
    }

    // 5. Handle failed login attempt
    let currentStage = user.lockout_stage || 0;
    let currentAttempts = user.failed_login_attempts || 0;

    // Daily reset check: If a new calendar day or 24 hours have elapsed since the last failed attempt, reset back to 0!
    if (user.last_failed_attempt) {
      const timeSinceLastFailed = now.getTime() - new Date(user.last_failed_attempt).getTime();
      if (isDifferentDay(now, new Date(user.last_failed_attempt)) || timeSinceLastFailed >= TWENTY_FOUR_HOURS_MS) {
        currentAttempts = 0;
        currentStage = 0;
      }
    }

    // If a previous timed lockout has expired, reset failed attempts counter for this new round
    if (user.lockout_until && new Date(user.lockout_until) <= now) {
      currentAttempts = 0;
    }

    const newAttempts = currentAttempts + 1;

    if (newAttempts >= 3) {
      // 3 attempts reached in this stage -> Trigger next lockout tier
      let nextStage = currentStage + 1;
      if (nextStage > 4) nextStage = 4;

      let lockDurationMinutes = 1; // Stage 1 default: 1 min
      if (nextStage === 2) lockDurationMinutes = 5;       // Stage 2: 5 mins
      else if (nextStage === 3) lockDurationMinutes = 15; // Stage 3: 15 mins
      else if (nextStage >= 4) lockDurationMinutes = 24 * 60; // Stage 4: 24 hours (1440 mins)

      const lockoutUntilDate = new Date(Date.now() + lockDurationMinutes * 60 * 1000);

      await pool.query(
        'UPDATE users SET failed_login_attempts = 3, lockout_stage = $1, lockout_until = $2, last_failed_attempt = CURRENT_TIMESTAMP WHERE id = $3;',
        [nextStage, lockoutUntilDate, user.id]
      );

      const remainingSeconds = lockDurationMinutes * 60;

      return res.status(403).json({
        success: false,
        isLocked: true,
        lockoutStage: nextStage,
        lockoutUntil: lockoutUntilDate.toISOString(),
        remainingSeconds,
        message: nextStage >= 4
          ? 'Maximum login attempts exceeded. Access is locked for 24 hours calculated from the exact time this account was locked.'
          : `Too many failed login attempts. Account locked for ${lockDurationMinutes} minute(s).`
      });
    } else {
      // Still has attempts left (Attempt 1 or 2 of 3)
      await pool.query(
        'UPDATE users SET failed_login_attempts = $1, last_failed_attempt = CURRENT_TIMESTAMP WHERE id = $2;',
        [newAttempts, user.id]
      );

      const remainingAttempts = 3 - newAttempts;
      return res.status(401).json({
        success: false,
        isLocked: false,
        remainingAttempts,
        message: `Incorrect password. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/send-unlock-otp - Send 6-digit OTP to user's registered email to unlock account
app.post('/api/auth/send-unlock-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  try {
    let cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin@quezoncity.gov.ph') {
      cleanEmail = 'admin@gmail.com';
    }

    const result = await pool.query('SELECT id, email, first_name, last_name FROM users WHERE LOWER(email) = $1;', [cleanEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const user = result.rows[0];
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    await pool.query(
      'UPDATE users SET unlock_otp = $1, unlock_otp_expires = $2 WHERE id = $3;',
      [otpCode, expiresAt, user.id]
    );

    const mailOptions = {
      from: `"GovServe Security Portal" <${process.env.EMAIL_USER || 'no-reply@quezoncity.gov.ph'}>`,
      to: cleanEmail,
      subject: 'GovServe Verification Code',
      text: `Your verification code is: ${otpCode}. Valid for 2 minutes. Use this code to unlock your GovServe account.`,
      html: `
        <!-- Gmail / Mobile Snippet Preheader: triggers the native 'Copy code: XXXXXX' pill in Gmail -->
        <div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
          Your verification code is: ${otpCode}. Valid for 2 minutes. Use this code to unlock your GovServe account.
        </div>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #1e3a8a; margin-top: 0;">GovServe Security Alert</h2>
          <p>Hello <strong>${user.first_name || 'Resident'}</strong>,</p>
          <p>You requested an instant unlock for your GovServe account due to temporary login lockout.</p>
          <p>Your 6-digit verification code is:</p>
          <div style="background-color: #f1f5f9; padding: 20px 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <div style="font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #2563eb; -webkit-user-select: all; user-select: all; cursor: pointer;">${otpCode}</div>
          </div>
          <p style="color: #64748b; font-size: 13px;">This code will expire in <strong>2 minutes</strong>. If you did not request this, please contact support immediately.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center;">Quezon City Social Services & Development Department (SSDD)</p>
        </div>
      `,
    };

    try {
      await sendEmail({
        to: cleanEmail,
        subject: mailOptions.subject,
        text: mailOptions.text,
        html: mailOptions.html
      });
      console.log(`✅ Unlock OTP sent to ${cleanEmail}: ${otpCode}`);
    } catch (mailErr) {
      console.warn('Unlock OTP email notice:', mailErr.message);
    }

    res.json({
      success: true,
      message: 'Verification code sent to your registered email address.',
      debugOtp: process.env.NODE_ENV === 'production' ? undefined : otpCode
    });
  } catch (err) {
    console.error('Send unlock OTP error:', err);
    res.status(500).json({ success: false, message: 'Failed to send verification code. Please try again.' });
  }
});

// POST /api/auth/verify-unlock-otp - Verify 6-digit OTP and reset lockout
app.post('/api/auth/verify-unlock-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and verification code are required.' });
  }

  try {
    let cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin@quezoncity.gov.ph') {
      cleanEmail = 'admin@gmail.com';
    }

    const result = await pool.query('SELECT id, unlock_otp, unlock_otp_expires FROM users WHERE LOWER(email) = $1;', [cleanEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const user = result.rows[0];
    const now = new Date();

    if (!user.unlock_otp || user.unlock_otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check and try again.' });
    }

    if (!user.unlock_otp_expires || new Date(user.unlock_otp_expires) < now) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    // Reset lockout state completely
    const clientIp = getClientIp(req);
    ipLockoutMap.delete(clientIp);

    await pool.query(
      'UPDATE users SET failed_login_attempts = 0, lockout_stage = 0, lockout_until = NULL, unlock_otp = NULL, unlock_otp_expires = NULL, last_failed_attempt = NULL WHERE id = $1;',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Account successfully unlocked! You may now sign in with your password.'
    });
  } catch (err) {
    console.error('Verify unlock OTP error:', err);
    res.status(500).json({ success: false, message: 'An error occurred while verifying the code.' });
  }
});

// POST /api/logout - Mark user as offline upon logout and delete session
app.post('/api/logout', async (req, res) => {
  const { email, session_token } = req.body;
  if (!email && !session_token) {
    return res.status(400).json({ success: false, message: 'Email or session_token is required' });
  }

  try {
    if (session_token) {
      await pool.query('DELETE FROM user_sessions WHERE session_token = $1;', [session_token]);
    }
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      await pool.query(
        'UPDATE users SET is_online = FALSE, last_active = CURRENT_TIMESTAMP WHERE LOWER(email) = $1;',
        [cleanEmail]
      );
    }
    res.json({ success: true, message: 'User logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reset-password - Reset user password
app.post('/api/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email and new password are required.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const checkRes = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1;', [cleanEmail]);
    if (checkRes.rows.length > 0) {
      await pool.query('UPDATE users SET password = $1 WHERE LOWER(email) = $2;', [hashedPassword, cleanEmail]);
    }
    
    res.json({ success: true, message: 'Password reset successfully!' });
  } catch (err) {
    console.error('Password reset DB error:', err);
    res.json({ success: true, message: 'Password reset completed.' });
  }
});

// POST /api/change-password - Change user password with current password verification
app.post('/api/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, current password, and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
  }

  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({ success: false, message: 'New password must contain at least one uppercase letter (A-Z).' });
  }

  if (!/[0-9]/.test(newPassword)) {
    return res.status(400).json({ success: false, message: 'New password must contain at least one number (0-9).' });
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
    return res.status(400).json({ success: false, message: 'New password must contain at least one special character (!@#$%^&* etc.).' });
  }

  try {
    let cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin@quezoncity.gov.ph') {
      cleanEmail = 'admin@gmail.com';
    }

    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1;', [cleanEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const user = result.rows[0];
    let isMatch = false;

    try {
      isMatch = await bcrypt.compare(currentPassword, user.password);
    } catch (err) {
      isMatch = false;
    }

    // Fallback for unhashed plain text passwords (e.g. initial seed)
    if (!isMatch && currentPassword === user.password) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password. Please try again.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE LOWER(email) = $2;', [hashedPassword, cleanEmail]);

    res.json({ success: true, message: 'Password changed successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'An error occurred while updating the password.' });
  }
});

// GET /api/user/profile - Fetch user profile by email
app.get('/api/user/profile', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query('SELECT id, email, role, first_name, middle_name, last_name, suffix, dob, blood_type, civil_status, sex, occupation, phone_number, house_no, street_name, barangay, city, COALESCE(is_online, FALSE) as is_online FROM users WHERE LOWER(email) = $1;', [cleanEmail]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/profile - Update user personal and contact profile info
app.put('/api/user/profile', async (req, res) => {
  const {
    email,
    firstName,
    middleName,
    lastName,
    suffix,
    dob,
    bloodType,
    city,
    houseNo,
    street,
    barangay,
    occupation,
    civilStatus,
    sex,
    mobileNumber
  } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'User email is required' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query(`
      UPDATE users SET
        first_name = COALESCE($1, first_name),
        middle_name = COALESCE($2, middle_name),
        last_name = COALESCE($3, last_name),
        suffix = COALESCE($4, suffix),
        dob = COALESCE($5, dob),
        blood_type = COALESCE($6, blood_type),
        city = COALESCE($7, city),
        house_no = COALESCE($8, house_no),
        street_name = COALESCE($9, street_name),
        barangay = COALESCE($10, barangay),
        occupation = COALESCE($11, occupation),
        civil_status = COALESCE($12, civil_status),
        sex = COALESCE($13, sex),
        phone_number = COALESCE($14, phone_number),
        updated_at = CURRENT_TIMESTAMP
      WHERE LOWER(email) = $15
      RETURNING id, email, role, first_name, middle_name, last_name, suffix, dob, blood_type, civil_status, sex, occupation, phone_number, house_no, street_name, barangay, city;
    `, [
      firstName,
      middleName,
      lastName,
      suffix,
      dob,
      bloodType,
      city,
      houseNo,
      street,
      barangay,
      occupation,
      civilStatus,
      sex,
      mobileNumber,
      cleanEmail
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'Profile updated successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/user/sessions - Fetch active sessions for a user
app.get('/api/user/sessions', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email query parameter is required' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query(
      `SELECT id, user_id, email, session_token, device_type, os_name, browser_name, ip_address, location, signed_in_at, last_active_at, is_active
       FROM user_sessions 
       WHERE LOWER(email) = $1 AND is_active = TRUE
       ORDER BY last_active_at DESC;`,
      [cleanEmail]
    );

    const sessions = (result.rows || []).map(sess => {
      let loc = sess.location || 'Quezon City, PH';
      if (loc.includes('San Juan') || loc.includes('Mandaluyong')) {
        loc = 'Quezon City, PH';
      }
      return { ...sess, location: loc };
    });

    res.json({ success: true, sessions });
  } catch (err) {
    console.error('Error fetching user sessions:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/user/sessions/logout-device - Revoke a specific device session
app.post('/api/user/sessions/logout-device', async (req, res) => {
  const { session_token, id } = req.body;
  if (!session_token && !id) {
    return res.status(400).json({ success: false, message: 'session_token or id is required' });
  }

  try {
    await pool.query(
      `DELETE FROM user_sessions 
       WHERE session_token = $1 OR id = $2;`,
      [session_token || null, id ? parseInt(id, 10) : -1]
    );

    res.json({ success: true, message: 'Device logged out successfully.' });
  } catch (err) {
    console.error('Error revoking device session:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/user/sessions/logout-all-others - Revoke all other active sessions for user except current
app.post('/api/user/sessions/logout-all-others', async (req, res) => {
  const { email, current_session_token } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'User email is required' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    let query = `DELETE FROM user_sessions WHERE LOWER(email) = $1`;
    const params = [cleanEmail];

    if (current_session_token) {
      query += ` AND session_token != $2`;
      params.push(current_session_token);
    }

    await pool.query(query, params);

    res.json({ success: true, message: 'All other devices logged out successfully.' });
  } catch (err) {
    console.error('Error logging out all other devices:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/user/sessions/verify - Check if a session token is still active (for instant auto-kickout)
app.get('/api/user/sessions/verify', async (req, res) => {
  const { session_token } = req.query;
  if (!session_token) {
    return res.json({ success: true, active: true });
  }

  try {
    const result = await pool.query(
      'SELECT id, is_active FROM user_sessions WHERE session_token = $1 LIMIT 1;',
      [session_token]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, active: false });
    }

    const session = result.rows[0];
    if (!session.is_active) {
      return res.json({ success: true, active: false });
    }

    res.json({ success: true, active: true });
  } catch (err) {
    console.error('Session verify error:', err);
    res.status(500).json({ success: false, active: true });
  }
});

// GET /api/users - Fetch all users for Admin User Management
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, email, role, first_name, middle_name, last_name, suffix, dob, blood_type, civil_status, sex, occupation, phone_number, house_no, street_name, barangay, city, COALESCE(status, 'Active') as status, COALESCE(is_online, FALSE) as is_online, created_at
      FROM users
      ORDER BY id ASC;
    `);

    const formattedUsers = result.rows.map((u) => ({
      id: u.id,
      userId: `USR-2026-${String(u.id).padStart(3, '0')}`,
      email: u.email,
      role: u.role === 'admin' ? 'Administrator' : 'User / Beneficiary',
      rawRole: u.role,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      phoneNumber: u.phone_number || 'N/A',
      barangay: u.barangay || 'N/A',
      city: u.city || 'QUEZON CITY',
      status: u.status || 'Active',
      isOnline: u.is_online === true,
      presence: u.is_online === true ? 'Online' : 'Offline',
      createdAt: u.created_at
    }));

    res.json(formattedUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id/status - Toggle user account status (Active / Inactive)
app.patch('/api/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, status;',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/activity-logs - Fetch activity logs (supports ?deleted=true for trash view)
app.get('/api/activity-logs', async (req, res) => {
  const isDeleted = req.query.deleted === 'true';
  try {
    const result = await pool.query(
      `SELECT id, timestamp, staff_name, action, module, details, reference_no, is_deleted, deleted_at
       FROM activity_logs
       WHERE is_deleted = $1
       ORDER BY timestamp DESC;`,
      [isDeleted]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activity-logs - Record a new activity log
app.post('/api/activity-logs', async (req, res) => {
  const { staff_name, action, module, details, reference_no } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO activity_logs (staff_name, action, module, details, reference_no)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [staff_name || 'System Admin', action, module, details, reference_no || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error recording activity log:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/activity-logs/bulk/soft-delete-all - Move all active logs to Recently Deleted
app.delete('/api/activity-logs/bulk/soft-delete-all', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE activity_logs 
       SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP 
       WHERE is_deleted = FALSE 
       RETURNING *;`
    );
    res.json({ success: true, count: result.rows.length });
  } catch (err) {
    console.error('Error soft-deleting all activity logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/activity-logs/bulk/empty-trash - Permanently delete all logs in Recently Deleted
app.delete('/api/activity-logs/bulk/empty-trash', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM activity_logs 
       WHERE is_deleted = TRUE 
       RETURNING *;`
    );
    res.json({ success: true, count: result.rows.length });
  } catch (err) {
    console.error('Error emptying trash activity logs:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/activity-logs/:id/permanent - Permanently delete a single log from Recently Deleted
app.delete('/api/activity-logs/:id/permanent', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM activity_logs 
       WHERE id = $1 AND is_deleted = TRUE 
       RETURNING *;`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log entry not found in trash' });
    }
    res.json({ success: true, log: result.rows[0] });
  } catch (err) {
    console.error('Error permanently deleting activity log:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/activity-logs/:id - Soft delete an activity log (move to recently deleted)
app.delete('/api/activity-logs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE activity_logs 
       SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1 RETURNING *;`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log entry not found' });
    }
    res.json({ success: true, log: result.rows[0] });
  } catch (err) {
    console.error('Error soft-deleting activity log:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activity-logs/:id/restore - Restore a soft-deleted activity log
app.post('/api/activity-logs/:id/restore', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE activity_logs 
       SET is_deleted = FALSE, deleted_at = NULL 
       WHERE id = $1 RETURNING *;`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Log entry not found' });
    }
    res.json({ success: true, log: result.rows[0] });
  } catch (err) {
    console.error('Error restoring activity log:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// BENEFICIARY MANAGEMENT ENDPOINTS
// ==========================================

// Helper to normalize citizen key for deduplication across all modules
const normalizeCitizenKey = (name = '', phone = '', email = '', obj = {}) => {
  const cleanEmail = (email || obj.email_address || obj.email || '').trim().toLowerCase();
  if (cleanEmail && cleanEmail.includes('@') && !cleanEmail.includes('unknown') && !cleanEmail.includes('sample')) {
    return `email-${cleanEmail}`;
  }

  const cleanPhone = (phone || obj.phone_number || '').trim().replace(/[^0-9]/g, '');
  if (cleanPhone && cleanPhone.length >= 7) {
    return `phone-${cleanPhone.slice(-10)}`;
  }

  const cleanNameParts = (name || `${obj.first_name || ''} ${obj.last_name || ''}`)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  if (cleanNameParts.length >= 2) {
    return `name-${cleanNameParts[0]}-${cleanNameParts[cleanNameParts.length - 1]}`;
  } else if (cleanNameParts.length === 1) {
    return `name-${cleanNameParts[0]}`;
  }

  return 'unknown-citizen';
};

// Helper to format proper case name
const formatProperCase = (str = '') => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// GET /api/beneficiaries - Aggregate unique citizens across all 8 modules & verification table
app.get('/api/beneficiaries', async (req, res) => {
  try {
    const [
      aicsRes, seniorRes, pwdRes, soloRes, eduRes, cwRes, liveRes, trainRes, verifRes, usersRes
    ] = await Promise.all([
      pool.query('SELECT * FROM aics_applications ORDER BY date_submitted DESC').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM senior_applications ORDER BY date_submitted DESC').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM pwd_applications ORDER BY date_submitted DESC').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM solo_parent_applications ORDER BY date_submitted DESC').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM educational_applications ORDER BY date_submitted DESC').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM child_welfare_applications ORDER BY date_submitted DESC').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM livelihood_applications ORDER BY date_submitted DESC').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM training_applications ORDER BY date_submitted DESC').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM beneficiary_verifications').catch(() => ({ rows: [] })),
      pool.query('SELECT * FROM users WHERE role = $1 OR role = $2', ['user', 'User / Beneficiary']).catch(() => ({ rows: [] })),
    ]);

    const verifMap = new Map();
    verifRes.rows.forEach(v => {
      verifMap.set(v.citizen_key, v);
    });

    const citizenMap = new Map();

    const getOrCreateCitizen = (key, defaultName, sourceObj = {}) => {
      const details = sourceObj.details || {};
      const personalInfo = details.personalInformation || {};

      const firstName = sourceObj.first_name || personalInfo.firstName || '';
      const lastName = sourceObj.last_name || personalInfo.lastName || '';
      const middleName = sourceObj.middle_name || personalInfo.middleName || '';
      const fullComboName = [firstName, middleName, lastName, sourceObj.suffix].filter(Boolean).join(' ').trim();
      const rawName = fullComboName || defaultName || `${firstName} ${middleName} ${lastName}`.trim() || 'QC Resident';

      const email = (sourceObj.email_address || sourceObj.email || '').trim().toLowerCase();
      const phone = (sourceObj.phone_number || personalInfo.phoneNumber || '').trim().replace(/[^0-9]/g, '');

      const nameParts = rawName.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      const firstWord = nameParts[0] || '';
      const lastWord = nameParts.length >= 2 ? nameParts[nameParts.length - 1] : '';

      // Check if existing citizen in citizenMap matches by key, email, phone, or first+last name
      let existingCitizen = citizenMap.get(key);

      if (!existingCitizen) {
        for (const [ckey, c] of citizenMap.entries()) {
          const cEmail = (c.email || '').trim().toLowerCase();
          const cPhone = (c.phone || '').trim().replace(/[^0-9]/g, '');
          const cNameParts = (c.rawName || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
          const cFirstWord = cNameParts[0] || '';
          const cLastWord = cNameParts.length >= 2 ? cNameParts[cNameParts.length - 1] : '';

          const emailMatch = email && cEmail && email === cEmail;
          const phoneMatch = phone && cPhone && phone.slice(-10) === cPhone.slice(-10);
          const nameMatch = firstWord && lastWord && cFirstWord && cLastWord && firstWord === cFirstWord && lastWord === cLastWord;

          if (emailMatch || phoneMatch || nameMatch) {
            existingCitizen = c;
            citizenMap.set(key, c);
            break;
          }
        }
      }

      if (!existingCitizen) {
        const houseNo = sourceObj.house_no || personalInfo.houseNo || '';
        const street = sourceObj.street_name || personalInfo.streetName || '';
        const barangay = sourceObj.barangay || personalInfo.barangay || '';
        const fullAddrParts = [houseNo, street, barangay, barangay ? 'Quezon City' : ''].filter(Boolean).join(' ');

        existingCitizen = {
          key,
          id: `QC-BEN-2026-${String(citizenMap.size + 1).padStart(4, '0')}`,
          name: formatProperCase(rawName),
          rawName: rawName.toUpperCase(),
          firstName: formatProperCase(firstName),
          lastName: formatProperCase(lastName),
          middleName: formatProperCase(middleName),
          dob: sourceObj.dob || personalInfo.dateOfBirth || sourceObj.patient_dob || '',
          age: sourceObj.age || personalInfo.age || sourceObj.patient_age || '',
          gender: sourceObj.gender || personalInfo.gender || '',
          civilStatus: sourceObj.civil_status || personalInfo.civilStatus || '',
          address: fullAddrParts || 'Quezon City',
          barangay: formatProperCase(barangay) || 'Quezon City',
          phone: sourceObj.phone_number || personalInfo.phoneNumber || '',
          email: sourceObj.email_address || sourceObj.email || '',
          qcId: sourceObj.qcitizen_id || sourceObj.senior_id_no || personalInfo.seniorCitizenId || '',
          idType: 'QCitizen ID',
          idDocumentUrl: null,
          idDocumentName: null,
          sectors: new Set(),
          history: [],
          totalCash: 0,
          nonCashCount: 0,
          manualVerification: verifMap.get(key) || null,
        };
        citizenMap.set(key, existingCitizen);
      } else {
        if (rawName.length > (existingCitizen.name || '').length) {
          existingCitizen.name = formatProperCase(rawName);
          existingCitizen.rawName = rawName.toUpperCase();
        }
        if (middleName && !existingCitizen.middleName) {
          existingCitizen.middleName = formatProperCase(middleName);
        }
        if (phone && !existingCitizen.phone) {
          existingCitizen.phone = phone;
        }
        if (email && !existingCitizen.email) {
          existingCitizen.email = email;
        }
        if (sourceObj.qcitizen_id && !existingCitizen.qcId) {
          existingCitizen.qcId = sourceObj.qcitizen_id;
        }
      }

      return existingCitizen;
    };

    // Helper status checkers
    const isApprovedStatus = (s = '') => {
      const st = (s || '').toLowerCase();
      return st.includes('approved') || st.includes('released') || st.includes('completed') || 
             st.includes('payout') || st.includes('qualified') || st.includes('enrolled');
    };

    // Helper to safely assign or upgrade citizen ID document
    const assignCitizenIdDoc = (c, docUrl, docName, idTypeLabel) => {
      if (!docUrl) return;
      const currentIsBlob = !c.idDocumentUrl || c.idDocumentUrl.startsWith('blob:');
      const newIsBase64OrHttp = docUrl.startsWith('data:image/') || (docUrl.startsWith('http') && !docUrl.startsWith('blob:'));
      
      if (!c.idDocumentUrl || (currentIsBlob && newIsBase64OrHttp)) {
        c.idDocumentUrl = docUrl;
        c.idDocumentName = docName || 'Uploaded Valid ID';
        if (idTypeLabel) c.idType = idTypeLabel;
      }
    };

    // 1. Process AICS
    aicsRes.rows.forEach(a => {
      const name = a.applicant_name || `${a.first_name || ''} ${a.last_name || ''}`.trim() || 'AICS Client';
      const key = normalizeCitizenKey(name, a.phone_number, a.email_address);
      const c = getOrCreateCitizen(key, name, a);
      const isMed = (a.assistance_type || a.service_name || '').toLowerCase().includes('med');
      c.sectors.add(isMed ? 'AICS Medical' : 'AICS Funeral');
      c.nonCashCount += 1;
      
      const docData = a.details?.uploadedDocData || {};
      const aicsDoc = docData.government_id || docData.qcid_patient || docData.validId || docData.otherSupport;
      if (aicsDoc?.dataUrl) {
        assignCitizenIdDoc(c, aicsDoc.dataUrl, aicsDoc.name || 'Valid ID Document', 'QCitizen / Valid Gov ID');
      }

      c.history.push({
        program: isMed ? 'AICS Medical Assistance' : 'AICS Funeral Assistance',
        category: 'aics',
        referenceNo: a.reference_no,
        date: a.date_submitted || a.created_at,
        type: 'Hospital Guarantee Letter (GL)',
        amountFormatted: 'Non-Cash (GL)',
        amountNumber: 0,
        status: a.status || 'Under Review',
        isApproved: isApprovedStatus(a.status),
      });
    });

    // 2. Process Senior Citizens
    seniorRes.rows.forEach(s => {
      const name = s.applicant_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Senior Citizen';
      const key = normalizeCitizenKey(name, s.phone_number);
      const c = getOrCreateCitizen(key, name, s);
      c.sectors.add('Senior Citizen');
      c.idType = 'Senior Citizen ID (OSCA)';
      if (s.senior_id_no) c.qcId = s.senior_id_no;

      const docData = s.details?.uploadedDocData || {};
      const seniorDoc = docData.seniorIdCard || docData.otherSupport;
      if (seniorDoc?.dataUrl) {
        assignCitizenIdDoc(c, seniorDoc.dataUrl, seniorDoc.name || 'Senior Citizen ID Card', 'Senior Citizen ID (OSCA)');
      }

      const amt = parseFloat(s.amount) || 3000;
      if (isApprovedStatus(s.status)) c.totalCash += amt;

      c.history.push({
        program: 'Senior Citizen Financial Assistance',
        category: 'senior',
        referenceNo: s.reference_no,
        date: s.date_submitted || s.created_at,
        type: 'Cash Assistance',
        amountFormatted: `₱${amt.toLocaleString()}`,
        amountNumber: amt,
        status: s.status || 'Pending Verification',
        isApproved: isApprovedStatus(s.status),
      });
    });

    // 3. Process PWD
    pwdRes.rows.forEach(p => {
      const name = p.applicant_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'PWD Beneficiary';
      const key = normalizeCitizenKey(name, p.phone_number);
      const c = getOrCreateCitizen(key, name, p);
      c.sectors.add('PWD');
      c.idType = 'PDAO PWD ID Card';

      const docData = p.details?.uploadedDocData || p.uploaded_documents || {};
      const pwdDoc = docData.pwd_id || docData.pwdId || docData.valid_id;
      if (pwdDoc?.dataUrl || typeof pwdDoc === 'string') {
        assignCitizenIdDoc(c, pwdDoc?.dataUrl || pwdDoc, pwdDoc?.name || 'PWD ID Card', 'PDAO PWD ID Card');
      }

      const amt = parseFloat(p.amount) || 3000;
      if (isApprovedStatus(p.status)) c.totalCash += amt;

      c.history.push({
        program: 'PWD Financial Assistance',
        category: 'pwd',
        referenceNo: p.reference_no,
        date: p.date_submitted || p.created_at,
        type: 'Cash Assistance',
        amountFormatted: `₱${amt.toLocaleString()}`,
        amountNumber: amt,
        status: p.status || 'Pending Verification',
        isApproved: isApprovedStatus(p.status),
      });
    });

    // 4. Process Solo Parent
    soloRes.rows.forEach(sp => {
      const name = sp.applicant_name || `${sp.first_name || ''} ${sp.last_name || ''}`.trim() || 'Solo Parent';
      const key = normalizeCitizenKey(name, sp.phone_number);
      const c = getOrCreateCitizen(key, name, sp);
      c.sectors.add('Solo Parent');
      c.idType = 'Solo Parent ID (SPIC)';

      const docs = sp.uploaded_documents || sp.details?.uploadedDocData || {};
      const soloDoc = docs.spic || docs.qcid || docs.valid_id;
      if (soloDoc?.dataUrl) {
        assignCitizenIdDoc(c, soloDoc.dataUrl, soloDoc.name || 'Solo Parent ID (SPIC)', 'Solo Parent ID (SPIC)');
      }

      const amt = parseFloat(sp.amount) || 3000;
      if (isApprovedStatus(sp.status)) c.totalCash += amt;

      c.history.push({
        program: 'Solo Parent Financial Subsidy',
        category: 'solo_parent',
        referenceNo: sp.reference_no,
        date: sp.date_submitted || sp.created_at,
        type: 'Cash Subsidy',
        amountFormatted: `₱${amt.toLocaleString()}`,
        amountNumber: amt,
        status: sp.status || 'Pending Document Verification',
        isApproved: isApprovedStatus(sp.status),
      });
    });

    // 5. Process Educational Applications
    eduRes.rows.forEach(edu => {
      const name = edu.applicant_name || `${edu.first_name || ''} ${edu.last_name || ''}`.trim() || 'Edu Assistance';
      const key = normalizeCitizenKey(name, edu.phone_number);
      const c = getOrCreateCitizen(key, name, edu);
      const isCw = (edu.category || '').toLowerCase().includes('child') || (edu.reference_no || '').startsWith('CW-');
      c.sectors.add(isCw ? 'Child Welfare' : 'Edu Assistance');

      const docs = edu.uploaded_documents || edu.details?.uploadedDocData || {};
      const eduDoc = docs.soloParentId || docs.qcitizenId || docs.enrollment || docs.indigency;
      if (eduDoc?.dataUrl || eduDoc?.url) {
        assignCitizenIdDoc(c, eduDoc.dataUrl || eduDoc.url, eduDoc.name || 'Educational Valid ID Proof', isCw ? 'Child Welfare Ward ID' : 'Edu Assistance Valid ID');
      }

      const amt = parseFloat(edu.amount) || 5000;
      if (isApprovedStatus(edu.status)) c.totalCash += amt;

      c.history.push({
        program: isCw ? 'Child Welfare Educational Aid' : 'Solo Parent Educational Assistance',
        category: 'educational',
        referenceNo: edu.reference_no,
        date: edu.date_submitted || edu.created_at,
        type: 'Educational Cash Grant',
        amountFormatted: `₱${amt.toLocaleString()}`,
        amountNumber: amt,
        status: edu.status || 'Pending Document Validation',
        isApproved: isApprovedStatus(edu.status),
      });
    });

    // 6. Process Child Welfare Applications
    cwRes.rows.forEach(cw => {
      const name = cw.applicant_name || `${cw.first_name || ''} ${cw.last_name || ''}`.trim() || 'Child Welfare Ward';
      const key = normalizeCitizenKey(name, cw.phone_number);
      const c = getOrCreateCitizen(key, name, cw);
      c.sectors.add('Child Welfare');
      c.idType = 'PSA Birth Certificate / Referral';
      c.nonCashCount += 1;

      const docs = cw.uploaded_documents || cw.details?.uploadedDocData || {};
      const cwDoc = docs.birth_cert || docs.referral || docs.valid_id;
      if (cwDoc?.dataUrl || typeof cwDoc === 'string') {
        assignCitizenIdDoc(c, cwDoc?.dataUrl || cwDoc, cwDoc?.name || 'PSA Birth Certificate / Referral', 'PSA Birth Certificate / Referral');
      }

      c.history.push({
        program: cw.service_name || 'Child Welfare Services',
        category: 'child_welfare',
        referenceNo: cw.reference_no,
        date: cw.date_submitted || cw.created_at,
        type: 'Protective & Care Services',
        amountFormatted: 'Protective Services',
        amountNumber: 0,
        status: cw.status || 'Pending Assessment',
        isApproved: isApprovedStatus(cw.status),
      });
    });

    // 7. Process Livelihood Applications
    liveRes.rows.forEach(liv => {
      const name = liv.applicant_name || `${liv.first_name || ''} ${liv.last_name || ''}`.trim() || 'Livelihood Grantee';
      const key = normalizeCitizenKey(name, liv.phone_number);
      const c = getOrCreateCitizen(key, name, liv);
      c.sectors.add('Livelihood');
      c.nonCashCount += 1;

      const docs = liv.uploaded_documents || liv.details?.uploadedDocData || {};
      const livDoc = docs.valid_id || docs.proof_of_residency;
      if (livDoc?.dataUrl || livDoc?.url) {
        assignCitizenIdDoc(c, livDoc.dataUrl || livDoc.url, livDoc.name || 'Livelihood Valid ID', 'Livelihood Valid ID');
      }

      const amt = parseFloat(liv.amount) || 15000;
      if (isApprovedStatus(liv.status)) c.totalCash += amt;

      c.history.push({
        program: liv.project_title || liv.business_name ? `Livelihood: ${liv.project_title || liv.business_name}` : 'Livelihood Starter Kit / Capital Grant',
        category: 'livelihood',
        referenceNo: liv.reference_no,
        date: liv.date_submitted || liv.created_at,
        type: 'Livelihood Capital Grant & Kit',
        amountFormatted: `₱${amt.toLocaleString()}`,
        amountNumber: amt,
        status: liv.status || 'Under Review',
        isApproved: isApprovedStatus(liv.status),
      });
    });

    // 8. Process Training Applications
    trainRes.rows.forEach(tr => {
      const name = tr.applicant_name || `${tr.first_name || ''} ${tr.last_name || ''}`.trim() || 'Skills Trainee';
      const key = normalizeCitizenKey(name, tr.phone_number);
      const c = getOrCreateCitizen(key, name, tr);
      c.sectors.add('Skills Trainee');
      c.nonCashCount += 1;

      const docs = tr.uploaded_documents || {};
      const trDoc = docs.docQcId || tr.doc_qc_id;
      if (trDoc?.dataUrl || typeof trDoc === 'string') {
        assignCitizenIdDoc(c, trDoc?.dataUrl || trDoc, trDoc?.name || 'QCitizen ID Residency Proof', 'QCitizen ID Residency Proof');
      }

      c.history.push({
        program: tr.course_title ? `Skills Training: ${tr.course_title}` : 'Vocational Skills Training',
        category: 'training',
        referenceNo: tr.reference_no,
        date: tr.date_submitted || tr.created_at,
        type: 'Free Vocational Course',
        amountFormatted: 'Free Training Course',
        amountNumber: 0,
        status: tr.status || 'Qualified / Enrolled',
        isApproved: isApprovedStatus(tr.status),
      });
    });

    // Format final list of beneficiaries
    const beneficiaries = Array.from(new Set(citizenMap.values())).map(c => {
      // Determine verification status
      let verificationStatus = 'Pending';
      if (c.manualVerification) {
        verificationStatus = c.manualVerification.status;
      } else {
        const hasApproved = c.history.some(h => h.isApproved);
        if (hasApproved || c.qcId) {
          verificationStatus = 'Verified';
        } else {
          verificationStatus = 'Pending';
        }
      }

      // Initials for avatar circle
      const nameParts = c.name.split(' ').filter(Boolean);
      const initials = nameParts.length >= 2 
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : (nameParts[0] ? nameParts[0].slice(0, 2).toUpperCase() : 'QC');

      return {
        id: c.id,
        citizenKey: c.key,
        name: c.name,
        initials,
        age: c.age,
        dob: c.dob,
        gender: c.gender,
        civilStatus: c.civilStatus,
        address: c.address,
        barangay: c.barangay,
        phone: c.phone,
        email: c.email,
        qcId: c.qcId,
        idType: c.idType,
        idDocumentUrl: c.idDocumentUrl,
        idDocumentName: c.idDocumentName,
        sectorBadges: Array.from(c.sectors),
        verificationStatus,
        totalCash: c.totalCash,
        totalCashFormatted: `₱${c.totalCash.toLocaleString()}`,
        nonCashCount: c.nonCashCount,
        programsEnrolledCount: c.history.length,
        history: c.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        verifiedBy: c.manualVerification?.verified_by || 'Social Worker Assessment',
        verifiedAt: c.manualVerification?.verified_at || null,
        notes: c.manualVerification?.notes || 'Validated against QC LGU resident credentials',
      };
    });

    res.json(beneficiaries);
  } catch (err) {
    console.error('Error compiling beneficiaries registry:', err);
    res.status(500).json({ error: 'Failed to compile beneficiaries', details: err.message });
  }
});

// POST /api/beneficiaries/verify - Social worker approves/rejects verification
app.post('/api/beneficiaries/verify', async (req, res) => {
  const { citizenKey, status = 'Verified', notes = '', verifiedBy = 'System Admin', citizenName = '', referenceNo = '' } = req.body;
  if (!citizenKey) {
    return res.status(400).json({ error: 'citizenKey is required' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO beneficiary_verifications (citizen_key, status, notes, verified_by, verified_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (citizen_key) 
      DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, verified_by = EXCLUDED.verified_by, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `, [citizenKey, status, notes, verifiedBy]);

    // Record audit activity log
    await pool.query(`
      INSERT INTO activity_logs (staff_name, action, module, details, reference_no)
      VALUES ($1, $2, 'Beneficiary Management', $3, $4);
    `, [
      verifiedBy,
      status === 'Verified' ? 'Verified' : 'Updated Status',
      `${status === 'Verified' ? 'Approved and marked beneficiary as VERIFIED' : 'Updated verification status'} for ${citizenName || citizenKey}. Notes: ${notes || 'Document validation check completed.'}`,
      referenceNo || citizenKey
    ]);

    res.json({ success: true, verification: result.rows[0] });
  } catch (err) {
    console.error('Error verifying beneficiary:', err);
    res.status(500).json({ error: 'Failed to update verification', details: err.message });
  }
});

// ============================================================================
// STRICT SYSTEM-LOCKED AI ELIGIBILITY ASSESSMENT & ASSISTANCE RECOMMENDATION
// ============================================================================
const OFFICIAL_MSWDO_SYSTEM_PROGRAMS = {
  'aics-medical': {
    tabKey: 'aics-medical',
    programName: 'AICS Medical & Hospitalization Assistance',
    moduleLabel: 'AICS Module',
    benefitAmount: '₱5,000 – ₱20,000 Guarantee Letter / Cash Aid',
    defaultRequirements: [
      'Valid Government / QCitizen ID',
      'Medical Certificate / Clinical Abstract (Signed by Physician)',
      'Hospital Statement of Account (Billing) or Doctor Prescription',
      'Barangay Certificate of Indigency'
    ]
  },
  'aics-funeral': {
    tabKey: 'aics-funeral',
    programName: 'AICS Bereavement & Funeral Assistance',
    moduleLabel: 'AICS Module',
    benefitAmount: 'Up to ₱10,000 Funeral Guarantee Letter',
    defaultRequirements: [
      'Registered Death Certificate of Deceased Family Member',
      'Funeral Parlor Contract / Official Billing Statement',
      'Valid ID of Claimant (Immediate Family Member)',
      'Barangay Certificate of Indigency'
    ]
  },
  'aics-educational': {
    tabKey: 'aics-educational',
    programName: 'Educational Assistance for Indigent Children & Youth',
    moduleLabel: 'Child Welfare Module',
    benefitAmount: '₱5,000 Educational Cash Grant',
    defaultRequirements: [
      'Certificate of Registration / Enrollment Form (Current Term)',
      ' Certified True Copy of Grades / Report Card',
      'School ID of Student & Valid ID of Parent/Guardian',
      'Barangay Certificate of Indigency'
    ]
  },
  'childwelfare-form': {
    tabKey: 'childwelfare-form',
    programName: 'Child Welfare Protection & Care Services',
    moduleLabel: 'Child Welfare Module',
    benefitAmount: 'Child Protection, Daycare & Nutritional Support',
    defaultRequirements: [
      'PSA Birth Certificate of the Child',
      'Valid Government ID of Parent or Legal Guardian',
      'Barangay Referral or Social Case Intake Report'
    ]
  },
  'pwd-form': {
    tabKey: 'pwd-form',
    programName: 'PWD Financial & Assistive Welfare Assistance',
    moduleLabel: 'PWD Assistance Module',
    benefitAmount: '₱3,000 Cash Grant & Assistive Support',
    defaultRequirements: [
      'Official PDAO / PWD Identification Card',
      'Medical Certificate Confirming Disability Type',
      'Barangay Certificate of Residency / Indigency'
    ]
  },
  'senior-form': {
    tabKey: 'senior-form',
    programName: 'Senior Citizen Social Welfare Financial Assistance',
    moduleLabel: 'Senior Citizen Module',
    benefitAmount: '₱3,000 Senior Citizen Cash Grant',
    defaultRequirements: [
      'OSCA Senior Citizen ID Card (60+ Years Old)',
      'Birth Certificate or Valid Government ID with Date of Birth',
      'Barangay Certificate of Indigency / No Regular Pension'
    ]
  },
  'soloparent-financial-form': {
    tabKey: 'soloparent-financial-form',
    programName: 'Solo Parent Monthly / Crisis Financial Subsidy',
    moduleLabel: 'Solo Parent Module',
    benefitAmount: '₱3,000 Solo Parent Cash Subsidy',
    defaultRequirements: [
      'Valid Solo Parent ID (RA 11861) or Sworn Affidavit of Solo Parent',
      'PSA Birth Certificate(s) of Minor Dependent Child(ren)',
      'Barangay Certificate of Indigency & Residency'
    ]
  },
  'soloparent-edu-form': {
    tabKey: 'soloparent-edu-form',
    programName: 'Solo Parent Educational Assistance Program',
    moduleLabel: 'Solo Parent Module',
    benefitAmount: '₱5,000 Solo Parent Child Educational Grant',
    defaultRequirements: [
      'Valid Solo Parent ID Card',
      'Certificate of Enrollment / Registration of Dependent Child',
      'PSA Birth Certificate of Student & Barangay Indigency'
    ]
  },
  'livelihood': {
    tabKey: 'livelihood',
    programName: 'Sustainable Livelihood Starter Kit / Capital Grant',
    moduleLabel: 'Livelihood Module',
    benefitAmount: '₱15,000 Micro-Enterprise Capital Grant',
    defaultRequirements: [
      'Valid Government / QCitizen ID',
      'Simple Micro-Business Proposal / Sari-Sari or Vending Plan',
      'Barangay Clearance & Certificate of Indigency'
    ]
  },
  'skills-training': {
    tabKey: 'skills-training',
    programName: 'Vocational & Livelihood Skills Training Program',
    moduleLabel: 'Skills Training Module',
    benefitAmount: 'Free TESDA-Accredited Vocational Course & Kit',
    defaultRequirements: [
      'Valid Government / QCitizen ID (Resident 18+ Years Old)',
      'Barangay Certificate of Residency',
      '2x2 ID Picture & Completed Enrollment Form'
    ]
  }
};

function buildRuleBasedEligibilityAssessment(payload) {
  const {
    primaryApplicant = '',
    householdIncome = '',
    barangay = '',
    dependentMembers = '',
    employmentStatus = '',
    welfareProgramStatus = '',
    healthInsurance = '',
    urgencyTimeline = '',
    residencyCondition = '',
    selectedHardships = [],
    narrative = '',
    specialCircumstances = [],
    language = 'English'
  } = payload || {};

  const isTagalog = language === 'Tagalog';
  const text = `${narrative} ${(specialCircumstances || []).join(' ')}`.toLowerCase();
  const isHighIncome = householdIncome.includes('Above ₱30,000');
  const isModerateIncome = householdIncome.includes('₱20,001 to ₱30,000');
  const isLowIncome = householdIncome.includes('Below ₱10,000') || householdIncome.includes('₱10,000 to ₱20,000');

  // Detect out-of-scope / non-MSWDO requests in narrative
  const outOfScopeKeywords = [
    'gaming pc', 'playstation', 'iphone', 'kotse', 'sports car', 'crypto', 'bitcoin',
    'casino', 'sugal', 'bakasyon', 'travel abroad', 'tourist visa', 'homework',
    'coding', 'programming', 'luxury', 'concert ticket'
  ];
  const hasOutOfScopeKeyword = outOfScopeKeywords.some(kw => text.includes(kw));

  const welfareKeywords = [
    'ospital', 'hospital', 'gamot', 'medicine', 'dialysis', 'chemo', 'surgery', 'operasyon', 'medical', 'sakit',
    'patay', 'namatay', 'libing', 'burol', 'funeral', 'burial', 'casket', 'deceased', 'death',
    'aral', 'school', 'tuition', 'enroll', 'estudyante', 'student', 'educational', 'allowance', 'bata', 'child',
    'pwd', 'disability', 'kapansanan', 'wheelchair', 'bulag', 'pilay', 'stroke',
    'senior', 'matanda', 'elderly', 'lola', 'lolo', 'pension', 'maintenance',
    'solo parent', 'single parent', 'mag-isa', 'iniwan', 'anak',
    'negosyo', 'puhunan', 'livelihood', 'sari-sari', 'tindahan', 'vendor', 'kapital', 'capital',
    'training', 'vocational', 'tesda', 'trabaho', 'skills', 'walang trabaho', 'unemployed', 'indigent', 'mahirap', 'tulong'
  ];
  const hasWelfareKeyword = welfareKeywords.some(kw => text.includes(kw));

  if (hasOutOfScopeKeyword && !hasWelfareKeyword) {
    return {
      eligibilityStatus: 'NOT_ELIGIBLE',
      statusBadge: isTagalog
        ? 'Labas sa Sakop ng MSWDO System / Hindi Kwalipikado'
        : 'Outside MSWDO System Scope / Not Eligible',
      matchScore: 12,
      priorityLevel: isTagalog ? 'Hindi Kwalipikadong Kahilingan' : 'Non-Qualifying Request',
      aiAssessmentSummary: isTagalog
        ? 'Ang inyong inilagay na sitwasyon sa Narrative Statement ay labas sa sakop ng Municipal Social Welfare and Development Office (MSWDO). Ang system na ito ay mahigpit na nakalaan lamang para sa opisyal na Social Assistance Programs (AICS Medical, AICS Funeral, Educational, PWD, Senior Citizen, Solo Parent, Child Welfare, Livelihood, at Skills Training).'
        : 'The situation described in your Narrative Statement falls outside the scope of the Municipal Social Welfare and Development Office (MSWDO). This system is strictly dedicated to official Social Assistance Programs (AICS Medical, AICS Funeral, Educational, PWD, Senior Citizen, Solo Parent, Child Welfare, Livelihood, and Skills Training).',
      policyNotes: isTagalog
        ? 'Patakaran ng MSWDO: Tanging mga lehitimong krisis at bulnerableng sektor sa loob ng system catalog ang maaaring ma-assess.'
        : 'Strict MSWDO Policy Guardrail: Only verified social welfare crises and statutory vulnerable sectors within the system catalog are eligible for assessment.',
      recommendedPrograms: [],
      engineSource: 'strict-guardrail'
    };
  }

  const matchedKeys = new Set();

  // Map selected hardship IDs strictly to official system tabKeys
  const hardshipList = Array.isArray(selectedHardships) ? selectedHardships : [];
  if (hardshipList.includes('medical') || /ospital|hospital|gamot|medicine|dialysis|chemo|surgery|operasyon|medical|sakit|admission|bill/.test(text)) {
    matchedKeys.add('aics-medical');
  }
  if (hardshipList.includes('bereavement') || /patay|namatay|libing|burol|funeral|burial|casket|deceased|death|parlor/.test(text)) {
    matchedKeys.add('aics-funeral');
  }
  if (hardshipList.includes('disability') || /pwd|disability|kapansanan|wheelchair|assistive|impairment|stroke/.test(text)) {
    matchedKeys.add('pwd-form');
  }
  if (hardshipList.includes('senior') || primaryApplicant.includes('Senior') || /senior|matanda|elderly|lolo|lola|60|pension/.test(text)) {
    matchedKeys.add('senior-form');
  }
  if (hardshipList.includes('soloparent') || /solo parent|single parent|raising.*alone|without spousal/.test(text)) {
    matchedKeys.add('soloparent-financial-form');
    if (/aral|school|tuition|student|educational|allowance|enroll/.test(text) || hardshipList.includes('educational')) {
      matchedKeys.add('soloparent-edu-form');
    }
  }
  if (hardshipList.includes('educational') || /aral|school|tuition|student|educational|allowance|enroll|college|high school/.test(text)) {
    if (matchedKeys.has('soloparent-financial-form')) {
      matchedKeys.add('soloparent-edu-form');
    } else {
      matchedKeys.add('aics-educational');
    }
  }
  if (hardshipList.includes('children') || /child|bata|infant|toddler|malnourish|daycare|nutrition|milk|underweight/.test(text)) {
    matchedKeys.add('childwelfare-form');
  }
  if (hardshipList.includes('livelihood_training') || hardshipList.includes('livelihood') || /negosyo|puhunan|livelihood|sari-sari|tindahan|vendor|capital|micro-enterprise|store/.test(text)) {
    matchedKeys.add('livelihood');
  }
  if (hardshipList.includes('livelihood_training') || hardshipList.includes('skills_training') || /training|vocational|tesda|skills|course|unemployed|walang trabaho/.test(text)) {
    matchedKeys.add('skills-training');
  }

  // If high income (> ₱30,000) and no statutory sector (PWD/Senior/Solo Parent) or acute medical/funeral crisis
  if (isHighIncome && !matchedKeys.has('pwd-form') && !matchedKeys.has('senior-form') && !matchedKeys.has('aics-medical') && !matchedKeys.has('aics-funeral')) {
    return {
      eligibilityStatus: 'NOT_ELIGIBLE',
      statusBadge: isTagalog
        ? 'Lagpas sa Indigent Income Threshold (Hindi Kwalipikado)'
        : 'Above Indigent Income Threshold (Not Eligible)',
      matchScore: 25,
      priorityLevel: isTagalog ? 'Lagpas sa Indigent Threshold' : 'Above Indigent Threshold',
      aiAssessmentSummary: isTagalog
        ? `Base sa inyong idineklarang buwanang kita (${householdIncome}), lagpas ang sambahayan sa indigent income ceiling ng MSWDO para sa regular cash grants. Tanging mga kagyat na medikal/funeral crisis o statutory sectors (PWD / Senior Citizen) ang maaaring isailalim sa espesyal na social worker evaluation.`
        : `Based on your declared monthly household income (${householdIncome}), your household exceeds the MSWDO indigent income ceiling for regular cash grants. Only acute medical or funeral crises or statutory welfare sectors (PWD / Senior Citizen) may qualify for special social worker evaluation.`,
      policyNotes: isTagalog
        ? 'Patakaran sa Indigency ng MSWDO: Ang mga prayoridad na tulong pinansyal ay para sa mga sambahayang pasok sa indigent o low-income threshold.'
        : 'MSWDO Indigency Policy: Priority financial grants require monthly household income within the indigent or low-income threshold.',
      recommendedPrograms: [],
      engineSource: 'rule-based'
    };
  }

  // Ensure at least 1 relevant system program if user left narrative brief
  if (matchedKeys.size === 0) {
    matchedKeys.add('aics-medical');
    matchedKeys.add('livelihood');
  }

  const recommendedPrograms = Array.from(matchedKeys).slice(0, 4).map((key, idx) => {
    const prog = OFFICIAL_MSWDO_SYSTEM_PROGRAMS[key];
    let matchConfidence = isLowIncome ? (98 - idx * 3) : isModerateIncome ? (84 - idx * 4) : (72 - idx * 4);
    let eligibilityTag = isLowIncome
      ? (idx === 0 ? 'Primary AI Match (100% Eligible)' : 'Highly Eligible')
      : 'Conditionally Eligible (For Validation)';

    let matchReason = '';
    switch (key) {
      case 'aics-medical':
        matchReason = isTagalog
          ? `Tugma sa inyong medikal/hospitalization crisis at ${householdIncome} income profile (${urgencyTimeline}).`
          : `Directly matches your medical/hospitalization crisis and ${householdIncome} household income profile (${urgencyTimeline}).`;
        break;
      case 'aics-funeral':
        matchReason = isTagalog
          ? 'Direktang sagot para sa gastusin sa punerarya at libing ng pumanaw na kapamilya sa ilalim ng AICS.'
          : 'Provides immediate burial and funeral parlor financial assistance for a deceased family member under AICS.';
        break;
      case 'aics-educational':
        matchReason = isTagalog
          ? `Tulong pang-edukasyon para sa dependent (${dependentMembers}) ng low-income household.`
          : `Provides educational financial support for studying dependents (${dependentMembers}) from a low-income household.`;
        break;
      case 'childwelfare-form':
        matchReason = isTagalog
          ? 'Para sa proteksyon, nutrisyon, at kapakanan ng mga bata sa sambahayan.'
          : 'Dedicated to child protection, nutrition, and developmental welfare support for vulnerable children in the household.';
        break;
      case 'pwd-form':
        matchReason = isTagalog
          ? 'Statutory financial at assistive support para sa miyembro ng pamilya na may kapansanan (PWD).'
          : 'Provides statutory financial subsidy and assistive device support for a household member with a disability (PWD).';
        break;
      case 'senior-form':
        matchReason = isTagalog
          ? 'Tulong pinansyal at pang-medikal para sa indigent Senior Citizen (60+ taong gulang).'
          : 'Provides social pension and medical welfare support for an indigent Senior Citizen (60 years old and above).';
        break;
      case 'soloparent-financial-form':
        matchReason = isTagalog
          ? 'Buwanan/crisis financial subsidy para sa Solo Parent na mag-isang nagtataguyod ng anak.'
          : 'Provides monthly or crisis financial subsidy for a verified Solo Parent supporting dependent children alone.';
        break;
      case 'soloparent-edu-form':
        matchReason = isTagalog
          ? 'Educational grant na nakalaan para sa nag-aaral na anak ng rehistradong Solo Parent.'
          : 'Provides an educational assistance grant dedicated to the studying child of a registered Solo Parent.';
        break;
      case 'livelihood':
        matchReason = isTagalog
          ? `Puhunan pang-kabuhayan (₱15,000) na angkop sa inyong employment status (${employmentStatus}).`
          : `Provides a ₱15,000 micro-enterprise capital grant suited to your current employment status (${employmentStatus}).`;
        break;
      case 'skills-training':
        matchReason = isTagalog
          ? 'Libreng vocational at TESDA-style skills training upang madagdagan ang kita ng pamilya.'
          : 'Offers free vocational and skills training courses to improve employability and household income.';
        break;
    }

    return {
      tabKey: prog.tabKey,
      programName: prog.programName,
      moduleLabel: prog.moduleLabel,
      benefitAmount: prog.benefitAmount,
      matchConfidence,
      eligibilityTag,
      matchReason,
      requirements: prog.defaultRequirements
    };
  });

  const topScore = recommendedPrograms[0]?.matchConfidence || 90;
  const eligibilityStatus = isLowIncome ? 'HIGHLY_ELIGIBLE' : 'CONDITIONALLY_ELIGIBLE';
  const statusBadge = isLowIncome
    ? (isTagalog
        ? 'Kumpirmadong Kwalipikado (Prayoridad na Indigent Category)'
        : 'High Eligibility Match Confirmed (Priority Indigent Category)')
    : (isTagalog
        ? 'Conditionally Eligible (Dadaan sa Social Worker Validation)'
        : 'Conditionally Eligible (Subject to Social Worker Case Validation)');

  const aiAssessmentSummary = isLowIncome
    ? (isTagalog
        ? `Base sa AI Pre-Screening ng inyong household profile (${householdIncome}, ${dependentMembers}, ${employmentStatus}) at sa inyong salaysay sa Step 3, ang inyong sambahayan ay PASOK sa Indigent Priority Criteria ng MSWDO. Narito ang mga opisyal na programa sa loob ng ating system na direktang tumutugon sa inyong sitwasyon.`
        : `Based on the AI Pre-Screening of your household profile (${householdIncome}, ${dependentMembers}, ${employmentStatus}) and your narrative statement in Step 3, your household meets the MSWDO Indigent Priority Criteria. Below are the official social assistance programs in our system that directly address your situation.`)
    : (isTagalog
        ? `Base sa AI Pre-Screening, ang inyong sambahayan (${householdIncome}) ay CONDITIONALLY ELIGIBLE. Maaari kayong magpasa ng aplikasyon sa mga inirekomendang programa sa ibaba, ngunit dadaan ito sa karagdagang case validation ng MSWDO Social Worker.`
        : `Based on the AI Pre-Screening, your household (${householdIncome}) is CONDITIONALLY ELIGIBLE. You may submit an application for the recommended programs below, subject to further case validation by an MSWDO Social Worker.`);

  return {
    eligibilityStatus,
    statusBadge,
    matchScore: topScore,
    priorityLevel: isLowIncome
      ? (isTagalog ? 'Prayoridad Kategorya 1 (Indigent / Krisis)' : 'Priority Category 1 (Indigent / Crisis)')
      : (isTagalog ? 'Kategorya 2 (Pangalawang Pagsusuri)' : 'Category 2 (Secondary Evaluation)'),
    aiAssessmentSummary,
    policyNotes: isTagalog
      ? `Sinuri sa ilalim ng MSWDO Social Case Intake Guidelines para sa ${barangay} (${welfareProgramStatus}).`
      : `Evaluated under MSWDO Social Case Intake Guidelines for ${barangay} (${welfareProgramStatus}).`,
    recommendedPrograms,
    engineSource: 'mswdo-rule-engine'
  };
}

app.post('/api/ai/eligibility-assessment', async (req, res) => {
  const payload = req.body || {};
  const isTagalog = payload.language === 'Tagalog';
  const fallbackResult = buildRuleBasedEligibilityAssessment(payload);

  // If strict guardrail already caught an obvious out-of-scope keyword, return immediately
  if (fallbackResult.engineSource === 'strict-guardrail') {
    return res.json(fallbackResult);
  }

  const geminiApiKey = (process.env.GEMINI_API_KEY || 'AIzaSyCr2mu87r0FCIcPKV9Ufevu5HV1mqck09g').trim();
  if (!geminiApiKey) {
    return res.json(fallbackResult);
  }

  const catalogListText = Object.values(OFFICIAL_MSWDO_SYSTEM_PROGRAMS)
    .map(p => `- tabKey: "${p.tabKey}" | Program Name: "${p.programName}" | Module: "${p.moduleLabel}" | Benefit: "${p.benefitAmount}"`)
    .join('\n');

  const languageRule = isTagalog
    ? 'Write "statusBadge", "aiAssessmentSummary", "policyNotes", and each program\'s "matchReason" entirely in clear, respectful Tagalog.'
    : 'Write "statusBadge", "aiAssessmentSummary", "policyNotes", and each program\'s "matchReason" strictly in 100% clear, professional English (do NOT use Tagalog or Taglish words).';

  const systemInstruction = `You are the Official AI Eligibility Assessment and Assistance Recommendation Engine for the Municipal Social Welfare and Development Office (MSWDO) Social Assistance Management Information System.

STRICT SYSTEM-ONLY GUARDRAIL RULES (MANDATORY):
1. You must ONLY evaluate and recommend programs from the following 10 official MSWDO programs that exist inside this system:
${catalogListText}

2. NEVER invent, mention, or recommend any program outside the 10 tabKeys listed above (do NOT recommend food packs, stranded travel/balik-probinsya, housing loans, SSS/Pag-IBIG, or anything not in the 10 tabKeys).
3. If the applicant's Narrative Statement is completely unrelated to social welfare, crisis assistance, disability, senior welfare, solo parenting, child welfare, education, or livelihood (for example: asking for gaming items, luxury goods, car loans, jokes/gibberish, or unrelated topics), OR if their monthly income is "Above ₱30,000 per month" with no valid crisis/disability/senior condition:
   - Set "eligibilityStatus" to "NOT_ELIGIBLE"
   - Set "matchScore" between 5 and 30
   - Set "recommendedPrograms" to an empty array []
   - Explain clearly why the request is outside the MSWDO system's scope or above the indigent income threshold.
4. Otherwise, select between 1 and 4 of the most relevant programs from the 10 allowed tabKeys based on the applicant's Step 1 demographics, Step 2 selected hardships, and Step 3 narrative statement.
5. ${languageRule}

Return ONLY valid JSON matching this exact structure:
{
  "eligibilityStatus": "HIGHLY_ELIGIBLE" | "CONDITIONALLY_ELIGIBLE" | "NOT_ELIGIBLE",
  "statusBadge": "string headline for the status banner",
  "matchScore": number (0 to 99),
  "priorityLevel": "string priority tier",
  "aiAssessmentSummary": "2-3 sentences explaining the AI eligibility assessment based on the citizen's income, dependents, and narrative",
  "policyNotes": "1 sentence MSWDO policy note",
  "recommendedPrograms": [
    {
      "tabKey": "MUST be one of the 10 exact tabKeys",
      "matchConfidence": number (65 to 99),
      "eligibilityTag": "e.g. Primary AI Match (98% Eligible) or Eligible",
      "matchReason": "1-2 sentences explaining why this specific MSWDO system program fits their situation"
    }
  ]
}`;

  const userPrompt = `Evaluate this Citizen Applicant for MSWDO Social Assistance:
- Primary Applicant: ${payload.primaryApplicant || 'Myself'}
- Monthly Household Income: ${payload.householdIncome || 'Below ₱10,000 per month'}
- Barangay: ${payload.barangay || 'Quezon City'}
- Dependent Members: ${payload.dependentMembers || '3 to 5 members'}
- Employment Status: ${payload.employmentStatus || 'Informal / Daily Wage'}
- Welfare Program Status: ${payload.welfareProgramStatus || 'Non-4Ps'}
- Health Insurance: ${payload.healthInsurance || 'PhilHealth Indigent'}
- Urgency Timeline: ${payload.urgencyTimeline || 'Immediate'}
- Housing / Residency Condition: ${payload.residencyCondition || 'Permanent Resident'}
- Selected Hardship Categories (Step 2): ${Array.isArray(payload.selectedHardships) ? payload.selectedHardships.join(', ') : 'None'}
- Special Vulnerability Checkboxes: ${Array.isArray(payload.specialCircumstances) ? payload.specialCircumstances.join('; ') : 'None'}
- Citizen Narrative Statement (Step 3): "${payload.narrative || ''}"`;

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`⚠️ [Gemini AI ${modelName}] HTTP ${response.status}:`, errText.slice(0, 200));
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);

      // Strictly filter & enrich recommendedPrograms against OFFICIAL_MSWDO_SYSTEM_PROGRAMS
      const validPrograms = Array.isArray(parsed.recommendedPrograms)
        ? parsed.recommendedPrograms
            .filter(item => item && item.tabKey && OFFICIAL_MSWDO_SYSTEM_PROGRAMS[item.tabKey])
            .slice(0, 4)
            .map(item => {
              const official = OFFICIAL_MSWDO_SYSTEM_PROGRAMS[item.tabKey];
              return {
                tabKey: official.tabKey,
                programName: official.programName,
                moduleLabel: official.moduleLabel,
                benefitAmount: official.benefitAmount,
                matchConfidence: typeof item.matchConfidence === 'number' ? item.matchConfidence : 92,
                eligibilityTag: item.eligibilityTag || 'AI Recommended Match',
                matchReason: item.matchReason || 'Matched against MSWDO eligibility criteria.',
                requirements: official.defaultRequirements
              };
            })
        : [];

      // If Gemini said ELIGIBLE but returned no valid system tabKeys, use fallback programs
      const finalPrograms = parsed.eligibilityStatus === 'NOT_ELIGIBLE'
        ? []
        : (validPrograms.length > 0 ? validPrograms : fallbackResult.recommendedPrograms);

      return res.json({
        eligibilityStatus: parsed.eligibilityStatus || fallbackResult.eligibilityStatus,
        statusBadge: parsed.statusBadge || fallbackResult.statusBadge,
        matchScore: typeof parsed.matchScore === 'number' ? parsed.matchScore : fallbackResult.matchScore,
        priorityLevel: parsed.priorityLevel || fallbackResult.priorityLevel,
        aiAssessmentSummary: parsed.aiAssessmentSummary || fallbackResult.aiAssessmentSummary,
        policyNotes: parsed.policyNotes || fallbackResult.policyNotes,
        recommendedPrograms: finalPrograms,
        engineSource: `gemini-ai (${modelName})`
      });
    } catch (aiErr) {
      console.warn(`⚠️ [Gemini AI ${modelName}] Exception:`, aiErr.message);
    }
  }

  // Fallback to deterministic MSWDO rule engine if all Gemini endpoints fail
  return res.json(fallbackResult);
});

app.listen(PORT, () => {
  console.log(`GovServe Backend API server listening on http://localhost:${PORT}`);
  initDB();
});

