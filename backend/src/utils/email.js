const nodemailer = require("nodemailer");

const RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES || 15);

function hasSmtpConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  return Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);
}

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!hasSmtpConfig()) {
    throw new Error("SMTP settings are missing. Add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS to backend/.env.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE || "").toLowerCase() === "true" || Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

function buildPasswordResetEmail({ name, resetLink }) {
  const recipientName = name || "Customer";

  return {
    subject: "Password Reset Request",
    text: [
      `Hello ${recipientName},`,
      "",
      "We received a request to reset your ElectroServe account password.",
      `Reset your password using this secure link: ${resetLink}`,
      "",
      `This link will expire in ${RESET_TOKEN_TTL_MINUTES} minutes.`,
      "If you did not request this change, you can safely ignore this email and your password will remain unchanged.",
      "",
      "Regards,",
      "ElectroServe Support",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #183b5f; line-height: 1.6;">
        <p>Hello ${recipientName},</p>
        <p>We received a request to reset your ElectroServe account password.</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 18px; border-radius: 8px; background: #2370c6; color: #ffffff; text-decoration: none; font-weight: 700;">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link will expire in ${RESET_TOKEN_TTL_MINUTES} minutes.</p>
        <p>If you did not request this change, you can safely ignore this email and your password will remain unchanged.</p>
        <p>Regards,<br />ElectroServe Support</p>
      </div>
    `,
  };
}

async function sendPasswordResetEmail({ to, name, resetLink }) {
  if (!hasSmtpConfig()) {
    console.log("Password reset email preview");
    console.log(`To: ${to}`);
    console.log(`Reset link: ${resetLink}`);

    return {
      mode: "preview",
      previewMessage: "SMTP is not configured. Use the reset link below for local testing.",
      resetLink,
    };
  }

  const transporter = getTransporter();
  const emailContent = buildPasswordResetEmail({ name, resetLink });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html,
  });

  return {
    mode: "smtp",
    previewMessage: "",
    resetLink: "",
  };
}

module.exports = {
  RESET_TOKEN_TTL_MINUTES,
  sendPasswordResetEmail,
};
