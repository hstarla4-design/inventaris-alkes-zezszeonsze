import dotenv from "dotenv";
import path from "node:path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const requiredInProduction = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "JWT_SECRET",
];

function readEnv(name, fallback = "") {
  return process.env[name] ?? fallback;
}

export function validateEnv() {
  if (readEnv("NODE_ENV", "development") !== "production") return;
  const missing = requiredInProduction.filter((key) => !readEnv(key));
  if (missing.length) {
    throw new Error(`Missing production environment variables: ${missing.join(", ")}`);
  }
}

export const env = {
  nodeEnv: readEnv("NODE_ENV", "development"),
  port: Number(readEnv("PORT", "3000")),
  jwtSecret: readEnv("JWT_SECRET"),
  supabase: {
    url: readEnv("SUPABASE_URL", "https://brupcvzzrzflfujaijnw.supabase.co"),
    anonKey: readEnv("SUPABASE_ANON_KEY", "sb_publishable_eQ8iUSOr42sMAgHjXE2ecA_FtvIDoRF"),
    serviceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  },
  telegram: {
    botToken: readEnv("TELEGRAM_BOT_TOKEN"),
    chatId: readEnv("TELEGRAM_CHAT_ID"),
  },
  gmail: {
    user: readEnv("GMAIL_USER"),
    appPassword: readEnv("GMAIL_APP_PASSWORD"),
  },
  firebase: {
    projectId: readEnv("FIREBASE_PROJECT_ID"),
    privateKey: readEnv("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n"),
    clientEmail: readEnv("FIREBASE_CLIENT_EMAIL"),
  },
};
