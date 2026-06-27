import { InventoryService } from "./inventory.service.js";

const service = new InventoryService();

export async function listInventory(req, res, next) {
  try {
    const rows = await service.listForRole(req.user);
    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
}
