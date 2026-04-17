// app/(app)/dashboard/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

/* ─── Types ─────────────────────────────────────────────────────── */
interface Review {
  _id: string
  language: string
  aiSummary: string
  createdAt: string
  shareToken: string | null
  score?: number
}

/* ─── Mock data — replace with real API ─────────────────────────── */
const MOCK_REVIEWS: Review[] = [
  { _id: "1", language: "javascript", score: 3, aiSummary: "Found 2 critical SQL injection risks and 1 unbound cache. High priority fixes needed before deploy.", createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(), shareToken: "abc123xyz" },
  { _id: "2", language: "python",     score: 7, aiSummary: "Code is generally clean. Minor style issues detected, one performance concern in the main loop.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), shareToken: null },
  { _id: "3", language: "typescript", score: 5, aiSummary: "Missing null checks on 3 optional fields. Potential runtime crash in production environment.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), shareToken: null },
  { _id: "4", language: "go",         score: 9, aiSummary: "Well-structured and idiomatic. One minor suggestion around error wrapping conventions.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), shareToken: "xyz789" },
]

const LANG_COLOR: Record<string, string> = {
  javascript: "#fbbf24", typescript: "#3b82f6", python: "#00ff9d",
  java: "#fb923c", go: "#00c8e8", rust: "#f87171", cpp: "#c084fc",
  php: "#818cf8", unknown: "#6b6b8a",
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  const m = Math.floor(d / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function scoreColor(s?: number) {
  if (!s) return "#55556e"
  if (s <= 3) return "#f87171"
  if (s <= 5) return "#fb923c"
  if (s <= 7) return "#fbbf24"
  return "#00ff9d"
}

/* ─── Component ─────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter()
  const [reviews, setReviews]     = useState<Review[]>(MOCK_REVIEWS)
  const [deleteId, setDeleteId]   = useState<string | null>(null)
  const [search, setSearch]       = useState("")
  const [mounted, setMounted]     = useState(false)
  const [sideOpen, setSideOpen]   = useState(false)   // mobile sidebar toggle
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { setMounted(true) }, [])

  /* ambient dot-grid canvas for sidebar */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    let raf: number, W = 0, H = 0, frame = 0

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }
    resize()
    window.addEventListener("resize", resize)

    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      frame++
      const STEP = 32
      for (let y = 0; y <= H; y += STEP)
        for (let x = 0; x <= W; x += STEP) {
          const a = 0.03 + 0.1 * Math.abs(Math.sin(frame * 0.007 + x * 0.04 + y * 0.03))
          ctx.beginPath(); ctx.arc(x, y, 0.9, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0,255,157,${a})`; ctx.fill()
        }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [])

  const filtered = reviews.filter(r =>
    r.language.includes(search.toLowerCase()) ||
    r.aiSummary.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: "Total",   val: reviews.length,                                                             icon: "▦", color: "#00ff9d" },
    { label: "Shared",  val: reviews.filter(r => r.shareToken).length,                                   icon: "⇗", color: "#3b82f6" },
    { label: "This week", val: reviews.filter(r => Date.now() - new Date(r.createdAt).getTime() < 7*86400000).length, icon: "◷", color: "#fbbf24" },
    { label: "Avg score", val: reviews.filter(r=>r.score).length ? (reviews.reduce((a,r)=>a+(r.score||0),0)/reviews.filter(r=>r.score).length).toFixed(1) : "—", icon: "◈", color: "#c084fc" },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@400;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#08080e;--bg2:#0d0d15;--bg3:#141420;--bg4:#1c1c28;
          --border:#1c1c2a;--border2:#2a2a3e;
          --text:#e8e8f2;--muted:#55556e;
          --accent:#00ff9d;--red:#f87171;--yellow:#fbbf24;--blue:#3b82f6;--purple:#c084fc;
          --mono:'JetBrains Mono',monospace;--sans:'Syne',sans-serif;
          --r:10px;--rl:14px;
        }
        body{background:var(--bg);color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased;overflow:hidden}
        a{color:inherit;text-decoration:none}
        button{cursor:pointer;font-family:var(--sans)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}

        @keyframes fadeUp   {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn   {from{opacity:0}to{opacity:1}}
        @keyframes glowPulse{0%,100%{opacity:.45}50%{opacity:1}}
        @keyframes slideIn  {from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes popIn    {from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
        @keyframes scanH    {0%{left:-40%}100%{left:110%}}
        @keyframes shimmer  {0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes countUp  {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes deleteShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}

        /* sidebar */
        .sidebar{
          width:248px;background:var(--bg2);border-right:1px solid var(--border);
          display:flex;flex-direction:column;justify-content:space-between;
          padding:22px 14px;flex-shrink:0;position:relative;overflow:hidden;
          transition:transform .3s cubic-bezier(.22,1,.36,1);
        }
        .sidebar-glow{
          position:absolute;bottom:-40px;left:50%;transform:translateX(-50%);
          width:180px;height:180px;border-radius:50%;
          background:radial-gradient(circle,rgba(0,255,157,.06),transparent 70%);
          pointer-events:none;animation:glowPulse 5s ease-in-out infinite;
        }

        /* nav item */
        .nav-item{
          display:flex;align-items:center;gap:10px;
          padding:9px 12px;border-radius:var(--r);
          font-size:13px;border:1px solid transparent;
          transition:all .18s;color:var(--muted);
          position:relative;overflow:hidden;
        }
        .nav-item.active{background:var(--bg3);color:var(--text);border-color:var(--border2)}
        .nav-item.active::before{
          content:'';position:absolute;left:0;top:20%;bottom:20%;width:2px;
          background:var(--accent);border-radius:2px;
          box-shadow:0 0 8px rgba(0,255,157,.6);
        }
        .nav-item:hover:not(.active){background:rgba(255,255,255,.03);color:var(--text)}

        /* new review btn */
        .new-btn{
          display:flex;align-items:center;justify-content:center;gap:8px;
          background:var(--accent);border:none;color:#000;
          padding:11px 14px;border-radius:var(--r);
          font-size:13px;font-weight:700;width:100%;
          transition:box-shadow .2s,transform .2s;
        }
        .new-btn:hover{box-shadow:0 0 20px rgba(0,255,157,.45);transform:translateY(-1px)}

        /* stat cards */
        .stat-card{
          background:var(--bg2);border:1px solid var(--border);
          border-radius:var(--rl);padding:18px 20px;
          display:flex;flex-direction:column;gap:6px;
          flex:1;min-width:0;position:relative;overflow:hidden;
          transition:border-color .2s,transform .2s;
          animation:countUp .5s cubic-bezier(.22,1,.36,1) both;
        }
        .stat-card::after{
          content:'';position:absolute;top:0;left:-40%;width:40%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.02),transparent);
          animation:scanH 4s ease-in-out infinite;
        }
        .stat-card:hover{border-color:var(--border2);transform:translateY(-2px)}

        /* review cards */
        .review-card{
          display:flex;align-items:center;gap:16px;
          background:var(--bg2);border:1px solid var(--border);
          border-radius:var(--rl);padding:16px 18px;
          cursor:pointer;
          transition:border-color .18s,box-shadow .18s,transform .18s;
          animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;
          position:relative;overflow:hidden;
        }
        .review-card::before{
          content:'';position:absolute;left:0;top:0;bottom:0;width:3px;
          background:var(--lang-color,var(--border2));
          opacity:0;transition:opacity .18s;
        }
        .review-card:hover{
          border-color:var(--border2);
          box-shadow:0 4px 24px rgba(0,0,0,.25);
          transform:translateY(-1px);
        }
        .review-card:hover::before{opacity:1}

        /* action buttons */
        .action-btn{
          background:transparent;border:1px solid var(--border);color:var(--muted);
          padding:6px 12px;border-radius:var(--r);font-size:11px;
          transition:all .15s;white-space:nowrap;
        }
        .action-btn:hover{border-color:var(--border2);color:var(--text)}
        .action-btn.danger:hover{border-color:rgba(248,113,113,.4);color:var(--red);background:rgba(248,113,113,.05)}

        /* search */
        .search-wrap{
          display:flex;align-items:center;gap:8px;
          background:var(--bg2);border:1px solid var(--border);
          border-radius:var(--r);padding:0 14px;
          transition:border-color .2s,box-shadow .2s;
        }
        .search-wrap:focus-within{border-color:rgba(0,255,157,.35);box-shadow:0 0 0 3px rgba(0,255,157,.06)}

        /* modal */
        .modal-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,.65);
          display:flex;align-items:center;justify-content:center;
          z-index:300;backdrop-filter:blur(4px);
          animation:fadeIn .15s ease;
        }
        .modal-box{
          background:var(--bg2);border:1px solid var(--border2);
          border-radius:var(--rl);padding:28px 30px;
          max-width:400px;width:90%;
          animation:popIn .2s cubic-bezier(.22,1,.36,1);
          position:relative;overflow:hidden;
        }
        .modal-box::before{
          content:'';position:absolute;top:0;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent,rgba(248,113,113,.5),transparent);
        }

        /* mobile hamburger */
        .hamburger{display:none}

        /* ── Responsive ── */
        @media(max-width:900px){
          body{overflow:auto}
          .dashboard-root{flex-direction:column!important}
          .sidebar{
            width:100%!important;flex-direction:row!important;
            padding:14px 18px!important;
            align-items:center;justify-content:space-between;
            border-right:none!important;border-bottom:1px solid var(--border)!important;
            position:relative!important;
          }
          .sidebar.open .side-nav{display:flex!important}
          .side-nav{display:none;flex-direction:column;gap:4px;position:absolute;top:100%;left:0;right:0;background:var(--bg2);border-bottom:1px solid var(--border);padding:12px 18px;z-index:50}
          .side-user{display:none!important}
          .side-canvas{display:none!important}
          .sidebar-glow{display:none!important}
          .hamburger{display:flex!important;background:transparent;border:1px solid var(--border);color:var(--muted);padding:7px 10px;border-radius:var(--r);font-size:16px}
          .main-area{padding:20px 18px!important}
          .stats-row{grid-template-columns:1fr 1fr!important}
          .header-row{flex-direction:column!important;align-items:flex-start!important}
          .search-wrap{width:100%!important}
          .card-actions{display:none!important}
        }
        @media(max-width:500px){
          .stats-row{grid-template-columns:1fr 1fr!important}
          .review-card{flex-wrap:wrap}
        }
      `}</style>

      <div
        className="dashboard-root"
        style={{ display: "flex", height: "100vh", background: "var(--bg)", opacity: mounted ? 1 : 0, transition: "opacity .3s" }}
      >

        {/* ══ SIDEBAR ════════════════════════════════════════════════ */}
        <aside className={`sidebar${sideOpen ? " open" : ""}`}>
          <canvas ref={canvasRef} className="side-canvas" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />
          <div className="sidebar-glow" />

          {/* top section */}
          <div className="side-top" style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative", zIndex: 1 }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Link href="/" style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 600, padding: "0 4px" }}>
                <span style={{ color: "var(--accent)", textShadow: "0 0 12px rgba(0,255,157,.5)" }}>&lt;</span>
                ReviewAI
                <span style={{ color: "var(--accent)", textShadow: "0 0 12px rgba(0,255,157,.5)" }}>/&gt;</span>
              </Link>
              <button className="hamburger" onClick={() => setSideOpen(o => !o)}>☰</button>
            </div>

            <button className="new-btn" onClick={() => router.push("/review/new")}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="#000" strokeWidth="2" strokeLinecap="round"/></svg>
              New review
            </button>

            {/* nav */}
            <nav className="side-nav" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[
                { icon: "▦", label: "Dashboard", href: "/dashboard", active: true  },
                { icon: "◷", label: "History",   href: "/dashboard", active: false },
                { icon: "⇗", label: "Shared",    href: "/dashboard", active: false },
                { icon: "⚙", label: "Settings",  href: "/dashboard", active: false },
              ].map(item => (
                <Link key={item.label} href={item.href} className={`nav-item${item.active ? " active" : ""}`}>
                  <span style={{ fontSize: 13, width: 16, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                  {item.label === "Shared" && (
                    <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", background: "rgba(0,255,157,.1)", border: "1px solid rgba(0,255,157,.2)", borderRadius: 4, padding: "1px 6px" }}>
                      {reviews.filter(r => r.shareToken).length}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* user footer */}
          <div className="side-user" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 12px",
            background: "var(--bg3)", borderRadius: "var(--r)",
            border: "1px solid var(--border)",
            position: "relative", zIndex: 1,
          }}>
            {/* avatar with glow ring */}
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(0,255,157,.12)",
              border: "1px solid rgba(0,255,157,.35)",
              boxShadow: "0 0 10px rgba(0,255,157,.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "var(--accent)",
              fontFamily: "var(--mono)", flexShrink: 0,
            }}>JD</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>John Doe</p>
              <p style={{ fontSize: 10, color: "var(--muted)", margin: 0, fontFamily: "var(--mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>john@example.com</p>
            </div>
            <button
              onClick={() => router.push("/login")}
              title="Sign out"
              style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: 15, padding: 0, transition: "color .2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
            >⎋</button>
          </div>
        </aside>

        {/* ══ MAIN ═══════════════════════════════════════════════════ */}
        <main
          className="main-area"
          style={{ flex: 1, padding: "28px 36px", display: "flex", flexDirection: "column", gap: 24, overflowY: "auto", position: "relative" }}
        >
          {/* subtle top glow */}
          <div style={{ position: "absolute", top: 0, left: "30%", right: "30%", height: 1, background: "linear-gradient(90deg,transparent,rgba(0,255,157,.15),transparent)", pointerEvents: "none" }} />

          {/* ── HEADER ── */}
          <div className="header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div style={{ animation: "slideIn .5s cubic-bezier(.22,1,.36,1) both" }}>
              <h1 style={{ fontFamily: "var(--sans)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.6px", display: "flex", alignItems: "center", gap: 10 }}>
                Your reviews
                <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 400, color: "var(--muted)", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 20, padding: "2px 10px" }}>
                  {reviews.length}
                </span>
              </h1>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 3, fontFamily: "var(--sans)" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>

            {/* search */}
            <div className="search-wrap" style={{ minWidth: 260 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="var(--muted)" strokeWidth="1.2"/><path d="M10 10l2.5 2.5" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <input
                style={{ background: "transparent", border: "none", color: "var(--text)", padding: "10px 0", fontSize: 13, fontFamily: "var(--mono)", outline: "none", width: "100%" }}
                placeholder="search language, summary..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: 14, padding: 0, lineHeight: 1, cursor: "pointer" }}>✕</button>
              )}
            </div>
          </div>

          {/* ── STATS GRID ── */}
          <div className="stats-row" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {stats.map((s, i) => (
              <div key={s.label} className="stat-card" style={{ animationDelay: `${i * 0.07}s` }}>
                {/* corner glow */}
                <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right,${s.color}10,transparent 70%)`, pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--sans)", letterSpacing: ".03em" }}>{s.label}</span>
                  <span style={{ fontSize: 14, color: s.color, opacity: .7 }}>{s.icon}</span>
                </div>
                <span style={{ fontFamily: "var(--mono)", fontSize: 30, fontWeight: 600, lineHeight: 1, color: s.color, textShadow: `0 0 14px ${s.color}55` }}>
                  {s.val}
                </span>
              </div>
            ))}
          </div>

          {/* ── REVIEW LIST ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>

            {/* list header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: ".06em" }}>// recent reviews</span>
              {search && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", background: "var(--bg3)", borderRadius: 4, padding: "1px 8px", border: "1px solid var(--border)" }}>
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {filtered.length === 0 ? (
              /* empty state */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "64px 0", animation: "fadeIn .4s ease" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--mono)", fontSize: 22, color: "var(--border2)",
                }}>{ }</div>
                <p style={{ color: "var(--muted)", fontSize: 15 }}>
                  {search ? `No results for "${search}"` : "No reviews yet."}
                </p>
                {!search && (
                  <button className="new-btn" style={{ width: "auto", padding: "10px 24px" }} onClick={() => router.push("/review/new")}>
                    + Start your first review
                  </button>
                )}
              </div>
            ) : (
              filtered.map((review, idx) => {
                const lc   = LANG_COLOR[review.language] || "#6b6b8a"
                const sc   = scoreColor(review.score)
                const isHovered = hoveredId === review._id
                return (
                  <div
                    key={review._id}
                    className="review-card"
                    style={{
                      animationDelay: `${idx * 0.06}s`,
                      "--lang-color": lc,
                      borderColor: isHovered ? "var(--border2)" : "var(--border)",
                    } as React.CSSProperties}
                    onClick={() => router.push(`/review/${review._id}`)}
                    onMouseEnter={() => setHoveredId(review._id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* score ring */}
                    <div style={{
                      flexShrink: 0, width: 40, height: 40, borderRadius: "50%",
                      background: `${sc}12`,
                      border: `1.5px solid ${sc}`,
                      boxShadow: isHovered ? `0 0 12px ${sc}44` : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexDirection: "column", gap: 0,
                      transition: "box-shadow .2s",
                    }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, lineHeight: 1, color: sc }}>{review.score ?? "?"}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: sc, opacity: .7 }}>/10</span>
                    </div>

                    {/* content */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {/* lang badge */}
                        <span style={{
                          fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
                          padding: "2px 9px", borderRadius: 4,
                          color: lc, background: `${lc}12`, border: `1px solid ${lc}28`,
                        }}>{review.language}</span>

                        {/* shared badge */}
                        {review.shareToken && (
                          <span style={{
                            fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)",
                            background: "rgba(0,255,157,.07)", border: "1px solid rgba(0,255,157,.18)",
                            borderRadius: 4, padding: "2px 8px",
                          }}>⇗ shared</span>
                        )}

                        {/* time */}
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginLeft: "auto" }}>
                          {timeAgo(review.createdAt)}
                        </span>
                      </div>

                      <p style={{
                        fontSize: 13, color: isHovered ? "rgba(232,232,242,.9)" : "var(--muted)",
                        lineHeight: 1.5, fontFamily: "var(--sans)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        transition: "color .18s",
                      }}>
                        {review.aiSummary}
                      </p>
                    </div>

                    {/* actions */}
                    <div
                      className="card-actions"
                      style={{ display: "flex", gap: 6, flexShrink: 0 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        className="action-btn"
                        onClick={() => router.push(`/review/${review._id}`)}
                      >
                        Open →
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => setDeleteId(review._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </main>

        {/* ══ DELETE MODAL ═══════════════════════════════════════════ */}
        {deleteId && (
          <div className="modal-overlay" onClick={() => setDeleteId(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              {/* red glow top */}
              <div style={{ position: "absolute", top: -30, left: "50%", transform: "translateX(-50%)", width: 120, height: 60, background: "radial-gradient(circle,rgba(248,113,113,.12),transparent 70%)", pointerEvents: "none" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}>⚠</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.3px" }}>Delete review?</h3>
              </div>

              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 22, lineHeight: 1.65, fontFamily: "var(--sans)" }}>
                This will permanently delete the review and all its inline comments.
                <span style={{ color: "var(--red)" }}> This cannot be undone.</span>
              </p>

              {/* review preview */}
              {deleteId && (() => {
                const r = reviews.find(x => x._id === deleteId)
                if (!r) return null
                return (
                  <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "10px 14px", marginBottom: 22, display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: LANG_COLOR[r.language] || "var(--muted)", background: `${LANG_COLOR[r.language] || "#6b6b8a"}12`, border: `1px solid ${LANG_COLOR[r.language] || "#6b6b8a"}25`, borderRadius: 4, padding: "1px 8px", flexShrink: 0 }}>{r.language}</span>
                    <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--sans)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.aiSummary}</span>
                  </div>
                )
              })()}

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setDeleteId(null)}
                  style={{ background: "transparent", border: "1px solid var(--border2)", color: "var(--muted)", padding: "9px 20px", borderRadius: "var(--r)", fontSize: 13, fontFamily: "var(--sans)", transition: "all .15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border2)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--muted)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: api.delete(`/reviews/${deleteId}`)
                    setReviews(prev => prev.filter(r => r._id !== deleteId))
                    setDeleteId(null)
                  }}
                  style={{
                    background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.4)",
                    color: "var(--red)", padding: "9px 20px", borderRadius: "var(--r)",
                    fontSize: 13, fontFamily: "var(--sans)", fontWeight: 700,
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,.18)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(248,113,113,.2)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,.1)"; (e.currentTarget as HTMLElement).style.boxShadow = "none" }}
                >
                  Yes, delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}