import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

console.log('Sending test email using account:', user);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass },
});

const htmlContent = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; padding: 24px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 28px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">QC GovServe</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">Quezon City Social Services & Development Department</p>
      </div>
      <div style="padding: 28px;">
        <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 0;">PWD Financial Assistance Application Approved!</h2>
        <p style="font-size: 15px; color: #334155; margin-bottom: 16px;">Dear <strong>Jefferson Fernando Lee</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
          Good day! Your application for <strong>PWD Financial Assistance Program</strong> has been officially approved and validated by Quezon City SSDD Social Workers.
        </p>

        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>Reference No:</strong> <span style="color: #2563eb; font-family: monospace; font-size: 15px; font-weight: 700;">PWD-2026-998811</span></p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Current Status:</strong> <span style="background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 12px; font-size: 13px; font-weight: 700;">APPROVED BY ADMIN</span></p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Approved Benefit:</strong> <span style="color: #059669; font-weight: 700;">₱1,500.00 Quarterly Pension & Financial Aid</span></p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Interview & Verification Schedule:</strong> <span style="color: #0f172a;">Oct 12, 2026 at 09:00 AM • QC Hall PWD Desk 2</span></p>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          You can log in to your <strong>GovServe Portal account</strong> anytime to track application progress, view appointment details, or check payout releases.
        </p>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
        This is an automated notification from QC GovServe Social Services System.
      </div>
    </div>
  </div>
`;

async function main() {
  try {
    const info = await transporter.sendMail({
      from: `"QC GovServe Social Services" <${user}>`,
      to: user,
      subject: 'QC GovServe Notice: Sample PWD Financial Assistance Application Approved (Ref: PWD-2026-998811)',
      text: 'PWD Financial Assistance Application Approved! Ref: PWD-2026-998811 Status: APPROVED BY ADMIN',
      html: htmlContent
    });
    console.log('✅ TEST EMAIL SENT SUCCESSFULLY! MessageId:', info.messageId);
  } catch (err) {
    console.error('❌ Error sending test email:', err.message);
  }
}

main();
