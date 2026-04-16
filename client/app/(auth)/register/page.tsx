// app/(auth)/register/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { registerUser } from "@/app/lib/api"


/* password strength */
const getStrength = (pw: string): { score: number; label: string; color: string } => {
  if (!pw) return { score: 0, label: "", color: "var(--border)" }
  let s = 0
  if (pw.length >= 8)  s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  const map = [
    { label: "weak",   color: "#f87171" },
    { label: "weak",   color: "#f87171" },
    { label: "fair",   color: "#fb923c" },
    { label: "good",   color: "#fbbf24" },
    { label: "strong", color: "#00ff9d" },
  ]
  return { score: s, ...map[s] }
}

const STEPS = [
  "Create your free account",
  "Paste any code in any language",
  "Get inline AI review in seconds",
  "Share with your team via link",
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm]           = useState({ name: "", email: "", password: "" })
  const [error, setError]         = useState("")
  const [loading, setLoading]     = useState(false)
  const [mounted, setMounted]     = useState(false)
  const [focusField, setFocusField] = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => { setMounted(true) }, [])

  /* cycle active step for the animated step list */
  useEffect(() => {
    const t = setInterval(() => setActiveStep(s => (s + 1) % STEPS.length), 2200)
    return () => clearInterval(t)
  }, [])

  /* animated hex grid canvas */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    let raf: number, W = 0, H = 0

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }
    resize()
    window.addEventListener("resize", resize)

    // draw grid of dots that pulse in waves
    let frame = 0
    const STEP = 36
    const tick = () => {
      ctx.clearRect(0, 0, W, H)
      frame++
      for (let y = 0; y <= H + STEP; y += STEP) {
        for (let x = 0; x <= W + STEP; x += STEP) {
          const dist = Math.hypot(x - W * 0.5, y - H * 0.5)
          const alpha = 0.04 + 0.14 * Math.abs(Math.sin((frame * 0.012) - dist * 0.018))
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0,255,157,${alpha})`
          ctx.fill()
        }
      }
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
    await registerUser(form)

    alert("Registered successfully 🚀")
    router.push("/login")
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

  const strength = getStrength(form.password)

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
          --orange:#fb923c;--yellow:#fbbf24;
          --mono:'JetBrains Mono',monospace;--sans:'Syne',sans-serif;
          --r:10px;--rl:16px;
        }
        body{background:var(--bg);color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased}
        button{cursor:pointer}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}

        @keyframes fadeUp    {from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn    {from{opacity:0}to{opacity:1}}
        @keyframes glowPulse {0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes slideInL  {from{opacity:0;transform:translateX(-28px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInR  {from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spinLoader{to{transform:rotate(360deg)}}
        @keyframes errorShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
        @keyframes successPop{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
        @keyframes scanV     {0%{top:-20%}100%{top:110%}}
        @keyframes stepSlide {from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes strengthGrow{from{width:0}to{width:100%}}

        .left-panel  {animation:slideInL .7s cubic-bezier(.22,1,.36,1) .05s both}
        .right-panel {animation:slideInR .7s cubic-bezier(.22,1,.36,1) .1s both}

        .auth-input{
          background:var(--bg3);border:1px solid var(--border2);
          border-radius:var(--r);color:var(--text);
          padding:13px 44px 13px 16px;font-size:14px;font-family:var(--mono);
          outline:none;width:100%;
          transition:border-color .2s,box-shadow .2s;
        }
        .auth-input:focus,.auth-input.focused{
          border-color:rgba(0,255,157,.5);
          box-shadow:0 0 0 3px rgba(0,255,157,.08);
        }

        .submit-btn{
          background:var(--accent);border:none;color:#000;
          padding:14px;border-radius:var(--r);
          font-size:15px;font-weight:700;font-family:var(--sans);
          width:100%;transition:box-shadow .2s,transform .2s,opacity .15s;
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .submit-btn:hover:not(:disabled){box-shadow:0 0 26px rgba(0,255,157,.52);transform:translateY(-1px)}
        .submit-btn:active:not(:disabled){transform:translateY(0)}

        .step-item{
          display:flex;gap:14px;align-items:flex-start;
          padding:10px 12px;border-radius:var(--r);
          border:1px solid transparent;
          transition:all .3s ease;
        }
        .step-item.active{
          background:rgba(0,255,157,.05);
          border-color:rgba(0,255,157,.15);
        }

        .error-box{animation:errorShake .35s ease}
        .success-box{animation:successPop .4s cubic-bezier(.22,1,.36,1)}

        /* ── Responsive ── */
        @media(max-width:820px){
          .auth-layout{flex-direction:column!important}
          .left-panel{
            flex:none!important;width:100%!important;
            padding:36px 24px!important;min-height:auto!important;
          }
          .right-panel{width:100%!important;padding:36px 24px!important}
          .hide-mobile{display:none!important}
        }
        @media(max-width:400px){
          .left-panel,.right-panel{padding:28px 16px!important}
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "var(--bg)", opacity: mounted ? 1 : 0, transition: "opacity .35s" }}>
        <div className="auth-layout" style={{ display: "flex", minHeight: "100vh" }}>

          {/* ══ LEFT PANEL ══════════════════════════════════════════ */}
          <div className="left-panel" style={{
            flex: 1, background: "var(--bg2)",
            borderRight: "1px solid var(--border)",
            display: "flex", alignItems: "center",
            padding: "60px 52px",
            position: "relative", overflow: "hidden",
          }}>
            {/* wave dot canvas */}
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />

            {/* scan sweep */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 60, pointerEvents: "none", zIndex: 1,
              background: "linear-gradient(to bottom,transparent,rgba(0,255,157,.025),transparent)",
              animation: "scanV 9s linear infinite",
            }} />

            {/* ambient glow */}
            <div style={{
              position: "absolute", bottom: "15%", left: "20%",
              width: 260, height: 260,
              background: "radial-gradient(circle,rgba(0,255,157,.07),transparent 70%)",
              filter: "blur(28px)", pointerEvents: "none", zIndex: 1,
              animation: "glowPulse 6s ease-in-out infinite",
            }} />

            <div style={{ position: "relative", zIndex: 2, maxWidth: 420, display: "flex", flexDirection: "column", gap: 32 }}>

              {/* logo */}
              <Link href="/" style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600, display: "inline-block", textDecoration: "none", color: "inherit" }}>
                <span style={{ color: "var(--accent)", textShadow: "0 0 14px rgba(0,255,157,.6)" }}>&lt;</span>
                ReviewAI
                <span style={{ color: "var(--accent)", textShadow: "0 0 14px rgba(0,255,157,.6)" }}>/&gt;</span>
              </Link>

              <div>
                <h2 style={{ fontFamily: "var(--sans)", fontSize: "clamp(24px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1.1, marginBottom: 10 }}>
                  Start reviewing<br />
                  <span style={{ color: "var(--accent)", textShadow: "0 0 20px rgba(0,255,157,.4)" }}>smarter.</span>
                </h2>
                <p className="hide-mobile" style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65, fontFamily: "var(--sans)" }}>
                  Free account. No credit card. Works with any language in any editor.
                </p>
              </div>

              {/* animated step list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {STEPS.map((step, i) => (
                  <div
                    key={i}
                    className={`step-item${activeStep === i ? " active" : ""}`}
                  >
                    <span style={{
                      fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700,
                      color: activeStep === i ? "var(--accent)" : "var(--border2)",
                      minWidth: 24, marginTop: 1,
                      textShadow: activeStep === i ? "0 0 8px rgba(0,255,157,.5)" : "none",
                      transition: "color .3s, text-shadow .3s",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{
                      fontFamily: "var(--sans)", fontSize: 14,
                      color: activeStep === i ? "var(--text)" : "var(--muted)",
                      lineHeight: 1.5,
                      transition: "color .3s",
                    }}>
                      {step}
                    </span>
                    {activeStep === i && (
                      <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px rgba(0,255,157,.7)", flexShrink: 0, marginTop: 4, animation: "glowPulse 1.5s ease-in-out infinite" }} />
                    )}
                  </div>
                ))}
              </div>

              {/* live counter decoration */}
              <div className="hide-mobile" style={{
                display: "flex", gap: 3, alignItems: "center",
                fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 6px rgba(0,255,157,.6)", animation: "glowPulse 1.8s ease-in-out infinite" }} />
                &nbsp;reviews running right now
              </div>
            </div>
          </div>

          {/* ══ RIGHT PANEL ═════════════════════════════════════════ */}
          <div className="right-panel" style={{
            width: 500, display: "flex", alignItems: "center",
            justifyContent: "center", padding: "60px 52px",
            position: "relative", overflow: "hidden",
          }}>
            {/* right panel ambient */}
            <div style={{
              position: "absolute", top: "30%", right: "-80px",
              width: 240, height: 240,
              background: "radial-gradient(circle,rgba(0,255,157,.035),transparent 70%)",
              pointerEvents: "none",
            }} />

            <div style={{ width: "100%", maxWidth: 360, position: "relative", zIndex: 1 }}>

              {/* success overlay */}
              {success && (
                <div className="success-box" style={{
                  position: "absolute", inset: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
                  background: "var(--bg)", borderRadius: "var(--rl)", zIndex: 10,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "rgba(0,255,157,.1)", border: "2px solid var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 24px rgba(0,255,157,.4)",
                    fontSize: 24,
                  }}>✓</div>
                  <p style={{ fontFamily: "var(--sans)", fontSize: 18, fontWeight: 700 }}>Account created!</p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>Redirecting to login...</p>
                </div>
              )}

              {/* heading */}
              <div style={{ marginBottom: 32, animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .15s both" }}>
                <h1 style={{ fontFamily: "var(--sans)", fontSize: 30, fontWeight: 800, letterSpacing: "-1px", marginBottom: 8 }}>
                  Create account
                </h1>
                <p style={{ fontSize: 14, color: "var(--muted)", fontFamily: "var(--sans)" }}>
                  Already have one?{" "}
                  <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Name */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .2s both" }}>
                  <label style={labelStyle}>Name</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className={`auth-input${focusField === "name" ? " focused" : ""}`}
                      type="text" name="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={handleChange}
                      onFocus={() => setFocusField("name")}
                      onBlur={() => setFocusField(null)}
                      required autoComplete="name"
                    />
                    {form.name.length >= 2 && (
                      <span style={tickStyle}>✓</span>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .26s both" }}>
                  <label style={labelStyle}>Email</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className={`auth-input${focusField === "email" ? " focused" : ""}`}
                      type="email" name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      onFocus={() => setFocusField("email")}
                      onBlur={() => setFocusField(null)}
                      required autoComplete="email"
                    />
                    {form.email.includes("@") && (
                      <span style={tickStyle}>✓</span>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .32s both" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={labelStyle}>Password</label>
                    {form.password && (
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: strength.color, transition: "color .3s", animation: "fadeIn .2s ease" }}>
                        {strength.label}
                      </span>
                    )}
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      className={`auth-input${focusField === "password" ? " focused" : ""}`}
                      type="password" name="password"
                      placeholder="At least 8 characters"
                      value={form.password}
                      onChange={handleChange}
                      onFocus={() => setFocusField("password")}
                      onBlur={() => setFocusField(null)}
                      required autoComplete="new-password"
                    />
                    {strength.score === 4 && (
                      <span style={tickStyle}>✓</span>
                    )}
                  </div>

                  {/* strength segments */}
                  <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          background: strength.color,
                          width: strength.score >= n ? "100%" : "0%",
                          transition: "width .35s ease, background .35s ease",
                          boxShadow: strength.score >= n ? `0 0 6px ${strength.color}88` : "none",
                        }} />
                      </div>
                    ))}
                  </div>

                  {/* strength hints */}
                  {form.password && strength.score < 4 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 4, animation: "fadeIn .2s ease" }}>
                      {[
                        { label: "8+ chars",        met: form.password.length >= 8 },
                        { label: "uppercase",        met: /[A-Z]/.test(form.password) },
                        { label: "number",           met: /[0-9]/.test(form.password) },
                        { label: "special char",     met: /[^A-Za-z0-9]/.test(form.password) },
                      ].map(hint => (
                        <span key={hint.label} style={{
                          fontFamily: "var(--mono)", fontSize: 10,
                          color: hint.met ? "var(--accent)" : "var(--muted)",
                          background: hint.met ? "rgba(0,255,157,.08)" : "var(--bg3)",
                          border: `1px solid ${hint.met ? "rgba(0,255,157,.2)" : "var(--border)"}`,
                          borderRadius: 4, padding: "2px 7px",
                          transition: "all .25s",
                        }}>
                          {hint.met ? "✓ " : ""}{hint.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* error */}
                {error && (
                  <div className="error-box" style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "rgba(248,113,113,0.07)",
                    border: "1px solid rgba(248,113,113,0.25)",
                    borderRadius: "var(--r)", padding: "11px 14px",
                  }}>
                    <span style={{ color: "#f87171", fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700 }}>ERR</span>
                    <span style={{ color: "#f87171", fontFamily: "var(--mono)", fontSize: 12 }}>{error}</span>
                  </div>
                )}

                {/* submit */}
                <div style={{ animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .38s both" }}>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading || success}
                    style={{ opacity: loading ? 0.75 : 1 }}
                  >
                    {loading ? (
                      <>
                        <span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,.3)", borderTopColor: "#000", borderRadius: "50%", animation: "spinLoader .6s linear infinite", display: "inline-block" }} />
                        Creating account...
                      </>
                    ) : "Create account →"}
                  </button>
                </div>

                {/* terms */}
                <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", fontFamily: "var(--sans)", animation: "fadeUp .6s cubic-bezier(.22,1,.36,1) .44s both" }}>
                  By signing up you agree to our{" "}
                  <span style={{ color: "var(--muted)", textDecoration: "underline", cursor: "pointer" }}>terms of service</span>
                </p>
              </form>
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

const tickStyle: React.CSSProperties = {
  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
  color: "var(--accent)", fontFamily: "var(--mono)", fontSize: 13,
  textShadow: "0 0 8px rgba(0,255,157,.6)",
  animation: "fadeIn .2s ease",
}