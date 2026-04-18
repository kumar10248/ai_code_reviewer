// lib/useAuth.ts
// Centralized auth hook used by login, register, and protected pages

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthStatus, clearToken } from "@/lib/api"

type AuthState = "checking" | "authenticated" | "unauthenticated"

/**
 * useAuthGuard — for PROTECTED pages (dashboard, review pages)
 * Redirects to /login if token is missing or expired.
 * Returns { ready } — render nothing until ready = true
 */
export function useAuthGuard() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const status = getAuthStatus()
    if (status === "valid") {
      setReady(true)
    } else {
      // expired or none — clear any stale token and go to login
      clearToken()
      router.replace("/login")
    }
  }, [])

  return { ready }
}

/**
 * useGuestGuard — for AUTH pages (login, register)
 * If user already has a valid token, redirect to dashboard immediately.
 * Returns { ready } — render nothing until ready = true
 */
export function useGuestGuard() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const status = getAuthStatus()
    if (status === "valid") {
      // already logged in — skip login page
      router.replace("/dashboard")
    } else {
      setReady(true)
    }
  }, [])

  return { ready }
}

/**
 * useHandleUnauthorized — call this inside catch blocks on protected pages
 * If the API returns 401, clears token and redirects to login
 */
export function useHandleUnauthorized() {
  const router = useRouter()

  return (err: any) => {
    const msg = err?.message?.toLowerCase() || ""
    if (msg.includes("unauthorized") || msg.includes("token") || msg.includes("401")) {
      clearToken()
      router.replace("/login")
      return true
    }
    return false
  }
}