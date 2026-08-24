import { apiConfig } from "../config/api-config.js";

const TOKEN_KEY = "jobconnect.token";
const USER_KEY = "jobconnect.user";

export async function login(username, password) {
  if (!username?.trim() || !password) throw new Error("Completa usuario y contraseña.");
  const response = await fetch(`${apiConfig.baseUrl}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: username.trim(), password })
  });
  let data = null; try { data = await response.json(); } catch {}
  if (!response.ok) throw new Error(data?.message || "Credenciales incorrectas.");
  const token = data?.accessToken || data?.token;
  if (!token) throw new Error("El servidor no devolvió un token.");
  const user = {
    id: data.id, username: data.username, email: data.email,
    firstName: data.firstName, lastName: data.lastName, image: data.image
  };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}
export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function getCurrentUser() { try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; } }
export function isAuthenticated() { return Boolean(getToken()); }
export function requireAuth() {
  if (isAuthenticated()) return true;
  window.location.replace("login.html"); return false;
}
export function logout() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }
