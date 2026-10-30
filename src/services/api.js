import { useUiStore } from "../store/uiStore";

// All server calls live here, so components never touch fetch() directly.
// In development Vite forwards /api to the Express server; in production they share one domain.
const BASE = "/api";

export const PAGE_SIZE = 12;

export const ORDER_PAGE_SIZE = 10;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class ApiError extends Error {
  status;
  issues;
  constructor(message, status, issues) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

// AuthContext registers a function here: any 401 from the server (expired or revoked session)
// signs the user out everywhere in the app, in one place.
let onUnauthorized = null;

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = "GET", body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      signal,
      credentials: "same-origin", // sends the httpOnly session cookie
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error; // React Query cancelled it on purpose
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* body was not JSON */
  }
  if (!response.ok) {
    const err = data ?? {};
    if (response.status === 401 && !path.startsWith("/auth/login")) onUnauthorized?.();
    throw new ApiError(err.message || `Request failed (${response.status})`, response.status, err.issues);
  }
  if (data === null) throw new ApiError("The server sent an unexpected answer.", response.status);
  return data;
}

const qs = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== undefined && v !== null) search.set(k, String(v));
  });
  return search.toString();
};

export const login = (email, password, remember) => request("/auth/login", { method: "POST", body: { email, password, remember } });

export const logout = () => request("/auth/logout", { method: "POST", body: {} });

export const fetchSession = (signal) => request("/auth/me", { signal });
/* ------------------------------- Reading ------------------------------- */
export const fetchCategories = (signal) => request("/categories", { signal });

export const fetchProducts = (query, signal) => request(`/products?${qs(query)}`, { signal });

export const fetchProduct = (id, signal) => request(`/products/${encodeURIComponent(String(id))}`, { signal });

export const suggestProducts = (q, signal) => request(`/products/suggest?${qs({ q })}`, { signal });

export const fetchOrders = (query, signal) => request(`/orders?${qs(query)}`, { signal });

export const fetchSummary = (signal) => request("/analytics/summary", { signal });

export const fetchActivity = (signal) => request("/activity", { signal });

export const fetchUsers = (signal) => request("/users", { signal });
/* ------------------------------- Writing ------------------------------- */
// Lets you demo the "what if the server fails?" path (see the user menu).
async function maybeFail() {
  if (useUiStore.getState().simulateFailures) {
    await sleep(700);
    throw new ApiError("The server rejected the change (simulated). Nothing was saved.", 500);
  }
}

export async function createProduct(values) {
  await maybeFail();
  return request("/products", { method: "POST", body: values });
}

export async function updateProduct(id, patch) {
  await maybeFail();
  return request(`/products/${id}`, { method: "PATCH", body: patch });
}

export async function deleteProduct(id) {
  await maybeFail();
  return request(`/products/${id}`, { method: "DELETE" });
}

export async function updateOrderStatus(id, status) {
  await maybeFail();
  return request(`/orders/${id}`, { method: "PATCH", body: { status } });
}

export async function placeRestock(items) {
  await maybeFail();
  return request("/restock", { method: "POST", body: { items } });
}

export const createUser = (body) => request("/users", { method: "POST", body });

export const patchUser = (id, patch) => request(`/users/${id}`, { method: "PATCH", body: patch });

export async function createOrder(body) {
  await maybeFail();
  return request("/orders", { method: "POST", body });
}

export const clearWorkspaceData = () => request("/admin/clear-data", { method: "POST", body: {} });

export const loadDemoData = () => request("/admin/load-demo", { method: "POST", body: {} });
