export function normalizeError(error) {
  if (error?.name === "AbortError") return new Error("La solicitud fue cancelada.");
  if (error instanceof TypeError) return new Error("No se pudo conectar con el servidor. Revisa tu conexión.");
  if (error?.message) return new Error(error.message);
  return new Error("Ocurrió un error inesperado.");
}