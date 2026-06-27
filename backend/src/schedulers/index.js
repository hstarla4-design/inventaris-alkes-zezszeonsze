import cron from "node-cron";
import { runVendorEmailJob } from "../jobs/vendor-email.job.js";

export function registerSchedulers() {
  cron.schedule("*/5 * * * *", () => {
    runVendorEmailJob().catch((error) => console.error(error));
  });
}
