import { logger } from "../utils/logger.js";

export class AutomationEngine {
  constructor(rules = []) {
    this.rules = rules;
  }

  register(rule) {
    this.rules.push(rule);
  }

  async run(context = {}) {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      try {
        await rule.execute(context);
      } catch (error) {
        logger.error(`Automation rule failed: ${rule.name}`, { error: error.message });
      }
    }
  }
}
