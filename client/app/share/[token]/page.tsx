// app/share/[token]/page.tsx  — Public read-only shared review (REAL API)
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import { shareAPI, type Review, type ReviewComment } from "@/lib/api"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

type LoadState = "loading" | "loaded" | "expired" | "error"

const SEV_COLOR: Record<string, string> = {
  error: "#f87171", warning: "#fbbf24", info: "#3b82f6",
}
const CAT_COLOR: Record<string, string> = {
  security: "#f87171", performance: "#fb923c", style: "#818cf8",
  bug: "#fbbf24", best_practice: "#00c8e8", type_safety: "#c084fc",
}

function scoreColor(s?: number) {
  if (!s) return "#55556e"
  if (s <= 3) return "#f87171"
  if (s <= 5) return "#fb923c"
  if (s <= 7) return "#fbbf24"
  return "#00ff9d"
}

function timeLeft(iso?: string | null) {
  if (!iso) return ""
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return "Expired"
  const h = Math.floor(ms / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `Expires in ${d}d`
  return `Expires in ${h}h`
}

export default function SharePage() {
  const { token } = useParams<{ token: string }>()

  const [state, setState]       = useState<LoadState>("loading")
  const [review, setReview]     = useState<Review | null>(null)
  const [comments, setComments] = useState<ReviewComment[]>([])
  const [active, setActive]     = useState<ReviewComment | null>(null)
  const [errMsg, setErrMsg]     = useState("")

  /* ── Fetch from real API ── */
  useEffect(() => {
    if (!token) return

    const load = async () => {
      try {
        const data = await shareAPI.get(token)
        setReview(data.review)
        setComments(data.comments)
        setState("loaded")
      } catch (err: any) {
        // 404 = expired or invalid token
        const msg = err.message?.toLowerCase() || ""
        if (msg.includes("expired") || msg.includes("invalid") || msg.includes("404") || msg.includes("not found")) {
          setState("expired")
        } else {
          setErrMsg(err.message || "Something went wrong.")
          setState("error")
        }
      }
    }

    load()
  }, [token])

  const sc = scoreColor(review?.score)

  /* ── Loading ── */
  if (state === "loading") return (
    <div style={centerStyle}>
      <Css />
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", animation: `glowPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <p style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 13 }}>
        Loading shared review...
      </p>
    </div>
  )

  /* ── Expired / Error ── */
  if (state === "expired" || state === "error") return (
    <div style={centerStyle}>
      <Css />
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: state === "expired" ? "rgba(251,191,36,.1)" : "rgba(248,113,113,.1)",
        border: `1px solid ${state === "expired" ? "rgba(251,191,36,.3)" : "rgba(248,113,113,.3)"}`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
      }}>
        {state === "expired" ? "⏱" : "✕"}
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.5px" }}>
        {state === "expired" ? "Link expired" : "Something went wrong"}
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", maxWidth: 340, lineHeight: 1.6 }}>
        {state === "expired"
          ? "This shared review link has expired or is invalid. Ask the owner to generate a new one."
          : errMsg || "We couldn't load this review."}
      </p>
      <Link href="/register" style={{
        background: "var(--accent)", color: "#000",
        padding: "10px 24px", borderRadius: "var(--r)",
        fontSize: 13, fontWeight: 700, fontFamily: "var(--sans)",
      }}>
        Try ReviewAI free →
      </Link>
    </div>
  )

  /* ── Loaded ── */
  return (
    <>
      <Css />
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>

        {/* ── TOP BAR ── */}
        <header style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "0 20px", height: 50,
          borderBottom: "1px solid var(--border)",
          background: "rgba(8,8,14,.88)",
          backdropFilter: "blur(14px)",
          flexShrink: 0, position: "relative",
        }}>
          {/* nav glow */}
          <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(0,255,157,.3),transparent)", animation: "glowPulse 4s ease-in-out infinite" }} />

          <Link href="/" style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600 }}>
            <span style={{ color: "var(--accent)", textShadow: "0 0 12px rgba(0,255,157,.5)" }}>&lt;</span>
            ReviewAI
            <span style={{ color: "var(--accent)", textShadow: "0 0 12px rgba(0,255,157,.5)" }}>/&gt;</span>
          </Link>

          {/* read-only badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)",
            background: "var(--bg3)", border: "1px solid var(--border)",
            borderRadius: 20, padding: "3px 10px",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted)", display: "inline-block" }} />
            Read-only shared view
          </div>

          {/* expiry badge */}
          {review?.shareExpiresAt && (
            <span style={{
              fontFamily: "var(--mono)", fontSize: 11, color: "var(--yellow)",
              background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.2)",
              borderRadius: 20, padding: "3px 10px",
            }}>
              {timeLeft(review.shareExpiresAt)}
            </span>
          )}

          {/* CTA */}
          <Link href="/register" style={{
            marginLeft: "auto",
            background: "var(--accent)", color: "#000",
            padding: "7px 16px", borderRadius: "var(--r)",
            fontSize: 12, fontWeight: 700, fontFamily: "var(--sans)",
            whiteSpace: "nowrap",
            boxShadow: "0 0 0 transparent",
            transition: "box-shadow .2s",
          }}>
            Try ReviewAI free →
          </Link>
        </header>

        {/* ── BODY ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── EDITOR ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 16px", borderBottom: "1px solid var(--border)",
              background: "var(--bg3)", flexShrink: 0,
            }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
                {review?.language} · read-only
              </span>
              <span style={{
                fontFamily: "var(--mono)", fontSize: 11, color: "var(--yellow)",
                background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.25)",
                borderRadius: 4, padding: "2px 8px",
              }}>
                {comments.length} issue{comments.length !== 1 ? "s" : ""}
              </span>
            </div>

            <MonacoEditor
              height="100%"
              language={review?.language || "plaintext"}
              value={review?.code || ""}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: false },
                readOnly: true,
                lineHeight: 19,
                padding: { top: 12 },
                scrollBeyondLastLine: false,
                domReadOnly: true,
                contextmenu: false,
              }}
            />
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ width: 340, overflowY: "auto", flexShrink: 0, background: "var(--bg)" }}>

            {/* Shared badge */}
            <div style={{
              padding: "12px 16px",
              background: "rgba(0,255,157,.04)",
              borderBottom: "1px solid rgba(0,255,157,.1)",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)" }}>⇗ shared review</span>
              <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                This is a read-only view shared via link.
              </p>
            </div>

            {/* Score */}
            {review?.score !== undefined && (
              <div style={{ borderBottom: "1px solid var(--border)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)" }}>// quality score</span>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: `${sc}14`, border: `2px solid ${sc}`,
                    boxShadow: `0 0 14px ${sc}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexDirection: "column", flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 700, lineHeight: 1, color: sc }}>{review.score}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 8, color: sc, opacity: .7 }}>/10</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ height: "100%", width: `${review.score * 10}%`, background: sc, boxShadow: `0 0 6px ${sc}`, borderRadius: 2 }} />
                    </div>
                    {review.tags && review.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {review.tags.map(t => (
                          <span key={t} style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "2px 8px", borderRadius: 20, border: "1px solid var(--border2)", color: "var(--muted)", background: "var(--bg3)" }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div style={{ borderBottom: "1px solid var(--border)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)" }}>// summary</span>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, fontFamily: "var(--sans)" }}>
                {review?.aiSummary}
              </p>
            </div>

            {/* Comments */}
            {comments.length > 0 && (
              <div style={{ borderBottom: "1px solid var(--border)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)" }}>// {comments.length} issues</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {comments.map((c, idx) => {
                    const isActive = active?.lineNumber === c.lineNumber && active?._id === c._id
                    return (
                      <div
                        key={`${c.lineNumber}-${idx}`}
                        style={{
                          background: "var(--bg2)",
                          border: `1px solid ${isActive ? SEV_COLOR[c.severity] : "var(--border2)"}`,
                          boxShadow: isActive ? `0 0 0 1px ${SEV_COLOR[c.severity]}44` : undefined,
                          borderRadius: "var(--r)", padding: "12px 14px",
                          cursor: "pointer", display: "flex", flexDirection: "column", gap: 8,
                          transition: "border-color .15s, box-shadow .15s",
                          animation: "fadeUp .4s cubic-bezier(.22,1,.36,1) both",
                          animationDelay: `${idx * 0.07}s`,
                        }}
                        onClick={() => setActive(prev =>
                          prev?.lineNumber === c.lineNumber && prev?._id === c._id ? null : c
                        )}
                      >
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{
                            fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700,
                            padding: "1px 7px", borderRadius: 4, border: "1px solid",
                            color: SEV_COLOR[c.severity],
                            background: `${SEV_COLOR[c.severity]}15`,
                            borderColor: `${SEV_COLOR[c.severity]}30`,
                          }}>{c.severity}</span>
                          <span style={{
                            fontFamily: "var(--mono)", fontSize: 10,
                            padding: "1px 7px", borderRadius: 4, border: "1px solid",
                            color: CAT_COLOR[c.category] || "#fff",
                            background: `${CAT_COLOR[c.category] || "#fff"}15`,
                            borderColor: `${CAT_COLOR[c.category] || "#fff"}30`,
                          }}>{c.category}</span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginLeft: "auto" }}>
                            {c.lineNumber === 0 ? "global" : `line ${c.lineNumber}`}
                          </span>
                        </div>

                        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, fontFamily: "var(--sans)" }}>
                          {c.message}
                        </p>

                        {isActive && (
                          <div style={{
                            background: "var(--bg3)", border: "1px solid var(--border)",
                            borderRadius: "var(--r)", padding: "10px 12px",
                            display: "flex", flexDirection: "column", gap: 6,
                            animation: "fadeIn .15s ease",
                          }}>
                            <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)" }}>// fix</p>
                            <code style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {c.suggestion}
                            </code>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CTA card */}
            <div style={{ padding: 16 }}>
              <div style={{
                background: "var(--bg2)", border: "1px solid var(--border)",
                borderRadius: "var(--rl)", padding: "18px",
                position: "relative", overflow: "hidden",
              }}>
                {/* corner glow */}
                <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: "radial-gradient(circle at top right,rgba(0,255,157,.06),transparent 70%)", pointerEvents: "none" }} />

                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                  Want AI reviews for your own code?
                </p>
                <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55, marginBottom: 14 }}>
                  Free account. No credit card. Review any language in seconds.
                </p>
                <Link href="/register" style={{
                  display: "block", textAlign: "center",
                  background: "var(--accent)", color: "#000",
                  padding: "11px", borderRadius: "var(--r)",
                  fontSize: 13, fontWeight: 700, fontFamily: "var(--sans)",
                }}>
                  Get started free →
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

/* ── Shared CSS ───────────────────────────────────────────────────── */
function Css() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@400;600;700;800&display=swap');
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      :root{
        --bg:#08080e;--bg2:#0d0d15;--bg3:#141420;--bg4:#1c1c28;
        --border:#1c1c2a;--border2:#2a2a3e;
        --text:#e8e8f2;--muted:#55556e;
        --accent:#00ff9d;--red:#f87171;--yellow:#fbbf24;
        --mono:'JetBrains Mono',monospace;--sans:'Syne',sans-serif;
        --r:10px;--rl:14px;
      }
      body{background:var(--bg);color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased}
      a{color:inherit;text-decoration:none}
      button{cursor:pointer}
      ::-webkit-scrollbar{width:4px}
      ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}

      @keyframes glowPulse{0%,100%{opacity:.45}50%{opacity:1}}
      @keyframes fadeIn   {from{opacity:0}to{opacity:1}}
      @keyframes fadeUp   {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    `}</style>
  )
}

const centerStyle: React.CSSProperties = {
  minHeight: "100vh", background: "var(--bg)",
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center", gap: 20,
  fontFamily: "'Syne', sans-serif", color: "#e8e8f2",
}