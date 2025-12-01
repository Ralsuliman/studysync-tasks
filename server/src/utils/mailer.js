import nodemailer from "nodemailer";

export async function sendVerificationEmail(to, verifyLink) {
  // Ethereal test account
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
      <p>
        <a href="${verifyLink}"
           style="
              padding:10px 18px;
              background:#4f46e5;
              color:white;
              text-decoration:none;
              border-radius:6px;
              display:inline-block;
              margin-top:10px;
           ">
          Verify Email
        </a>
      </p>
      <p>If the button does not work, copy this link into your browser:</p>
      <p>${verifyLink}</p>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  console.log("✅ Verification email sent!");
  console.log("📧 Preview URL (open in browser):", previewUrl);

  return previewUrl;
}