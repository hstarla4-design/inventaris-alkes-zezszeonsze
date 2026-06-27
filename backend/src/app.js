import express from "express";
import cors from "cors";
import helmet from "helmet";

import { validateEnv, env } from "./config/index.js";

import { apiRateLimit } from "./middlewares/rate-limit.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

import { apiRoutes } from "./routes/index.js";

import { logger } from "./utils/logger.js";

import { startEmailScheduler } from "./automation/schedulers/email.scheduler.js";

validateEnv();

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());

  app.use(express.json({ limit: "2mb" }));

  app.use(apiRateLimit);

  app.use("/api", apiRoutes);

  app.use(errorMiddleware);

  return app;
}

console.log("APP JS LOADED");

const app = createApp();

console.log("BEFORE APP LISTEN");

app.listen(env.PORT || 3000, () => {
  logger.info(`Server running on port ${env.PORT || 3000}`);

  console.log("STARTING EMAIL SCHEDULER");

  startEmailScheduler();
});