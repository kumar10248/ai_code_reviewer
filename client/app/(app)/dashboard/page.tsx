// app/(app)/dashboard/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────
interface Review {
  _id: string
  language: string
  aiSummary: string
  createdAt: string
  shareToken: string | null
}

// ─── Mock data — replace with your API call ───────────────────────
const MOCK_REVIEWS: Review[] = [
  {
    _id: "1",
    language: "javascript",
    aiSummary: "Found 2 critical SQL injection risks and 1 unbound cache. High priority fixes needed.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    shareToken: "abc123xyz",
  },
  {
    _id: "2",
    language: "python",
    aiSummary: "Code is generally clean. Minor style issues detected, one performance concern in loop.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    shareToken: null,
  },
  {
    _id: "3",
    language: "typescript",
    aiSummary: "Missing null checks on 3 optional fields. Potential runtime crash in production.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    shareToken: null,
  },
]

const LANG_COLOR: Record<string, string> = {
  javascript: "#fbbf24",
  typescript: "#3b82f6",
  python:     "#00ff9d",
  java:       "#fb923c",
  go:         "#00b4d8",
  rust:       "#f87171",
  cpp:        "#c084fc",
  php:        "#818cf8",
  unknown:    "#6b6b8a",
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function DashboardPage() {
  const router = useRouter()
  const [reviews] = useState<Review[]>(MOCK_REVIEWS)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  // TODO: replace with real API fetch on mount
  // useEffect(() => { api.get("/reviews").then(res => setReviews(res.data.reviews)) }, [])

  const filtered = reviews.filter(r =>
    r.language.includes(search.toLowerCase()) ||
    r.aiSummary.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={styles.root}>

      {/* ── SIDEBAR ── */}
      <aside style={styles.sidebar}>
        <div style={styles.sideTop}>
          <Link href="/" style={styles.logo}>
            <span style={{ color: "var(--accent)" }}>&lt;</span>ReviewAI
            <span style={{ color: "var(--accent)" }}>/&gt;</span>
          </Link>

          <button
            style={styles.newBtn}
            onClick={() => router.push("/review/new")}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
            New review
          </button>

          <nav style={styles.nav}>
            {[
              { icon: "▦", label: "Dashboard",   href: "/dashboard",  active: true  },
              { icon: "◷", label: "History",     href: "/dashboard",  active: false },
              { icon: "⇗", label: "Shared",      href: "/dashboard",  active: false },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  ...styles.navItem,
                  background:  item.active ? "var(--bg3)" : "transparent",
                  color:       item.active ? "var(--text)" : "var(--muted)",
                  borderColor: item.active ? "var(--border2)" : "transparent",
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* user footer */}
        <div style={styles.userRow}>
          <div style={styles.avatar}>JD</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>John Doe</p>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, fontFamily: "var(--font-mono)" }}>
              john@example.com
            </p>
          </div>
          <button
            style={styles.signOutBtn}
            onClick={() => router.push("/login")}
            title="Sign out"
          >
            ⎋
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={styles.main}>

        {/* header row */}
        <div style={styles.mainHeader}>
          <div>
            <h1 style={styles.pageTitle}>Your reviews</h1>
            <p style={styles.pageSub}>
              {reviews.length} total review{reviews.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* search */}
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              style={styles.searchInput}
              placeholder="Search by language or summary..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* stats row */}
        <div style={styles.statsRow}>
          {[
            { label: "Total reviews",  val: reviews.length },
            { label: "Shared links",   val: reviews.filter(r => r.shareToken).length },
            { label: "This week",      val: reviews.filter(r =>
                Date.now() - new Date(r.createdAt).getTime() < 7 * 86400000
              ).length },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <span style={styles.statVal}>{s.val}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* review list */}
        {filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 32, color: "var(--border2)" }}>{"{ }"}</p>
            <p style={{ color: "var(--muted)", fontSize: 15 }}>
              {search ? "No reviews match your search." : "No reviews yet. Submit your first one!"}
            </p>
            {!search && (
              <button style={styles.newBtn} onClick={() => router.push("/review/new")}>
                + New review
              </button>
            )}
          </div>
        ) : (
          <div style={styles.list}>
            {filtered.map(review => (
              <div
                key={review._id}
                style={styles.reviewCard}
                onClick={() => router.push(`/review/${review._id}`)}
              >
                {/* card left */}
                <div style={styles.cardLeft}>
                  <div style={styles.cardTop}>
                    <span style={{
                      ...styles.langBadge,
                      color:        LANG_COLOR[review.language] || "var(--muted)",
                      background:   `${LANG_COLOR[review.language] || "#6b6b8a"}15`,
                      borderColor:  `${LANG_COLOR[review.language] || "#6b6b8a"}30`,
                    }}>
                      {review.language}
                    </span>

                    {review.shareToken && (
                      <span style={styles.sharedBadge}>⇗ shared</span>
                    )}

                    <span style={styles.timeAgo}>{timeAgo(review.createdAt)}</span>
                  </div>

                  <p style={styles.summary}>{review.aiSummary}</p>
                </div>

                {/* card actions */}
                <div
                  style={styles.cardActions}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    style={styles.actionBtn}
                    onClick={() => router.push(`/review/${review._id}`)}
                    title="Open review"
                  >
                    Open →
                  </button>
                  <button
                    style={{ ...styles.actionBtn, color: "var(--red)" }}
                    onClick={() => setDeleteId(review._id)}
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteId && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Delete review?</h3>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24, lineHeight: 1.6 }}>
              This will permanently delete the review and all its inline comments. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                style={styles.cancelBtn}
                onClick={() => setDeleteId(null)}
              >
                Cancel
              </button>
              <button
                style={styles.deleteBtn}
                onClick={() => {
                  // TODO: api.delete(`/reviews/${deleteId}`)
                  setDeleteId(null)
                }}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg)",
  },

  // Sidebar
  sidebar: {
    width: 240,
    background: "var(--bg2)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "24px 16px",
    flexShrink: 0,
  },
  sideTop: { display: "flex", flexDirection: "column", gap: 24 },
  logo: {
    fontFamily: "var(--font-mono)",
    fontSize: 15,
    fontWeight: 600,
    padding: "0 8px",
    display: "inline-block",
  },
  newBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--accent)",
    border: "none",
    color: "#000",
    padding: "10px 14px",
    borderRadius: "var(--radius)",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "var(--font-sans)",
    width: "100%",
    cursor: "pointer",
  },
  nav: { display: "flex", flexDirection: "column", gap: 2 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderRadius: "var(--radius)",
    fontSize: 14,
    border: "1px solid transparent",
    transition: "all 0.15s",
    fontFamily: "var(--font-sans)",
  },
  navIcon: { fontSize: 14, width: 16, textAlign: "center" },

  // user row
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px",
    background: "var(--bg3)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "rgba(0,255,157,0.15)",
    border: "1px solid rgba(0,255,157,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 600,
    color: "var(--accent)",
    flexShrink: 0,
  },
  signOutBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    fontSize: 16,
    padding: 0,
    cursor: "pointer",
  },

  // Main
  main: {
    flex: 1,
    padding: "32px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 28,
    overflowY: "auto",
  },
  mainHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "-0.5px",
    fontFamily: "var(--font-sans)",
  },
  pageSub: { fontSize: 13, color: "var(--muted)", marginTop: 4 },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "0 14px",
    minWidth: 260,
  },
  searchIcon: { color: "var(--muted)", fontSize: 16 },
  searchInput: {
    background: "transparent",
    border: "none",
    color: "var(--text)",
    padding: "10px 0",
    fontSize: 13,
    fontFamily: "var(--font-mono)",
    outline: "none",
    width: "100%",
  },

  // Stats
  statsRow: { display: "flex", gap: 14 },
  statCard: {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "18px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 120,
  },
  statVal: {
    fontFamily: "var(--font-mono)",
    fontSize: 28,
    fontWeight: 600,
    color: "var(--accent)",
    lineHeight: 1,
  },
  statLabel: { fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-sans)" },

  // Review list
  list: { display: "flex", flexDirection: "column", gap: 10 },
  reviewCard: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "18px 20px",
    cursor: "pointer",
    transition: "border-color 0.15s",
  },
  cardLeft: { flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 },
  cardTop: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  langBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 4,
    border: "1px solid",
  },
  sharedBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--accent)",
    background: "rgba(0,255,157,0.08)",
    border: "1px solid rgba(0,255,157,0.2)",
    borderRadius: 4,
    padding: "2px 8px",
  },
  timeAgo: {
    fontSize: 11,
    color: "var(--muted)",
    fontFamily: "var(--font-mono)",
    marginLeft: "auto",
  },
  summary: {
    fontSize: 13,
    color: "var(--muted)",
    lineHeight: 1.5,
    fontFamily: "var(--font-sans)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardActions: {
    display: "flex",
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--muted)",
    padding: "6px 14px",
    borderRadius: "var(--radius)",
    fontSize: 12,
    fontFamily: "var(--font-sans)",
    cursor: "pointer",
    transition: "all 0.15s",
  },

  // Empty state
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: "80px 0",
    textAlign: "center",
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  modal: {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "28px 32px",
    maxWidth: 400,
    width: "90%",
  },
  cancelBtn: {
    background: "transparent",
    border: "1px solid var(--border2)",
    color: "var(--muted)",
    padding: "9px 20px",
    borderRadius: "var(--radius)",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  },
  deleteBtn: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid var(--red)",
    color: "var(--red)",
    padding: "9px 20px",
    borderRadius: "var(--radius)",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
  },
}