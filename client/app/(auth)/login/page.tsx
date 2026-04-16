// app/(auth)/login/page.tsx
"use client"

import { loginUser } from "@/lib/api"

// app/(auth)/login/page.tsx

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]       = useState({ email: "", password: "" })
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { setMounted(true) }, [])

  /* ── Floating particle canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    let raf: number
    let W = 0, H = 0

    type P = { x: number; y: number; vx: number; vy: number; r: number; alpha: number }
    let particles: P[] = []

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
      particles = Array.from({ length: 38 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.25 + 0.05,
      }))
    }
    resize()
    window.addEventListener("resize", resize)

    // draw connecting lines between nearby particles
    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > W) p.vx *= -1
        if (p.y < 0 || p.y > H) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,157,${p.alpha})`
        ctx.fill()
      })
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 120) {
            ctx.beginPath()
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(0,255,157,${0.06 * (1 - d / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize) }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError("")

  try {
    const data = await loginUser(form)

    localStorage.setItem("token", data.token)

    router.push("/dashboard")
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
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
          --accent:#00ff9d;--red:#f87171;
          --mono:'JetBrains Mono',monospace;--sans:'Syne',sans-serif;
          --r:10px;--rl:16px;
        }
        body{background:var(--bg);color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased}
        button{cursor:pointer}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}

        @keyframes fadeUp   {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn   {from{opacity:0}to{opacity:1}}
        @keyframes glowPulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes slideInL {from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInR {from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spinLoader{to{transform:rotate(360deg)}}
        @keyframes errorShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
        @keyframes borderGlow{0%,100%{box-shadow:0 0 0 0 rgba(0,255,157,0)}50%{box-shadow:0 0 0 3px rgba(0,255,157,0.15)}}
        @keyframes scanV    {0%{top:-20%}100%{top:110%}}

        .left-panel  {animation:slideInL .7s cubic-bezier(.22,1,.36,1) .05s both}
        .right-panel {animation:slideInR .7s cubic-bezier(.22,1,.36,1) .1s both}

        .stat-card {
          background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);
          padding:14px 18px;display:flex;flex-direction:column;gap:3px;
          transition:border-color .2s,box-shadow .2s;
        }
        .stat-card:hover{border-color:rgba(0,255,157,.3);box-shadow:0 0 16px rgba(0,255,157,.07)}

        .auth-input {
          background:var(--bg3);border:1px solid var(--border2);
          border-radius:var(--r);color:var(--text);
          padding:13px 16px;font-size:14px;font-family:var(--mono);
          outline:none;width:100%;
          transition:border-color .2s,box-shadow .2s;
        }
        .auth-input:focus{border-color:rgba(0,255,157,.5);box-shadow:0 0 0 3px rgba(0,255,157,.08)}
        .auth-input.focused{border-color:rgba(0,255,157,.5);box-shadow:0 0 0 3px rgba(0,255,157,.08)}

        .submit-btn{
          background:var(--accent);border:none;color:#000;
          padding:14px;border-radius:var(--r);
          font-size:15px;font-weight:700;font-family:var(--sans);
          width:100%;transition:box-shadow .2s,transform .2s,opacity .15s;
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .submit-btn:hover:not(:disabled){box-shadow:0 0 24px rgba(0,255,157,.5);transform:translateY(-1px)}
        .submit-btn:active:not(:disabled){transform:translateY(0)}

        .error-box{animation:errorShake .35s ease}

        /* ── Responsive ── */
        @media(max-width:800px){
          .auth-layout{flex-direction:column!important}
          .left-panel{
            flex:none!important;width:100%!important;
            padding:40px 24px!important;min-height:auto!important;
          }
          .hide-mobile{display:none!important}
          .right-panel{width:100%!important;padding:40px 24px!important}
          .stat-row{gap:8px!important}
        }
        @media(max-width:400px){
          .left-panel{padding:32px 18px!important}
          .right-panel{padding:32px 18px!important}
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", opacity: mounted ? 1 : 0, transition: "opacity .35s" }}>
        <div className="auth-layout" style={{ display: "flex", minHeight: "100vh" }}>

          {/* ══ LEFT PANEL ══════════════════════════════════════════ */}
          <div className="left-panel" style={{
            flex: 1, background: "var(--bg2)",
            borderRight: "1px solid var(--border)",
            display: "flex", alignItems: "center",
            padding: "60px 56px",
            position: "relative", overflow: "hidden",
          }}>
            {/* particle canvas */}
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />

            {/* grid overlay */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
              backgroundImage: `linear-gradient(rgba(0,255,157,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,157,0.03) 1px,transparent 1px)`,
              backgroundSize: "44px 44px",
            }} />

            {/* scan line */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 60, pointerEvents: "none", zIndex: 2,
              background: "linear-gradient(to bottom,transparent,rgba(0,255,157,.02),transparent)",
              animation: "scanV 8s linear infinite",
            }} />

            {/* ambient glow blob */}
            <div style={{
              position: "absolute", top: "20%", left: "30%",
              width: 280, height: 280,
              background: "radial-gradient(circle,rgba(0,255,157,.06),transparent 70%)",
              filter: "blur(30px)", pointerEvents: "none", zIndex: 1,
              animation: "glowPulse 5s ease-in-out infinite",
            }} />

            <div style={{ position: "relative", zIndex: 3, maxWidth: 420, display: "flex", flexDirection: "column", gap: 32 }}>

              {/* logo */}
              <Link href="/" style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600, display: "inline-block", textDecoration: "none", color: "inherit" }}>
                <span style={{ color: "var(--accent)", textShadow: "0 0 14px rgba(0,255,157,.6)" }}>&lt;</span>
                ReviewAI
                <span style={{ color: "var(--accent)", textShadow: "0 0 14px rgba(0,255,157,.6)" }}>/&gt;</span>
              </Link>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <h2 style={{ fontFamily: "var(--sans)", fontSize: "clamp(26px,4vw,44px)", fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.1 }}>
                  Code review,<br />
                  <span style={{ color: "var(--accent)", textShadow: "0 0 20px rgba(0,255,157,.45)" }}>supercharged.</span>
                </h2>
                <p className="hide-mobile" style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.7, fontFamily: "var(--sans)" }}>
                  Paste code. Get inline AI comments on every suspicious line.
                  Security, performance, style — all flagged instantly.
                </p>
              </div>

              {/* stat cards */}
              <div className="stat-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { val: "10+",  label: "languages" },
                  { val: "< 5s", label: "avg review" },
                  { val: "100%", label: "private"   },
                ].map(s => (
                  <div key={s.label} className="stat-card">
                    <span style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 600, color: "var(--accent)", textShadow: "0 0 10px rgba(0,255,157,.4)", lineHeight: 1 }}>{s.val}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--sans)" }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* mini terminal decoration */}
              <div className="hide-mobile" style={{
                background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: "var(--r)", padding: "14px 16px",
                fontFamily: "var(--mono)", fontSize: 12,
              }}>
                <div style={{ color: "var(--muted)", marginBottom: 6 }}>
                  <span style={{ color: "var(--accent)" }}>$</span> reviewai analyze ./auth.js
                </div>
                <div style={{ color: "#f87171" }}>  ● error  line 12 — SQL injection</div>
                <div style={{ color: "#fbbf24" }}>  ● warn   line 28 — unbounded cache</div>
                <div style={{ color: "var(--accent)", marginTop: 6 }}>  ✓ score: 4/10 · fix ready</div>
              </div>
            </div>
          </div>

          {/* ══ RIGHT PANEL ═════════════════════════════════════════ */}
          <div className="right-panel" style={{
            width: 500, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "60px 52px",
            position: "relative", overflow: "hidden",
          }}>
            {/* subtle right-side glow */}
            <div style={{
              position: "absolute", top: "40%", right: "-60px",
              width: 200, height: 200,
              background: "radial-gradient(circle,rgba(0,255,157,.04),transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ width: "100%", maxWidth: 360, position: "relative", zIndex: 1 }}>

              {/* heading */}
              <div style={{ marginBottom: 32, animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .15s both" }}>
                <h1 style={{ fontFamily: "var(--sans)", fontSize: 30, fontWeight: 800, letterSpacing: "-1px", marginBottom: 8 }}>
                  Welcome back
                </h1>
                <p style={{ fontSize: 14, color: "var(--muted)", fontFamily: "var(--sans)" }}>
                  Don't have an account?{" "}
                  <Link href="/register" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Sign up free</Link>
                </p>
              </div>

              {/* form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* email */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .22s both" }}>
                  <label style={labelStyle}>Email</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className={`auth-input${focusedField === "email" ? " focused" : ""}`}
                      type="email" name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      required autoComplete="email"
                    />
                    {/* field icon */}
                    {form.email && (
                      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 11, animation: "fadeIn .2s ease" }}>✓</span>
                    )}
                  </div>
                </div>

                {/* password */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .28s both" }}>
                  <label style={labelStyle}>Password</label>
                  <input
                    className={`auth-input${focusedField === "password" ? " focused" : ""}`}
                    type="password" name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    required autoComplete="current-password"
                  />
                </div>

                {/* error */}
                {error && (
                  <div className="error-box" style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(248,113,113,0.07)",
                    border: "1px solid rgba(248,113,113,0.25)",
                    borderRadius: "var(--r)", padding: "11px 14px",
                  }}>
                    <span style={{ color: "#f87171", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600 }}>ERR</span>
                    <span style={{ color: "#f87171", fontFamily: "var(--mono)", fontSize: 12 }}>{error}</span>
                  </div>
                )}

                {/* submit */}
                <div style={{ animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .34s both" }}>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                    style={{ opacity: loading ? 0.75 : 1 }}
                  >
                    {loading ? (
                      <>
                        <span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000", borderRadius: "50%", animation: "spinLoader .6s linear infinite", display: "inline-block" }} />
                        Signing in...
                      </>
                    ) : "Sign in →"}
                  </button>
                </div>
              </form>

              {/* divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0", animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .4s both" }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}>secure login</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* security note */}
              <div style={{ display: "flex", gap: 10, alignItems: "center", animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .45s both" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px rgba(0,255,157,.6)", flexShrink: 0, animation: "glowPulse 2s ease-in-out infinite" }} />
                <p style={{ fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)", lineHeight: 1.5 }}>
                  Your session is encrypted end-to-end with JWT.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "var(--muted)",
  letterSpacing: "0.07em", textTransform: "uppercase", fontFamily: "var(--sans)",
}