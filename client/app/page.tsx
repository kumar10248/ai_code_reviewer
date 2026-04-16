// app/(marketing)/page.tsx  — Landing page (enhanced: animations, glow, responsive)
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

/* ─── Data ─────────────────────────────────────────────────────── */
const DEMO_LINES = [
  { ln: 1,  code: `async function getUser(id) {`,            comment: null },
  { ln: 2,  code: `  const query = \`SELECT * FROM users`,   comment: null },
  { ln: 3,  code: `    WHERE id = \${id}\``,                 comment: { sev: "error",   text: "SQL injection — use parameterized queries" } },
  { ln: 4,  code: `  return db.query(query)`,                comment: null },
  { ln: 5,  code: `}`,                                       comment: null },
  { ln: 6,  code: ``,                                        comment: null },
  { ln: 7,  code: `const cache = {}`,                        comment: null },
  { ln: 8,  code: `function fetchData(url) {`,               comment: null },
  { ln: 9,  code: `  if (cache[url]) return cache[url]`,     comment: { sev: "warning", text: "Cache grows unbounded — memory leak" } },
  { ln: 10, code: `  return fetch(url).then(r => r.json())`, comment: null },
  { ln: 11, code: `}`,                                       comment: null },
]

const SEV: Record<string, { color: string; glow: string }> = {
  error:   { color: "#f87171", glow: "rgba(248,113,113,0.5)" },
  warning: { color: "#fbbf24", glow: "rgba(251,191,36,0.5)"  },
  info:    { color: "#3b82f6", glow: "rgba(59,130,246,0.5)"  },
}

const FEATURES = [
  { icon: "⟨/⟩", title: "Inline annotations",  desc: "AI comments land directly on the offending line — GitHub PR style, not buried in a sidebar." },
  { icon: "▶▶",  title: "Live streaming",       desc: "Reviews appear word-by-word as the model thinks. No 30-second spinner of doom." },
  { icon: "⌥",   title: "Before / after diff",  desc: "Every suggestion ships with a Monaco diff view. Accept, modify, or ignore it." },
  { icon: "⇗",   title: "7-day share links",    desc: "One click generates a public read-only URL. Send it to your team instantly." },
]

const STATS = [
  { val: "10+",  label: "Languages" },
  { val: "< 5s", label: "Avg review" },
  { val: "100%", label: "Private" },
]

