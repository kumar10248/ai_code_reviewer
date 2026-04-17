// app/(app)/review/new/page.tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { reviewAPI, type ReviewComment } from "@/lib/api"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

type Severity = "info" | "warning" | "error"
type Category = "security" | "performance" | "style" | "bug" | "best_practice" | "type_safety"
type Status = "idle" | "loading" | "done" | "error"

const SEV_COLOR: Record<string, string> = {
  error: "#f87171", warning: "#fbbf24", info: "#3b82f6",
}
const CAT_COLOR: Record<string, string> = {
  security: "#f87171", performance: "#fb923c", style: "#818cf8",
  bug: "#fbbf24", best_practice: "#00c8e8", type_safety: "#c084fc",
}

const LANG_OPTIONS = ["javascript","typescript","python","java","go","rust","cpp","php","unknown"]

function scoreColor(s: number) {
  if (s <= 3) return "#f87171"
  if (s <= 5) return "#fb923c"
  if (s <= 7) return "#fbbf24"
  return "#00ff9d"
}

export default function NewReviewPage() {
  const router = useRouter()
  const [code, setCode]             = useState("// Paste your code here...\n")
  const [language, setLanguage]     = useState("javascript")
  const [status, setStatus]         = useState<Status>("idle")
  const [summary, setSummary]       = useState("")
  const [score, setScore]           = useState<number | null>(null)
  const [scoreReason, setScoreReason] = useState("")
  const [comments, setComments]     = useState<ReviewComment[]>([])
  const [fix, setFix]               = useState("")
  const [tags, setTags]             = useState<string[]>([])
  const [activeComment, setActive]  = useState<ReviewComment | null>(null)
  const [reviewId, setReviewId]     = useState<string | null>(null)
  const [shareLink, setShareLink]   = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [viewFix, setViewFix]       = useState(false)

  // fake typing effect for summary after response
  const [displayedSummary, setDisplayedSummary] = useState("")
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const typeOut = (text: string) => {
    setDisplayedSummary("")
    let i = 0
    typingRef.current = setInterval(() => {
      i++
      setDisplayedSummary(text.slice(0, i))
      if (i >= text.length) clearInterval(typingRef.current!)
    }, 12)
  }

  useEffect(() => () => clearInterval(typingRef.current!), [])

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!code.trim() || code === "// Paste your code here...\n") return
    setStatus("loading")
    setSummary(""); setDisplayedSummary(""); setComments([])
    setScore(null); setScoreReason(""); setFix(""); setTags([])
    setActive(null); setReviewId(null); setShareLink(null)

    try {
      const data = await reviewAPI.create({ code, language })

      setReviewId(data.reviewId)
      setSummary(data.summary)
      setScore(data.score)
      setComments(data.comments)
      setFix(data.fix || "")
      setTags(data.tags || [])
      setStatus("done")
      typeOut(data.summary)
    } catch (err: any) {
      setStatus("error")
      setSummary(err.message || "Something went wrong.")
    }
  }

  /* ── Share ── */
  const handleShare = async () => {
    if (!reviewId) return
    setShareLoading(true)
    try {
      const data = await reviewAPI.createShare(reviewId)
      const link = `${window.location.origin}/share/${data.shareToken}`
      setShareLink(link)
    } catch {
      // silent fail — show error inline
    } finally {
      setShareLoading(false)
    }
  }

  const handleCopyShare = () => {
    if (!shareLink) return
    navigator.clipboard.writeText(shareLink)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  const handleReset = () => {
    setStatus("idle"); setSummary(""); setDisplayedSummary("")
    setComments([]); setScore(null); setFix(""); setTags([])
    setActive(null); setReviewId(null); setShareLink(null); setViewFix(false)
  }

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

        @keyframes blink   {0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin    {to{transform:rotate(360deg)}}
        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes fadeUp  {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glowPulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes popIn   {from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes shimmerLoad{0%{background-position:-200% center}100%{background-position:200% center}}

        .topbar-logo{fontFamily:var(--mono);fontSize:14px;font-weight:600;text-align:center;flex:1}
        .review-btn{background:var(--accent);border:none;color:#000;padding:9px 20px;border-radius:var(--r);font-size:13px;font-weight:700;display:flex;align-items:center;gap:7px;transition:box-shadow .2s,transform .2s}
        .review-btn:hover:not(:disabled){box-shadow:0 0 18px rgba(0,255,157,.5);transform:translateY(-1px)}
        .review-btn:disabled{opacity:.65}
        .reset-btn{background:transparent;border:1px solid var(--border2);color:var(--text);padding:9px 20px;border-radius:var(--r);font-size:13px;transition:border-color .2s}
        .reset-btn:hover{border-color:rgba(0,255,157,.35)}

        .editor-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;border-bottom:1px solid var(--border);background:var(--bg3);flex-shrink:0}

        /* right panel */
        .panel-section{border-bottom:1px solid var(--border);padding:16px;display:flex;flex-direction:column;gap:10px}
        .panel-label{font-family:var(--mono);font-size:11px;color:var(--accent);letter-spacing:.05em}

        /* comment cards */
        .comment-card{background:var(--bg2);border:1px solid var(--border2);border-radius:var(--r);padding:12px 14px;cursor:pointer;display:flex;flex-direction:column;gap:8px;transition:border-color .15s,box-shadow .15s;animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both}
        .comment-card:hover{border-color:var(--border2)}
        .comment-card.active-card{box-shadow:0 0 0 1px currentColor}

        /* score ring */
        .score-ring{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;flex-shrink:0;animation:popIn .4s cubic-bezier(.22,1,.36,1)}

        /* share banner */
        .share-banner{display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(0,255,157,.05);border-bottom:1px solid rgba(0,255,157,.12);animation:fadeIn .25s ease;flex-shrink:0}

        /* loading pulse */
        .pulse-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:glowPulse 1s ease-in-out infinite;box-shadow:0 0 8px rgba(0,255,157,.6)}

        /* fix view toggle */
        .view-toggle{display:flex;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);padding:3px;gap:2px}
        .view-toggle-btn{padding:5px 12px;border:none;border-radius:7px;font-size:11px;font-family:var(--sans);cursor:pointer;transition:all .15s}

        /* tags */
        .tag{font-family:var(--mono);font-size:10px;padding:2px 8px;border-radius:20px;border:1px solid var(--border2);color:var(--muted);background:var(--bg3)}
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>

        {/* ── TOP BAR ── */}
        <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 52, borderBottom: "1px solid var(--border)", background: "var(--bg2)", flexShrink: 0 }}>
          <Link href="/dashboard" style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
            ← Dashboard
          </Link>

          <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 600, flex: 1, textAlign: "center" }}>
            <span style={{ color: "var(--accent)", textShadow: "0 0 10px rgba(0,255,157,.5)" }}>&lt;</span>ReviewAI<span style={{ color: "var(--accent)", textShadow: "0 0 10px rgba(0,255,157,.5)" }}>/&gt;</span>
          </span>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* language select */}
            <select
              style={{ background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--muted)", padding: "7px 10px", borderRadius: "var(--r)", fontSize: 12, fontFamily: "var(--mono)", outline: "none", cursor: "pointer" }}
              value={language}
              onChange={e => setLanguage(e.target.value)}
              disabled={status === "loading"}
            >
              {LANG_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>

            {status === "done" ? (
              <button className="reset-btn" onClick={handleReset}>+ New review</button>
            ) : (
              <button
                className="review-btn"
                onClick={handleSubmit}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <>
                    <span style={{ width: 13, height: 13, border: "2px solid rgba(0,0,0,.3)", borderTopColor: "#000", borderRadius: "50%", animation: "spin .6s linear infinite", display: "inline-block" }} />
                    Reviewing...
                  </>
                ) : "Review code →"}
              </button>
            )}
          </div>
        </header>

        {/* ── SHARE BANNER ── */}
        {shareLink && (
          <div className="share-banner">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px rgba(0,255,157,.6)", flexShrink: 0, animation: "glowPulse 1.8s ease-in-out infinite" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareLink}</span>
            <button
              onClick={handleCopyShare}
              style={{ background: "var(--accent)", border: "none", color: "#000", padding: "5px 14px", borderRadius: "var(--r)", fontSize: 12, fontWeight: 700, flexShrink: 0 }}
            >{shareCopied ? "Copied ✓" : "Copy"}</button>
            <button onClick={() => setShareLink(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: 14, padding: 0, cursor: "pointer" }}>✕</button>
          </div>
        )}

        {/* ── BODY ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── EDITOR ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", overflow: "hidden", position: "relative" }}>
            <div className="editor-bar">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {status === "loading" && <span className="pulse-dot" />}
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
                  {language} · {code.split("\n").length} lines
                </span>
              </div>
              {status === "done" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--yellow)", background: "rgba(251,191,36,.1)", border: "1px solid rgba(251,191,36,.25)", borderRadius: 4, padding: "2px 8px" }}>
                    {comments.length} issue{comments.length !== 1 ? "s" : ""}
                  </span>
                  {/* fix/review toggle */}
                  {fix && (
                    <div className="view-toggle">
                      {[{ label: "Code", val: false }, { label: "Fixed", val: true }].map(opt => (
                        <button
                          key={String(opt.val)}
                          className="view-toggle-btn"
                          style={{ background: viewFix === opt.val ? "var(--bg4)" : "transparent", color: viewFix === opt.val ? "var(--text)" : "var(--muted)" }}
                          onClick={() => setViewFix(opt.val)}
                        >{opt.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* gutter dots */}
            {status === "done" && !viewFix && (
              <div style={{ position: "absolute", left: 0, top: 42, width: 36, zIndex: 10, pointerEvents: "none" }}>
                {comments.map(c => (
                  <div
                    key={`${c.lineNumber}-${c._id}`}
                    style={{ position: "absolute", left: 6, top: (c.lineNumber - 1) * 19 + 6, width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", pointerEvents: "all" }}
                    onClick={() => setActive(a => a?.lineNumber === c.lineNumber ? null : c)}
                    title={c.message}
                  >
                    <span style={{ color: SEV_COLOR[c.severity] || "#00ff9d", fontSize: 9, textShadow: `0 0 6px ${SEV_COLOR[c.severity]}` }}>●</span>
                  </div>
                ))}
              </div>
            )}

            <MonacoEditor
              height="100%"
              language={language}
              value={viewFix && fix ? fix : code}
              onChange={v => { if (status === "idle") setCode(v || "") }}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineHeight: 19,
                padding: { top: 12, bottom: 12 },
                readOnly: status !== "idle" || viewFix,
                renderLineHighlight: "line",
                lineNumbers: "on",
                glyphMargin: true,
              }}
            />
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ width: 340, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0, background: "var(--bg)" }}>

            {/* IDLE state */}
            {status === "idle" && (
              <div className="panel-section" style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "var(--muted)" }}>⟨/⟩</div>
                <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>
                  Paste your code and click<br /><span style={{ color: "var(--accent)" }}>Review code</span> to start.
                </p>
              </div>
            )}

            {/* LOADING state */}
            {status === "loading" && (
              <div className="panel-section" style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", opacity: 0.4, animation: `glowPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <p style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)", textAlign: "center" }}>
                  Analyzing your code...
                </p>
              </div>
            )}

            {/* ERROR state */}
            {status === "error" && (
              <div className="panel-section">
                <div style={{ background: "rgba(248,113,113,.07)", border: "1px solid rgba(248,113,113,.25)", borderRadius: "var(--r)", padding: "12px 14px" }}>
                  <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--red)", marginBottom: 4 }}>ERR · Review failed</p>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>{summary}</p>
                </div>
                <button onClick={handleReset} style={{ background: "transparent", border: "1px solid var(--border2)", color: "var(--muted)", padding: "8px", borderRadius: "var(--r)", fontSize: 12, cursor: "pointer" }}>Try again</button>
              </div>
            )}

            {/* DONE state */}
            {status === "done" && (
              <>
                {/* Score + summary */}
                <div className="panel-section">
                  <div className="panel-label">// analysis</div>

                  {score !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
                      <div
                        className="score-ring"
                        style={{ background: `${scoreColor(score)}14`, border: `2px solid ${scoreColor(score)}`, boxShadow: `0 0 16px ${scoreColor(score)}40` }}
                      >
                        <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 700, lineHeight: 1, color: scoreColor(score) }}>{score}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: scoreColor(score), opacity: .7 }}>/10</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>code quality score</p>
                        <div style={{ height: 4, background: "var(--bg3)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${score * 10}%`, background: scoreColor(score), boxShadow: `0 0 8px ${scoreColor(score)}`, transition: "width .8s cubic-bezier(.22,1,.36,1)", borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ minHeight: 60, maxHeight: 140, overflowY: "auto" }}>
                    <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>
                      {displayedSummary}
                      {displayedSummary.length < summary.length && (
                        <span style={{ display: "inline-block", width: 7, height: 13, background: "var(--accent)", borderRadius: 1, marginLeft: 2, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />
                      )}
                    </p>
                  </div>

                  {/* tags */}
                  {tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  )}
                </div>

                {/* Comments */}
                {comments.length > 0 && (
                  <div className="panel-section">
                    <div className="panel-label">// {comments.length} issues</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {comments.map((c, idx) => {
                        const isActive = activeComment?.lineNumber === c.lineNumber && activeComment?._id === c._id
                        return (
                          <div
                            key={`${c.lineNumber}-${idx}`}
                            className={`comment-card${isActive ? " active-card" : ""}`}
                            style={{
                              animationDelay: `${idx * 0.08}s`,
                              borderColor: isActive ? SEV_COLOR[c.severity] : "var(--border2)",
                              color: isActive ? SEV_COLOR[c.severity] : undefined,
                              boxShadow: isActive ? `0 0 0 1px ${SEV_COLOR[c.severity]}44` : undefined,
                            }}
                            onClick={() => setActive(prev => prev?.lineNumber === c.lineNumber && prev?._id === c._id ? null : c)}
                          >
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4, border: "1px solid", color: SEV_COLOR[c.severity] || "#fff", background: `${SEV_COLOR[c.severity]}15`, borderColor: `${SEV_COLOR[c.severity]}30` }}>
                                {c.severity}
                              </span>
                              <span style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "1px 7px", borderRadius: 4, border: "1px solid", color: CAT_COLOR[c.category] || "#fff", background: `${CAT_COLOR[c.category]}15`, borderColor: `${CAT_COLOR[c.category]}30` }}>
                                {c.category}
                              </span>
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
                )}

                {/* Share + New review */}
                <div className="panel-section" style={{ gap: 8 }}>
                  <button
                    onClick={handleShare}
                    disabled={shareLoading || !!shareLink}
                    style={{
                      background: shareLink ? "rgba(0,255,157,.05)" : "rgba(0,255,157,.08)",
                      border: "1px solid rgba(0,255,157,.25)", color: "var(--accent)",
                      padding: "10px 14px", borderRadius: "var(--r)", fontSize: 13,
                      fontWeight: 600, width: "100%", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: 8, transition: "all .2s",
                      opacity: shareLoading ? 0.7 : 1,
                    }}
                    onMouseEnter={e => !shareLink && ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 14px rgba(0,255,157,.2)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
                  >
                    {shareLoading && <span style={{ width: 12, height: 12, border: "2px solid rgba(0,255,157,.3)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin .6s linear infinite", display: "inline-block" }} />}
                    {shareLink ? "⇗ Link generated" : "⇗ Generate share link"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Inline comment bottom popover ── */}
        {activeComment && (
          <div style={{
            position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
            background: "var(--bg2)", border: `1px solid ${SEV_COLOR[activeComment.severity]}55`,
            boxShadow: `0 8px 32px rgba(0,0,0,.4), 0 0 0 1px ${SEV_COLOR[activeComment.severity]}22`,
            borderRadius: "var(--rl)", padding: "14px 18px", width: 440, maxWidth: "90vw",
            zIndex: 100, display: "flex", flexDirection: "column", gap: 10,
            animation: "popIn .2s cubic-bezier(.22,1,.36,1)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: SEV_COLOR[activeComment.severity], textTransform: "uppercase", letterSpacing: ".08em" }}>
                {activeComment.severity} · {activeComment.category} · {activeComment.lineNumber === 0 ? "global" : `line ${activeComment.lineNumber}`}
              </span>
              <button onClick={() => setActive(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: 14, cursor: "pointer", padding: 0 }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{activeComment.message}</p>
            <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "10px 12px" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", marginBottom: 6 }}>// fix</p>
              <code style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{activeComment.suggestion}</code>
            </div>
          </div>
        )}
      </div>
    </>
  )
}