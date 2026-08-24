import { apiConfig } from "../config/api-config.js";
import { normalizeError } from "./error-normalizer.js";

export function createApiClient({ getToken }) {
  async function request(path, options = {}) {
    try {
      const token = getToken?.();
      const headers = { Accept: "application/json", ...options.headers };
      if (options.body !== undefined) headers["Content-Type"] = "application/json";
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${apiConfig.baseUrl}${path}`, { ...options, headers });
      let data = null;
      try { data = await response.json(); } catch {}
      if (!response.ok) {
        const message = data?.message || `Error HTTP ${response.status}`;
        throw new Error(message);
      }
      return data;
    } catch (error) {
      throw normalizeError(error);
    }
  }
  return {
    get: path => request(path),
    post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
    put: (path, data) => request(path, { method: "PUT", body: JSON.stringify(data) }),
    patch: (path, data) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
    remove: path => request(path, { method: "DELETE" })
  };
}