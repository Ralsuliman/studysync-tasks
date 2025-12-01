// server/src/utils/mailer.js
import nodemailer from "nodemailer";

export async function sendVerificationEmail(to, verifyLink) {
  const IS_PROD = process.env.NODE_ENV === "production";

  if (IS_PROD) {
    // 🔥 PRODUCTION — DO NOT use Ethereal
    console.log("📨 [PROD] Verification email would be sent to:", to);
    console.log("🔗 Verify link:", verifyLink);
    return null;
  }

  // 🔧 DEVELOPMENT — Ethereal preview URL
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"StudySync Tasks" <no-reply@studysync.com>',
    to,
    subject: "Verify your StudySync email",
    html: `
      <h2>Email Verification</h2>
      <p>Click below to verify:</p>
      <a href="${verifyLink}">Verify Email</a>
      <p>Or copy: ${verifyLink}</p>
    `,
  });

  return nodemailer.getTestMessageUrl(info);
}