export class AppError extends Error {
  constructor(message, options = {}) {
    const { status = null, code = "UNEXPECTED_ERROR", details = null, cause } = options;

    super(message, cause ? { cause } : undefined);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getPayloadMessage(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidate = payload.message || payload.error || payload.detail;
  return typeof candidate === "string" ? candidate.trim() : "";
}

export async function createHttpError(response) {
  let payload = null;

  try {
    const contentType = response.headers.get("content-type") || "";
    payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch {
    payload = null;
  }

  const payloadMessage = typeof payload === "string" ? payload.trim() : getPayloadMessage(payload);
  const message = payloadMessage || `La solicitud no pudo completarse (${response.status}).`;

  return new AppError(message, {
    status: response.status,
    code: `HTTP_${response.status}`,
    details: payload
  });
}

export function normalizeError(error, fallbackMessage = "Ocurrió un error inesperado.") {
  if (error instanceof AppError) {
    return error;
  }

  if (error?.name === "AbortError") {
    return new AppError("La solicitud fue cancelada.", {
      code: "REQUEST_ABORTED",
      cause: error
    });
  }

  const isNetworkError = error instanceof TypeError && /fetch|network|conexi[oó]n/i.test(error.message || "");
  const message = isNetworkError
    ? "No fue posible conectar con el servicio. Revisa tu conexión e inténtalo nuevamente."
    : typeof error?.message === "string" && error.message.trim()
      ? error.message.trim()
      : fallbackMessage;

  return new AppError(message, {
    status: Number.isInteger(error?.status) ? error.status : null,
    code: typeof error?.code === "string" ? error.code : isNetworkError ? "NETWORK_ERROR" : "UNEXPECTED_ERROR",
    details: error?.details || null,
    cause: error
  });
}
