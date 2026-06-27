import { env } from "../../config/index.js";

function headers(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

export function createSupabaseRestClient(key) {
  async function request(path, options = {}) {
    const response = await fetch(`${env.supabase.url}/rest/v1/${path}`, {
      ...options,
      headers: {
        ...headers(key),
        ...options.headers,
      },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(data?.message || data?.hint || `Supabase HTTP ${response.status}`);
    }
    return data;
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
    patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (path) => request(path, { method: "DELETE" }),
  };
}