/* ─── Component ─────────────────────────────────────────────────── */
export default function HomePage() {
  const router = useRouter()
  const [visibleLines, setVisibleLines]   = useState(0)
  const [activeComment, setActiveComment] = useState<number | null>(null)
  const [mounted, setMounted]             = useState(false)
  const intervalRef                       = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef                         = useRef<HTMLCanvasElement>(null)

  useEffect(() => { setMounted(true) }, [])

  /* typewriter effect — starts 600ms after mount */
  useEffect(() => {
    const t = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        setVisibleLines(v => {
          if (v >= DEMO_LINES.length) { clearInterval(intervalRef.current!); return v }
          return v + 1
        })
      }, 110)
    }, 600)
    return () => { clearTimeout(t); clearInterval(intervalRef.current!) }
  }, [])

  /* animated dot-grid canvas background */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    let raf: number
    let w = 0, h = 0

    type Dot = { x: number; y: number; phase: number; speed: number }
    let dots: Dot[] = []

    const rebuild = () => {
      w = canvas.offsetWidth
      h = canvas.offsetHeight
      canvas.width  = w
      canvas.height = h
      dots = []
      const STEP = 42
      for (let y = 0; y <= h; y += STEP)
        for (let x = 0; x <= w; x += STEP)
          dots.push({ x, y, phase: Math.random() * Math.PI * 2, speed: 0.003 + Math.random() * 0.006 })
    }

    rebuild()
    window.addEventListener("resize", rebuild)

    let frame = 0
    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      frame++
      dots.forEach(d => {
        const alpha = 0.05 + 0.2 * Math.abs(Math.sin(frame * d.speed + d.phase))
        ctx.beginPath()
        ctx.arc(d.x, d.y, 1.1, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,157,${alpha})`
        ctx.fill()
      })
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", rebuild) }
  }, [])

  return (
    <>
      {/* ── Injected global styles ─────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #08080e;
          --bg2:     #0d0d15;
          --bg3:     #141420;
          --bg4:     #1c1c28;
          --border:  #1c1c2a;
          --border2: #2a2a3e;
          --text:    #e8e8f2;
          --muted:   #55556e;
          --accent:  #00ff9d;
          --mono:    'JetBrains Mono', monospace;
          --sans:    'Syne', sans-serif;
          --r:       8px;
          --rl:      14px;
        }

        body { background: var(--bg); color: var(--text); font-family: var(--sans); -webkit-font-smoothing: antialiased; }
        button { cursor: pointer; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: var(--bg2); }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }

        /* ── Keyframes ── */
        @keyframes blink       { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
        @keyframes glowPulse   { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes scan        { 0%{top:-15%} 100%{top:110%} }
        @keyframes shimmer     { 0%{background-position:-300% center} 100%{background-position:300% center} }
        @keyframes orbit       { from{transform:rotate(0deg) translateX(100px) rotate(0deg)} to{transform:rotate(360deg) translateX(100px) rotate(-360deg)} }
        @keyframes orbitSlow   { from{transform:rotate(0deg) translateX(150px) rotate(0deg)} to{transform:rotate(-360deg) translateX(150px) rotate(360deg)} }
        @keyframes navGlow     { 0%,100%{opacity:.3} 50%{opacity:.7} }

        /* ── Utility animation classes ── */
        .fu0  { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) .05s both; }
        .fu1  { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) .15s both; }
        .fu2  { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) .25s both; }
        .fu3  { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) .35s both; }
        .fu4  { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) .45s both; }
        .fu5  { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) .55s both; }

        /* Shimmer text */
        .shimmer {
          background: linear-gradient(90deg, #e8e8f2 0%, #00ff9d 35%, #e8e8f2 65%, #e8e8f2 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 5s linear infinite;
        }
        .accent-glow {
          color: var(--accent);
          text-shadow: 0 0 18px rgba(0,255,157,.65), 0 0 40px rgba(0,255,157,.3);
        }

        /* ── Nav ── */
        .nav-wrap {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 44px;
          border-bottom: 1px solid var(--border);
          background: rgba(8,8,14,0.82);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          position: sticky; top: 0; z-index: 100;
          position: sticky;
        }
        .nav-glow {
          position: absolute; bottom: -1px; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(0,255,157,.5) 50%, transparent 100%);
          animation: navGlow 4s ease-in-out infinite;
        }
        .nav-btn {
          background: transparent; border: 1px solid var(--border2);
          color: var(--text); padding: 8px 20px; border-radius: var(--r);
          font-size: 14px; font-family: var(--sans);
          transition: border-color .2s, box-shadow .2s;
        }
        .nav-btn:hover { border-color: rgba(0,255,157,.4); box-shadow: 0 0 10px rgba(0,255,157,.08); }
        .btn-accent {
          background: var(--accent); border: none; color: #000;
          padding: 10px 22px; border-radius: var(--r);
          font-size: 14px; font-weight: 700; font-family: var(--sans);
          transition: box-shadow .2s, transform .2s;
        }
        .btn-accent:hover { box-shadow: 0 0 22px rgba(0,255,157,.55); transform: translateY(-1px); }
        .btn-accent-lg {
          background: var(--accent); border: none; color: #000;
          padding: 13px 30px; border-radius: var(--r);
          font-size: 15px; font-weight: 700; font-family: var(--sans);
          transition: box-shadow .2s, transform .2s;
        }
        .btn-accent-lg:hover { box-shadow: 0 0 28px rgba(0,255,157,.6); transform: translateY(-2px); }

        /* ── Demo editor ── */
        .demo-code-line {
          display: flex; align-items: center;
          padding: 2px 16px; gap: 8px; min-height: 22px;
          position: relative; transition: background .12s, border-color .12s;
          border-left: 2px solid transparent;
          animation: fadeIn .12s ease both;
        }
        .demo-code-line.active {
          background: rgba(248,113,113,0.055);
          border-left-color: #f87171;
        }
        .demo-code-line.active-warn {
          background: rgba(251,191,36,0.055);
          border-left-color: #fbbf24;
        }
        .gutter-dot {
          width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; cursor: pointer;
          animation: glowPulse 2.2s ease-in-out infinite;
        }
        .inline-tooltip {
          position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
          display: flex; gap: 8px; align-items: center;
          background: var(--bg4); border-radius: 6px;
          padding: 4px 12px; z-index: 10;
          animation: fadeIn .12s ease;
        }

        /* ── Feature cards ── */
        .feat-card {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: var(--rl); padding: 28px 24px;
          display: flex; flex-direction: column; gap: 14px;
          transition: border-color .25s, box-shadow .25s, transform .25s;
          position: relative; overflow: hidden;
          animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both;
        }
        .feat-card::before {
          content: ''; position: absolute; top: 0; right: 0;
          width: 90px; height: 90px;
          background: radial-gradient(circle at top right, rgba(0,255,157,.06), transparent 70%);
          pointer-events: none;
        }
        .feat-card:hover {
          border-color: rgba(0,255,157,.25);
          box-shadow: 0 0 28px rgba(0,255,157,.07), inset 0 0 40px rgba(0,255,157,.02);
          transform: translateY(-4px);
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .nav-wrap        { padding: 14px 18px !important; }
          .hero-section    { padding: 64px 18px 48px !important; }
          .feat-section    { padding: 56px 18px !important; }
          .feat-grid       { grid-template-columns: 1fr 1fr !important; }
          .cta-section     { padding: 64px 18px !important; }
          .footer-wrap     { padding: 18px !important; flex-direction: column; gap: 10px; }
          .stat-row        { gap: 8px !important; }
        }
        @media (max-width: 540px) {
          .feat-grid       { grid-template-columns: 1fr !important; }
          .hero-ctas       { flex-direction: column; width: 100%; }
          .hero-ctas .btn-accent-lg { width: 100%; text-align: center; }
          .demo-wrap       { border-radius: 10px !important; }
          .stat-row        { flex-wrap: wrap; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", opacity: mounted ? 1 : 0, transition: "opacity .35s" }}>

        {/* ── Dot grid canvas ── */}
        <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: .55 }} />

        {/* ── NAV ── */}
        <nav className="nav-wrap" style={{ position: "sticky" }}>
          <div className="nav-glow" />
          <span style={{ fontFamily: "var(--mono)", fontSize: 17, fontWeight: 600, letterSpacing: "-.5px" }}>
            <span className="accent-glow">&lt;</span>ReviewAI<span className="accent-glow">/&gt;</span>
          </span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="nav-btn" onClick={() => router.push("/login")}>Sign in</button>
            <button className="btn-accent" onClick={() => router.push("/register")}>Get started free</button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero-section" style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "90px 24px 64px", textAlign: "center", gap: 26,
          position: "relative", zIndex: 1,
        }}>
          {/* ambient glow */}
          <div style={{
            position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)",
            width: 600, height: 280,
            background: "radial-gradient(ellipse, rgba(0,255,157,.065) 0%, transparent 70%)",
            pointerEvents: "none", filter: "blur(24px)",
          }} />

          {/* live badge */}
          <div className="fu0" style={{
            display: "inline-flex", gap: 10, alignItems: "center",
            background: "rgba(0,255,157,.06)",
            border: "1px solid rgba(0,255,157,.18)",
            borderRadius: 20, padding: "6px 16px",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)", display: "inline-block", animation: "glowPulse 1.8s ease-in-out infinite" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", letterSpacing: ".04em" }}>v1.0 · live</span>
            <span style={{ color: "var(--border2)" }}>|</span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>AI-powered code review</span>
          </div>

          {/* headline */}
          <h1 className="fu1 shimmer" style={{
            fontFamily: "var(--sans)",
            fontSize: "clamp(40px, 7.5vw, 82px)",
            fontWeight: 800, lineHeight: 1.04, letterSpacing: "-2.5px",
          }}>
            Your code reviewed<br />
            <span style={{ color: "var(--accent)", fontStyle: "italic", WebkitTextFillColor: "var(--accent)", textShadow: "0 0 24px rgba(0,255,157,.5)" }}>
              line by line.
            </span>
          </h1>

          {/* sub */}
          <p className="fu2" style={{ fontSize: 17, color: "var(--muted)", maxWidth: 490, lineHeight: 1.75, fontFamily: "var(--sans)" }}>
            Paste code. Get inline AI comments with severity ratings and fix suggestions —
            streamed token-by-token in real time.
          </p>

          {/* CTAs */}
          <div className="hero-ctas fu3" style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn-accent-lg" onClick={() => router.push("/register")}>
              Start reviewing for free →
            </button>
            <button
              onClick={() => router.push("/login")}
              style={{ background: "transparent", border: "none", color: "var(--muted)", fontSize: 15, fontFamily: "var(--sans)", cursor: "pointer", padding: "13px 4px", transition: "color .2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}
            >Sign in</button>
          </div>

          {/* stat pills */}
          <div className="stat-row fu4" style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {STATS.map(s => (
              <div key={s.label} style={{
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: "var(--r)", padding: "13px 20px",
                display: "flex", flexDirection: "column", gap: 2,
                transition: "border-color .2s, box-shadow .2s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,255,157,.28)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 14px rgba(0,255,157,.07)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.boxShadow = "none" }}
              >
                <span style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 600, color: "var(--accent)", lineHeight: 1, textShadow: "0 0 10px rgba(0,255,157,.4)" }}>{s.val}</span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── Demo editor ── */}
          <div className="demo-wrap fu5" style={{
            width: "100%", maxWidth: 720, marginTop: 8,
            background: "var(--bg2)", border: "1px solid var(--border2)",
            borderRadius: "var(--rl)", overflow: "hidden", textAlign: "left",
            position: "relative",
            boxShadow: "0 0 0 1px rgba(0,255,157,.06), 0 32px 80px rgba(0,0,0,.55)",
          }}>
            {/* glowing top edge */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: "linear-gradient(90deg, transparent, rgba(0,255,157,.6) 40%, rgba(0,255,157,.6) 60%, transparent)",
              animation: "glowPulse 3.5s ease-in-out infinite",
            }} />

            {/* scanline sweep */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 50, pointerEvents: "none", zIndex: 1,
              background: "linear-gradient(to bottom, transparent, rgba(0,255,157,.025), transparent)",
              animation: "scan 7s linear infinite",
            }} />

            {/* title bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 16px", borderBottom: "1px solid var(--border)",
              background: "var(--bg3)",
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                {(["#f87171","#fbbf24","#4ade80"] as const).map((c,i) => (
                  <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}77`, display: "inline-block" }} />
                ))}
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)", flex: 1 }}>getUser.js</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", background: "rgba(0,255,157,.08)", border: "1px solid rgba(0,255,157,.2)", borderRadius: 4, padding: "2px 8px" }}>
                JavaScript
              </span>
            </div>

            {/* code lines */}
            <div style={{ padding: "10px 0", minHeight: 220 }}>
              {DEMO_LINES.slice(0, visibleLines).map((line, idx) => {
                const isActive = activeComment === line.ln
                const sev = line.comment?.sev ?? ""
                const isErr  = sev === "error"
                const isWarn = sev === "warning"
                return (
                  <div
                    key={line.ln}
                    className={`demo-code-line${isActive && isErr ? " active" : isActive && isWarn ? " active-warn" : ""}`}
                    style={{ animationDelay: `${idx * 0.04}s`, borderLeftColor: isActive ? SEV[sev]?.color : "transparent" }}
                    onMouseEnter={() => line.comment && setActiveComment(line.ln)}
                    onMouseLeave={() => setActiveComment(null)}
                  >
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: isActive ? "var(--muted)" : "#28283a", minWidth: 22, textAlign: "right", userSelect: "none", transition: "color .15s" }}>
                      {line.ln}
                    </span>

                    {line.comment ? (
                      <span
                        className="gutter-dot"
                        style={{ background: SEV[sev].color, boxShadow: `0 0 ${isActive ? 12 : 6}px ${SEV[sev].glow}`, transition: "box-shadow .2s" }}
                      />
                    ) : <span style={{ width: 7 }} />}

                    <code style={{ fontFamily: "var(--mono)", fontSize: 12.5, color: isActive ? "var(--text)" : "rgba(232,232,242,.8)", whiteSpace: "pre", transition: "color .15s" }}>
                      {line.code}
                    </code>

                    {isActive && line.comment && (
                      <div
                        className="inline-tooltip"
                        style={{ border: `1px solid ${SEV[sev].color}`, boxShadow: `0 0 14px ${SEV[sev].glow}` }}
                      >
                        <span style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, letterSpacing: ".08em", color: SEV[sev].color, textTransform: "uppercase" }}>
                          {sev}
                        </span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                          {line.comment.text}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* blinking cursor */}
              {visibleLines < DEMO_LINES.length && (
                <div className="demo-code-line">
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "#28283a", minWidth: 22, textAlign: "right" }}>{visibleLines + 1}</span>
                  <span style={{ width: 7 }} />
                  <span style={{ width: 8, height: 14, background: "var(--accent)", borderRadius: 1, boxShadow: "0 0 10px rgba(0,255,157,.7)", animation: "blink .9s step-end infinite" }} />
                </div>
              )}
            </div>

            {/* status bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "7px 16px", borderTop: "1px solid var(--border)", background: "var(--bg3)",
            }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                {visibleLines}/{DEMO_LINES.length} lines
              </span>
              {visibleLines >= DEMO_LINES.length && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--accent)", marginLeft: "auto", animation: "fadeIn .4s ease", textShadow: "0 0 8px rgba(0,255,157,.5)" }}>
                  ✓ 2 issues detected
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="feat-section" style={{ padding: "80px 44px", maxWidth: 1100, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", marginBottom: 12, letterSpacing: ".06em" }}>// what you get</p>
          <h2 style={{ fontSize: "clamp(26px,4vw,44px)", fontWeight: 700, letterSpacing: "-1.2px", marginBottom: 48, lineHeight: 1.15 }}>
            Everything a senior dev<br />
            <span style={{ color: "var(--muted)", fontWeight: 400 }}>would tell you.</span>
          </h2>

          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px,1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className="feat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 22, color: "var(--accent)", textShadow: "0 0 12px rgba(0,255,157,.45)" }}>{f.icon}</span>
                <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.3px" }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65, fontFamily: "var(--sans)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA STRIP ── */}
        <section className="cta-section" style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 24, padding: "80px 24px",
          borderTop: "1px solid var(--border)",
          textAlign: "center", position: "relative", zIndex: 1,
          background: "linear-gradient(to bottom, transparent, rgba(0,255,157,.025) 50%, transparent)",
        }}>
          {/* orbit rings decoration */}
          <div style={{ position: "relative", width: 0, height: 0, pointerEvents: "none" }}>
            {[260, 180, 110].map((size, i) => (
              <div key={size} style={{
                position: "absolute", width: size, height: size,
                border: `1px solid rgba(0,255,157,${0.05 - i * 0.01})`,
                borderRadius: "50%", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)", pointerEvents: "none",
              }} />
            ))}
            {/* orbiting dots */}
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 8, height: 8, margin: "-4px", animation: "orbit 7s linear infinite" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 10px var(--accent), 0 0 20px rgba(0,255,157,.4)" }} />
            </div>
            <div style={{ position: "absolute", top: "50%", left: "50%", width: 5, height: 5, margin: "-2.5px", animation: "orbitSlow 11s linear infinite" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(0,255,157,.5)", boxShadow: "0 0 6px rgba(0,255,157,.5)" }} />
            </div>
          </div>

          <h2 style={{ fontSize: "clamp(24px,4.5vw,44px)", fontWeight: 700, letterSpacing: "-1.2px", position: "relative", zIndex: 2 }}>
            Stop guessing.<br />
            <span className="accent-glow">Start reviewing.</span>
          </h2>
          <button
            className="btn-accent-lg"
            onClick={() => router.push("/register")}
            style={{ position: "relative", zIndex: 2 }}
          >
            Create free account →
          </button>
          <p style={{ fontSize: 13, color: "var(--muted)", fontFamily: "var(--mono)", position: "relative", zIndex: 2 }}>
            No credit card required · Start in 30 seconds
          </p>
        </section>

        {/* ── FOOTER ── */}
        <footer className="footer-wrap" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 44px", borderTop: "1px solid var(--border)",
          flexWrap: "wrap", gap: 12, position: "relative", zIndex: 1,
        }}>
          <span style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600 }}>
            <span className="accent-glow">&lt;</span>ReviewAI<span className="accent-glow">/&gt;</span>
          </span>
          <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>
            Next.js · MongoDB · OpenAI · Node.js
          </span>
        </footer>
      </div>
    </>
  )
}