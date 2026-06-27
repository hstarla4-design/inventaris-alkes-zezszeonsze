import { validateEnv } from "../../config/index.js";
import { runVendorEmailJob } from "../../jobs/vendor-email.job.js";

validateEnv();
await runVendorEmailJob();
