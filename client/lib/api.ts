// lib/api.ts
 
const BASE = "https://ai-code-reviewer-t0q0.onrender.com/api/v1"
 
/* ── Token helpers ────────────────────────────────────────────────── */
export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}
 
export function setToken(t: string) {
  localStorage.setItem("token", t)
}
 
export function clearToken() {
  localStorage.removeItem("token")
}
 
/* ── Check if JWT is expired client-side (without calling server) ── */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    // exp is in seconds, Date.now() is ms
    return payload.exp * 1000 < Date.now()
  } catch {
    return true // unparseable = treat as expired
  }
}
 
/* ── Check auth status ── */
export function getAuthStatus(): "valid" | "expired" | "none" {
  const token = getToken()
  if (!token) return "none"
  if (isTokenExpired(token)) {
    clearToken()
    return "expired"
  }
  return "valid"
}
 
/* ── Base request ─────────────────────────────────────────────────── */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
 
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",   // sends refreshToken cookie automatically
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
 
  const data = await res.json()
 
  // Token expired — clear it so UI can redirect
  if (res.status === 401) {
    clearToken()
    throw new Error(data.msg || "Unauthorized")
  }
 
  if (!res.ok) {
    throw new Error(data.msg || data.message || "Request failed")
  }
 
  return data
}
 
/* ── Auth API ─────────────────────────────────────────────────────── */
export const authAPI = {
  login: (body: { email: string; password: string }) =>
    request<{ token: string; msg: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
 
  register: (body: { name: string; email: string; password: string }) =>
    request<{ msg: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
 
  // GET /auth/me — returns logged-in user info
  me: () =>
    request<{ success: boolean; user: { _id: string; name: string; email: string } }>("/auth/me"),
}
 
/* ── Review types ─────────────────────────────────────────────────── */
export interface ReviewComment {
  _id?: string
  lineNumber: number
  severity: "info" | "warning" | "error"
  category: "security" | "performance" | "style" | "bug" | "best_practice" | "type_safety"
  message: string
  suggestion: string
}
 
export interface Review {
  _id: string
  language: string
  aiSummary: string
  score?: number
  createdAt: string
  shareToken: string | null
  shareExpiresAt?: string | null
  code?: string
  fix?: string
  tags?: string[]
}
 
export interface CreateReviewResponse {
  success: boolean
  reviewId: string
  summary: string
  score: number
  comments: ReviewComment[]
  fix: string
  tags: string[]
}

export const reviewAPI = {
  create: (body: { code: string; language?: string }) =>
    request<CreateReviewResponse>("/reviews", { method: "POST", body: JSON.stringify(body) }),

  getAll: (page = 1, limit = 20) =>
    request<{ reviews: Review[]; pagination: { total: number; page: number; pages: number } }>(
      `/reviews?page=${page}&limit=${limit}`
    ),

  getById: (id: string) =>
    request<{ review: Review; comments: ReviewComment[] }>(`/reviews/${id}`),

  delete: (id: string) =>
    request<{ message: string }>(`/reviews/${id}`, { method: "DELETE" }),

  createShare: (id: string) =>
    request<{ shareToken: string; shareExpiresAt: string }>(`/reviews/${id}/share`, { method: "POST" }),

  revokeShare: (id: string) =>
    request<{ message: string }>(`/reviews/${id}/share`, { method: "DELETE" }),
}

// ── Share (public) ────────────────────────────────────────────────
export const shareAPI = {
  get: (token: string) =>
    request<{ review: Review; comments: ReviewComment[] }>(`/reviews/share/${token}`),
}