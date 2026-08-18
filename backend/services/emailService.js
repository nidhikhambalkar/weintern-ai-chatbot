const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || 'WeIntern Admissions <admissions@we-intern.in>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@we-intern.in';

let transporter = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * Send Enrollment Confirmation Email to Student
 */
async function sendStudentEnrollmentEmail(details) {
  const {
    name,
    email,
    phone,
    preferred_domain,
    internship_duration,
    amount,
    payment_id,
    payment_status,
    created_at
  } = details;

  const subject = `🎉 Enrollment Confirmed: Welcome to WeIntern (${preferred_domain})`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2563eb;">
        <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">WeIntern Internship Program</h1>
        <p style="color: #475569; margin-top: 5px; font-size: 14px;">Official Enrollment & Payment Receipt</p>
      </div>

      <div style="padding: 20px 0;">
        <h2 style="color: #1e293b; font-size: 18px;">Congratulations, ${name}! 🚀</h2>
        <p style="color: #334155; line-height: 1.6; font-size: 14px;">
          Your registration and payment for the <strong>WeIntern Internship Program</strong> have been successfully verified and confirmed.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="color: #0f172a; margin-top: 0; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
            📋 Enrollment Details
          </h3>
          <table style="width: 100%; font-size: 14px; color: #334155; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; width: 40%;">Student Name:</td>
              <td style="padding: 6px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Selected Domain:</td>
              <td style="padding: 6px 0; color: #2563eb; font-weight: bold;">${preferred_domain}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Internship Duration:</td>
              <td style="padding: 6px 0;">${internship_duration}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Amount Paid:</td>
              <td style="padding: 6px 0; color: #166534; font-weight: bold;">₹${amount}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Payment Status:</td>
              <td style="padding: 6px 0;"><span style="background-color: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${payment_status}</span></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Payment ID / Transaction ID:</td>
              <td style="padding: 6px 0; font-family: monospace;">${payment_id}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Date & Time:</td>
              <td style="padding: 6px 0;">${new Date(created_at).toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #0f172a; font-size: 15px;">📌 Next Steps:</h3>
        <ol style="color: #334155; line-height: 1.6; font-size: 14px; padding-left: 20px;">
          <li>Our admissions team will send your batch schedule and orientation details within 24 hours.</li>
          <li>You will receive your mentor allocation and Discord/Slack community invite.</li>
          <li>Keep your Payment ID (<strong>${payment_id}</strong>) handy for reference.</li>
        </ol>

        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; margin-top: 20px; font-size: 13px; color: #1e40af;">
          <strong>Need Help?</strong> Contact WeIntern Admissions at <a href="mailto:contact@we-intern.in" style="color: #2563eb;">contact@we-intern.in</a> or WhatsApp at <strong>+91 74149 74582</strong>.
        </div>
      </div>

      <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94a3b8;">
        © WeIntern Pvt Ltd. All rights reserved. | <a href="https://we-intern.in" style="color: #64748b;">we-intern.in</a>
      </div>
    </div>
  `;

  if (!transporter) {
    console.log('\n====================================================');
    console.log(' [EMAIL SERVICE - LOG FALLBACK] STUDENT ENROLLMENT EMAIL');
    console.log('====================================================');
    console.log(` To:      ${email}`);
    console.log(` Subject: ${subject}`);
    console.log(` Body Snippet: ${name} enrolled in ${preferred_domain} (${internship_duration}) - Paid ₹${amount} - Payment ID: ${payment_id}`);
    console.log('====================================================\n');
    return { success: true, mode: 'logged' };
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject,
      html: htmlContent,
    });
    console.log(`[EMAIL SERVICE] Student enrollment email sent to ${email} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send student email to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send Notification Email to Admin
 */
async function sendAdminNotificationEmail(details) {
  const {
    name,
    email,
    phone,
    preferred_domain,
    internship_duration,
    amount,
    payment_id,
    payment_status,
    created_at
  } = details;

  const subject = `NEW PAID ENROLLMENT - ${name} (${preferred_domain})`;

  const textContent = `
NEW PAID ENROLLMENT

Student: ${name}
Email: ${email}
Phone: ${phone}
Domain: ${preferred_domain}
Internship Duration: ${internship_duration}
Amount: ₹${amount}
Payment ID: ${payment_id}
Payment Status: ${payment_status}
Payment Date: ${new Date(created_at).toLocaleString()}

Student has successfully enrolled and paid server-side verified amount.
`;

  if (!transporter) {
    console.log('\n====================================================');
    console.log(' [EMAIL SERVICE - LOG FALLBACK] ADMIN NOTIFICATION EMAIL');
    console.log('====================================================');
    console.log(` To:      ${ADMIN_EMAIL}`);
    console.log(` Subject: ${subject}`);
    console.log(textContent);
    console.log('====================================================\n');
    return { success: true, mode: 'logged' };
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: ADMIN_EMAIL,
      subject,
      text: textContent,
    });
    console.log(`[EMAIL SERVICE] Admin notification email sent to ${ADMIN_EMAIL} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL SERVICE ERROR] Failed to send admin email to ${ADMIN_EMAIL}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendStudentEnrollmentEmail,
  sendAdminNotificationEmail,
};
