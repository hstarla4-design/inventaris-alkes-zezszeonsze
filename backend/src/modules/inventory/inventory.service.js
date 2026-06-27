import { InventoryRepository } from "./inventory.repository.js";

export class InventoryService {
  constructor(repository = new InventoryRepository()) {
    this.repository = repository;
  }

  async listForRole(user) {
    if (user.role === "Kepala Ruangan" && user.ruangan_id) {
      return this.repository.listByRoom(user.ruangan_id);
    }
    return this.repository.listWithRooms();
  }
}
