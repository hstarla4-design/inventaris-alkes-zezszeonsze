import { askDashboardAi } from "./ai.service.js";

export async function chatWithDashboardAi(req, res, next) {
  try {
    const answer = await askDashboardAi(req.body || {});
    res.json({ answer });
  } catch (error) {
    next(error);
  }
}
