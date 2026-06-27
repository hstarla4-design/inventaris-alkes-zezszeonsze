import { Router } from "express";
import { listInventory } from "./inventory.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

export const inventoryRoutes = Router();

inventoryRoutes.get("/", authMiddleware, listInventory);
