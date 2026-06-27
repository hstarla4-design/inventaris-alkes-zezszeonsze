import { Router } from "express";
import { inventoryRoutes } from "../modules/inventory/inventory.routes.js";
import { aiRoutes } from "../modules/ai/ai.routes.js";

export const apiRoutes = Router();

apiRoutes.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "inventaris-alkes-api" });
});

apiRoutes.use("/inventory", inventoryRoutes);
apiRoutes.use("/ai", aiRoutes);
