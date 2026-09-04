import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config({ path: '.env.txt' });

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  await resend.emails.send({
    from: 'Finovia <noreply@goodiebag.name.ng>',
    to,
    subject,
    html,
  });
}