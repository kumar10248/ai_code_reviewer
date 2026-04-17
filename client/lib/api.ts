const BASE = "http://localhost:8000/api/v1"


function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.msg || data.message || "Request failed")
  return data
}

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  login:    (body: { email: string; password: string }) =>
    request<{ token: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  register: (body: { name: string; email: string; password: string }) =>
    request<{ token: string }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),

  me: () =>
    request<{ success: boolean; user: { _id: string; name: string; email: string } }>("/auth/me"),
}

// ── Reviews ───────────────────────────────────────────────────────
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
    request<{ review: Review; comments: ReviewComment[] }>(`/share/${token}`),
}