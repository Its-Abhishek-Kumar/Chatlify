import nodemailer from "nodemailer";
export const sendRecoveryEmail = async (toEmail, resetLink) => {
    const host = process.env.SMTP_HOST || "";
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASS || "";
    if (!host || !user || !pass) {
        console.warn("[MAILER WARNING] SMTP credentials are not configured in backend/.env.");
        console.warn(`[MAILER FALLBACK] Link generated for ${toEmail}: ${resetLink}`);
        throw new Error("SMTP mailer is not configured. Please add SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS to backend/.env to send real emails.");
    }
    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass,
        },
    });
    const mailOptions = {
        from: `"Chatlify Support" <${user}>`,
        to: toEmail,
        subject: "Reset your Chatlify Password",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #2563eb; font-weight: bold; margin-bottom: 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">Chatlify Recovery</h2>
        <p style="color: #374151; font-size: 14px; line-height: 1.5;">
          We received a request to reset the password for your Chatlify account. Click the button below to set a new password:
        </p>
        <div style="margin: 25px 0; text-align: center;">
          <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 14px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 12px; line-height: 1.5;">
          This link will expire in 15 minutes. If you did not request this password reset, please ignore this email.
        </p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 10px; text-align: center;">
          &copy; 2026 Chatlify. All rights reserved.
        </p>
      </div>
    `,
    };
    await transporter.sendMail(mailOptions);
};
//# sourceMappingURL=mailer.js.map