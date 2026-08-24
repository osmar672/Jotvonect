import { apiConfig } from "../config/api-config.js";
import { normalizeError } from "../core/error-normalizer.js";

export const TOKEN_KEY = "jobconnect.token";
export const USER_KEY = "jobconnect.user";

export async function login(username, password, fetchImplementation = globalThis.fetch) {
  const normalizedUsername = username?.trim();

  if (!normalizedUsername || !password) {
    throw new Error("Completa el usuario y la contraseña.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), apiConfig.requestTimeoutMs);

  try {
    const response = await fetchImplementation(`${apiConfig.baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      credentials: "include",
      signal: controller.signal,
      body: JSON.stringify({
        username: normalizedUsername,
        password,
        expiresInMins: 60
      })
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || "Credenciales incorrectas.");
    }

    const token = data?.accessToken || data?.token;
    if (!token) throw new Error("DummyJSON no devolvió un token de sesión.");

    const user = {
      id: data.id,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      image: data.image
    };

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
  } catch (error) {
    throw normalizeError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function requireAuth() {
  if (isAuthenticated()) return true;

  window.location.replace("login.html");
  return false;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
