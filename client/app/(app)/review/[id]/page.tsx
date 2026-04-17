// app/(app)/review/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { reviewAPI, type Review, type ReviewComment } from "@/lib/api"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })
const DiffEditor   = dynamic(() => import("@monaco-editor/react").then(m => ({ default: m.DiffEditor })), { ssr: false })

type ViewMode = "review" | "diff" | "fix"

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

export default function ReviewDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [review, setReview]         = useState<Review | null>(null)
  const [comments, setComments]     = useState<ReviewComment[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState("")
  const [active, setActive]         = useState<ReviewComment | null>(null)
  const [viewMode, setViewMode]     = useState<ViewMode>("review")
  const [shareLoading, setShareLoading] = useState(false)
  const [shareLink, setShareLink]   = useState<string | null>(null)
  const [copied, setCopied]         = useState(false)

  /* ── Load review ── */
  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const data = await reviewAPI.getById(id)
        setReview(data.review)
        setComments(data.comments)
        // if review has a fix field, show fix mode as available
      } catch (err: any) {
        setError(err.message || "Failed to load review.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  /* ── Share ── */
  const handleShare = async () => {
    if (!review) return
    setShareLoading(true)
    try {
      const data = await reviewAPI.createShare(review._id)
      setShareLink(`${window.location.origin}/share/${data.shareToken}`)
      setReview(prev => prev ? { ...prev, shareToken: data.shareToken, shareExpiresAt: data.shareExpiresAt } : prev)
    } catch {
      setError("Failed to generate share link.")
    } finally {
      setShareLoading(false)
    }
  }

  const handleCopy = () => {
    if (!shareLink) return
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fixedCode = review?.code
    ? review.code.split("\n").map((line, i) => {
        const c = comments.find(c => c.lineNumber === i + 1)
        return c ? `// FIXED: ${c.suggestion.split("\n")[0]}` : line
      }).join("\n")
    : ""

  const hasFix = !!review?.fix

  /* ── Loading ── */
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)", flexDirection: "column", gap: 16, fontFamily: "'Syne',sans-serif" }}>
      <style>{`:root{--bg:#08080e;--bg2:#0d0d15;--bg3:#141420;--border:#1c1c2a;--text:#e8e8f2;--muted:#55556e;--accent:#00ff9d}@keyframes glowPulse{0%,100%{opacity:.45}50%{opacity:1}}`}</style>
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", animation: `glowPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
      </div>
      <p style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>Loading review...</p>
    </div>
  )

  /* ── Error ── */
  if (error && !review) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)", flexDirection: "column", gap: 16 }}>
      <style>{`:root{--bg:#08080e;--text:#e8e8f2;--muted:#55556e;--accent:#00ff9d;--red:#f87171}`}</style>
      <p style={{ color: "var(--red)", fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>{error}</p>
      <button onClick={() => router.push("/dashboard")} style={{ background: "transparent", border: "1px solid var(--muted)", color: "var(--muted)", padding: "8px 20px", borderRadius: 8, cursor: "pointer" }}>← Dashboard</button>
    </div>
  )

  const sc = scoreColor(review?.score)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@400;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --bg:#08080e;--bg2:#0d0d15;--bg3:#141420;--bg4:#1c1c28;
          --border:#1c1c2a;--border2:#2a2a3e;
          --text:#e8e8f2;--muted:#55556e;
          --accent:#00ff9d;--red:#f87171;--yellow:#fbbf24;--blue:#3b82f6;
          --mono:'JetBrains Mono',monospace;--sans:'Syne',sans-serif;
          --r:10px;--rl:14px;
        }
        body{background:var(--bg);color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased}
        a{color:inherit;text-decoration:none}
        button{cursor:pointer;font-family:var(--sans)}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}

        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes fadeUp  {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{opacity:.45}50%{opacity:1}}
        @keyframes spin    {to{transform:rotate(360deg)}}
        @keyframes popIn   {from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes scoreBar{from{width:0}to{width:var(--bar-w)}}

        .panel-section{border-bottom:1px solid var(--border);padding:16px;display:flex;flex-direction:column;gap:10px}
        .panel-label{font-family:var(--mono);font-size:11px;color:var(--accent);letter-spacing:.05em}
        .comment-card{background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);padding:12px 14px;cursor:pointer;display:flex;flex-direction:column;gap:8px;transition:border-color .15s,box-shadow .15s;animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both}
        .comment-card:hover{border-color:var(--border2)}
        .view-toggle{display:flex;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);padding:3px;gap:2px;flex-shrink:0}
        .view-toggle-btn{padding:5px 12px;border:none;border-radius:7px;font-size:11px;font-family:var(--sans);cursor:pointer;transition:all .15s}
        .share-banner{display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(0,255,157,.05);border-bottom:1px solid rgba(0,255,157,.12);flex-shrink:0;animation:fadeIn .25s ease}
        .tag{font-family:var(--mono);font-size:10px;padding:2px 8px;border-radius:20px;border:1px solid var(--border2);color:var(--muted);background:var(--bg3)}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>

        {/* ── TOP BAR ── */}
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--bg2)", flexShrink: 0 }}>
          <Link href="/dashboard" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>← Dashboard</Link>

          <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, flex: 1, textAlign: "center" }}>
            <span style={{ color: "var(--accent)", textShadow: "0 0 10px rgba(0,255,157,.5)" }}>&lt;</span>ReviewAI<span style={{ color: "var(--accent)", textShadow: "0 0 10px rgba(0,255,157,.5)" }}>/&gt;</span>
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* view toggle */}
            <div className="view-toggle">
              {([
                { label: "Review", val: "review" as ViewMode },
                { label: "Diff",   val: "diff"   as ViewMode },
                ...(hasFix ? [{ label: "Fix", val: "fix" as ViewMode }] : []),
              ]).map(opt => (
                <button
                  key={opt.val}
                  className="view-toggle-btn"
                  style={{ background: viewMode === opt.val ? "var(--bg4)" : "transparent", color: viewMode === opt.val ? "var(--text)" : "var(--muted)" }}
                  onClick={() => setViewMode(opt.val)}
                >{opt.label}</button>
              ))}
            </div>

            <button
              onClick={handleShare}
              disabled={shareLoading}
              style={{ background: shareLink ? "rgba(0,255,157,.05)" : "rgba(0,255,157,.1)", border: "1px solid rgba(0,255,157,.25)", color: "var(--accent)", padding: "7px 16px", borderRadius: "var(--r)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 7, transition: "box-shadow .2s", opacity: shareLoading ? 0.7 : 1, whiteSpace: "nowrap" }}
              onMouseEnter={e => !shareLink && ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 14px rgba(0,255,157,.25)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
            >
              {shareLoading && <span style={{ width: 11, height: 11, border: "2px solid rgba(0,255,157,.3)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin .6s linear infinite", display: "inline-block" }} />}
              {shareLink ? "⇗ Shared" : "⇗ Share"}
            </button>
          </div>
        </header>

        {/* ── SHARE BANNER ── */}
        {shareLink && (
          <div className="share-banner">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px rgba(0,255,157,.6)", flexShrink: 0, animation: "glowPulse 1.8s ease-in-out infinite" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareLink}</span>
            <button onClick={handleCopy} style={{ background: "var(--accent)", border: "none", color: "#000", padding: "5px 14px", borderRadius: "var(--r)", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button onClick={() => setShareLink(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: 14, padding: 0, cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* ── BODY ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── EDITOR ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid var(--border)", background: "var(--bg3)", flexShrink: 0 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
                {review?.language} · {review?.code?.split("\n").length ?? 0} lines
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {viewMode === "fix" && (
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", background: "rgba(0,255,157,.08)", border: "1px solid rgba(0,255,157,.2)", borderRadius: 4, padding: "2px 8px" }}>AI fixed version</span>
                )}
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--yellow)", background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.25)", borderRadius: 4, padding: "2px 8px" }}>
                  {comments.length} issue{comments.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {viewMode === "review" && (
              <MonacoEditor
                height="100%"
                language={review?.language}
                value={review?.code}
                theme="vs-dark"
                options={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", minimap: { enabled: false }, readOnly: true, lineHeight: 19, padding: { top: 12 }, scrollBeyondLastLine: false }}
              />
            )}
            {viewMode === "diff" && (
              <DiffEditor
                height="100%"
                language={review?.language}
                original={review?.code}
                modified={fixedCode}
                theme="vs-dark"
                options={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", readOnly: true, minimap: { enabled: false }, renderSideBySide: true }}
              />
            )}
            {viewMode === "fix" && (
              <MonacoEditor
                height="100%"
                language={review?.language}
                value={review?.fix || fixedCode}
                theme="vs-dark"
                options={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", minimap: { enabled: false }, readOnly: true, lineHeight: 19, padding: { top: 12 }, scrollBeyondLastLine: false }}
              />
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ width: 340, overflowY: "auto", flexShrink: 0, background: "var(--bg)" }}>

            {/* Score */}
            {review?.score !== undefined && (
              <div className="panel-section">
                <div className="panel-label">// quality score</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${sc}14`, border: `2px solid ${sc}`, boxShadow: `0 0 16px ${sc}40`, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, lineHeight: 1, color: sc }}>{review.score}</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: sc, opacity: .7 }}>/10</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ height: "100%", width: `${review.score * 10}%`, background: sc, boxShadow: `0 0 8px ${sc}`, borderRadius: 2 }} />
                    </div>
                    {review.tags && review.tags.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {review.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="panel-section">
              <div className="panel-label">// summary</div>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65 }}>{review?.aiSummary}</p>
            </div>

            {/* Comments */}
            <div className="panel-section">
              <div className="panel-label">// {comments.length} issues found</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {comments.map((c, idx) => {
                  const isActive = active?._id === c._id && active?.lineNumber === c.lineNumber
                  return (
                    <div
                      key={`${c.lineNumber}-${idx}`}
                      className="comment-card"
                      style={{
                        animationDelay: `${idx * 0.07}s`,
                        borderColor: isActive ? SEV_COLOR[c.severity] : "var(--border2)",
                        boxShadow: isActive ? `0 0 0 1px ${SEV_COLOR[c.severity]}44` : undefined,
                      }}
                      onClick={() => setActive(prev => prev?.lineNumber === c.lineNumber && prev?._id === c._id ? null : c)}
                    >
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, border: "1px solid", color: SEV_COLOR[c.severity], background: `${SEV_COLOR[c.severity]}15`, borderColor: `${SEV_COLOR[c.severity]}30` }}>{c.severity}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "1px 7px", borderRadius: 4, border: "1px solid", color: CAT_COLOR[c.category] || "#fff", background: `${(CAT_COLOR[c.category] || "#fff")}15`, borderColor: `${(CAT_COLOR[c.category] || "#fff")}30` }}>{c.category}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginLeft: "auto" }}>
                          {c.lineNumber === 0 ? "global" : `line ${c.lineNumber}`}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.55 }}>{c.message}</p>
                      {isActive && (
                        <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6, animation: "fadeIn .15s ease" }}>
                          <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)" }}>// fix</p>
                          <code style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.suggestion}</code>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Meta */}
            <div className="panel-section">
              <div className="panel-label">// meta</div>
              {[
                { key: "Reviewed",  val: review ? new Date(review.createdAt).toLocaleString() : "" },
                { key: "Language",  val: review?.language ?? "", accent: true },
                { key: "Share",     val: review?.shareToken ? "Active" : "Not shared" },
              ].map(row => (
                <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{row.key}</span>
                  <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: row.accent ? "var(--accent)" : "var(--text)" }}>{row.val}</span>
                </div>
              ))}
            </div>

            {/* New review CTA */}
            <div className="panel-section">
              <button
                onClick={() => router.push("/review/new")}
                style={{ background: "var(--accent)", border: "none", color: "#000", padding: "11px", borderRadius: "var(--r)", fontSize: 14, fontWeight: 700, width: "100%", transition: "box-shadow .2s,transform .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 18px rgba(0,255,157,.4)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)" }}
              >+ New review</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}