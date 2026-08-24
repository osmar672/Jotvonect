import { apiConfig } from "../config/api-config.js";
import { AppError, createHttpError, normalizeError } from "./error-normalizer.js";

function buildUrl(path) {
  if (typeof path !== "string" || !path.trim()) {
    throw new AppError("La ruta de la API es obligatoria.", {
      code: "INVALID_API_PATH"
    });
  }

  const baseUrl = new URL(apiConfig.baseUrl);
  const url = new URL(path.trim(), `${baseUrl.href.replace(/\/$/, "")}/`);

  if (url.origin !== baseUrl.origin) {
    throw new AppError("La ruta solicitada no pertenece a la API configurada.", {
      code: "EXTERNAL_API_PATH"
    });
  }

  return url.href;
}

async function parseSuccessfulResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawBody);
    } catch (error) {
      throw new AppError("El servicio devolvió una respuesta JSON inválida.", {
        code: "INVALID_JSON_RESPONSE",
        cause: error
      });
    }
  }

  return rawBody;
}

export function createApiClient({ getToken }) {
  if (typeof getToken !== "function") {
    throw new TypeError("createApiClient requiere una función getToken.");
  }

  const request = async (path, options = {}) => {
    const { method = "GET", data } = options;

    try {
      const token = getToken();
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json"
      };

      if (typeof token === "string" && token.trim()) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }

      const response = await fetch(buildUrl(path), {
        method,
        headers,
        body: data === undefined ? undefined : JSON.stringify(data)
      });

      if (!response.ok) {
        throw await createHttpError(response);
      }

      return await parseSuccessfulResponse(response);
    } catch (error) {
      throw normalizeError(error, "No fue posible completar la solicitud.");
    }
  };

  return Object.freeze({
    get: async (path) => request(path),
    post: async (path, data) => request(path, { method: "POST", data }),
    put: async (path, data) => request(path, { method: "PUT", data }),
    patch: async (path, data) => request(path, { method: "PATCH", data }),
    remove: async (path) => request(path, { method: "DELETE" })
  });
}
