import { Router } from "express";
import { chatWithDashboardAi } from "./ai.controller.js";

export const aiRoutes = Router();

aiRoutes.post("/chat", chatWithDashboardAi);
