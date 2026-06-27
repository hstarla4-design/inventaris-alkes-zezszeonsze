export class BaseRepository {
  constructor(client, table) {
    this.client = client;
    this.table = table;
  }

  list(query = "select=*") {
    return this.client.get(`${this.table}?${query}`);
  }

  findById(id, query = "select=*") {
    return this.client.get(`${this.table}?${query}&id=eq.${encodeURIComponent(id)}&limit=1`);
  }

  create(payload) {
    return this.client.post(this.table, payload);
  }

  update(id, payload) {
    return this.client.patch(`${this.table}?id=eq.${encodeURIComponent(id)}`, payload);
  }

  remove(id) {
    return this.client.delete(`${this.table}?id=eq.${encodeURIComponent(id)}`);
  }
}
