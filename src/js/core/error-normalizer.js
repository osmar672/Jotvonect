export function normalizeError(error) {
  if (error?.name === "AbortError") {
    return new Error("La solicitud tardó demasiado y fue cancelada. Intenta nuevamente.");
  }

  if (error instanceof TypeError) {
    return new Error("No se pudo conectar con DummyJSON. Revisa tu conexión a Internet.");
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return new Error(error.message.trim());
  }

  return new Error("Ocurrió un error inesperado.");
}
