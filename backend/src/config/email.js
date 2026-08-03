import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendOtpEmail(toEmail, otp) {
  if (!resend) {
    // Dev fallback: log OTP instead of sending an email
    console.log(`[DEV] OTP for ${toEmail}: ${otp}`);
    return;
  }
  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'Your Manifest login code',
    html: `<p>Your one-time code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });
}
