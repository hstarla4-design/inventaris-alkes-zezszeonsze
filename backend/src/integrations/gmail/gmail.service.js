import nodemailer from "nodemailer";
import { env } from "../../config/index.js";

export function createGmailTransport() {
  if (!env.gmail.user || !env.gmail.appPassword) {
    throw new Error("Gmail credentials are not configured");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.gmail.user,
      pass: env.gmail.appPassword,
    },
  });
}

export async function sendHtmlEmail({ to, subject, html }) {
  const transport = createGmailTransport();
  return transport.sendMail({
    from: `"Rumah Sakit Zeonsze" <${env.gmail.user}>`,
    to,
    subject,
    html,
  });
}
