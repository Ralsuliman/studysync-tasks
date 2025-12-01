// server/src/utils/mailer.js
import nodemailer from "nodemailer";

export async function sendVerificationEmail(to, verifyLink) {
  const IS_PROD = process.env.NODE_ENV === "production";

  if (IS_PROD) {
    // 🔥 PRODUCTION — DO NOT use Ethereal. Just log.
    console.log("📨 [PROD] Verification email would be sent to:", to);
    console.log("🔗 Verify link:", verifyLink);
    return null; // no preview URL in production
  }

  // 🔧 LOCAL DEVELOPMENT — use Ethereal
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
      <p>Thank you for registering to StudySync Tasks.</p>
      <p>Please click the button below to verify your email:</p>
      <a href="${verifyLink}"
         style="
           padding:10px 18px;
           background:#4f46e5;
           color:white;
           text-decoration:none;
           border-radius:6px;
         ">
        Verify Email
      </a>
      <p>Or copy this link: ${verifyLink}</p>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log("📧 Preview URL:", previewUrl);

  return previewUrl;
}