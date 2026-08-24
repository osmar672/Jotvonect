import { apiConfig } from "../config/api-config.js";
import { normalizeError } from "./error-normalizer.js";

async function parseResponse(response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text ? { message: text } : null;
  } catch {
    return null;
  }
}

export function createApiClient({ getToken, fetchImplementation = globalThis.fetch } = {}) {
  if (typeof fetchImplementation !== "function") {
    throw new Error("Fetch API no está disponible en este navegador.");
  }

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), apiConfig.requestTimeoutMs);

    try {
      const token = getToken?.();
      const headers = {
        Accept: "application/json",
        ...options.headers
      };

      if (options.body !== undefined) headers["Content-Type"] = "application/json";
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetchImplementation(`${apiConfig.baseUrl}${path}`, {
        ...options,
        headers,
        signal: options.signal || controller.signal
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(data?.message || `Error HTTP ${response.status}.`);
      }

      return data;
    } catch (error) {
      throw normalizeError(error);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return Object.freeze({
    get: path => request(path),
    post: (path, data) => request(path, { method: "POST", body: JSON.stringify(data) }),
    put: (path, data) => request(path, { method: "PUT", body: JSON.stringify(data) }),
    patch: (path, data) => request(path, { method: "PATCH", body: JSON.stringify(data) }),
    remove: path => request(path, { method: "DELETE" })
  });
}
