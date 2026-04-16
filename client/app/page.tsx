// app/(marketing)/page.tsx  — Landing page (no auth required)
"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const DEMO_LINES = [
  { ln: 1,  code: `async function getUser(id) {`,              comment: null },
  { ln: 2,  code: `  const query = \`SELECT * FROM users`,      comment: null },
  { ln: 3,  code: `    WHERE id = \${id}\``,                    comment: { sev: "error", text: "SQL injection risk" } },
  { ln: 4,  code: `  return db.query(query)`,                   comment: null },
  { ln: 5,  code: `}`,                                          comment: null },
  { ln: 6,  code: ``,                                           comment: null },
  { ln: 7,  code: `const cache = {}`,                           comment: null },
  { ln: 8,  code: `function fetchData(url) {`,                  comment: null },
  { ln: 9,  code: `  if (cache[url]) return cache[url]`,        comment: { sev: "warning", text: "Cache grows unbounded" } },
  { ln: 10, code: `  return fetch(url).then(r => r.json())`,    comment: null },
  { ln: 11, code: `}`,                                          comment: null },
]

const SEV_COLOR: Record<string, string> = {
  error:   "#f87171",
  warning: "#fbbf24",
  info:    "#3b82f6",
}

const FEATURES = [
  {
    icon: "⟨/⟩",
    title: "Inline annotations",
    desc:  "AI comments appear directly on the line — just like GitHub PR reviews, not in a separate panel."
  },
  {
    icon: "▶▶",
    title: "Live streaming",
    desc:  "Reviews stream token-by-token. No waiting 30 seconds for a wall of text to appear."
  },
  {
    icon: "⌥",
    title: "Before / after diff",
    desc:  "Every suggestion shows a diff view. Accept it or ignore it — your call."
  },
  {
    icon: "⇗",
    title: "Share links",
    desc:  "Generate a public read-only link for any review. Share with your team, expires in 7 days."
  },
]

export default function HomePage() {
  const router = useRouter()
  const [visibleLines, setVisibleLines] = useState(0)
  const [activeComment, setActiveComment] = useState<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Animate code lines appearing one by one
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setVisibleLines(v => {
        if (v >= DEMO_LINES.length) {
          clearInterval(intervalRef.current!)
          return v
        }
        return v + 1
      })
    }, 120)
    return () => clearInterval(intervalRef.current!)
  }, [])

  return (
    <div style={styles.root}>

      {/* ── NAV ── */}
      <nav style={styles.nav}>
        <span style={styles.logo}>
          <span style={{ color: "var(--accent)" }}>&lt;</span>
          ReviewAI
          <span style={{ color: "var(--accent)" }}>/&gt;</span>
        </span>
        <div style={styles.navLinks}>
          <button style={styles.navBtn} onClick={() => router.push("/login")}>
            Sign in
          </button>
          <button style={styles.ctaBtn} onClick={() => router.push("/register")}>
            Get started free
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>
          <span style={{ color: "var(--accent)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
            v1.0
          </span>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>AI-powered code review</span>
        </div>

        <h1 style={styles.heroTitle}>
          Your code reviewed<br />
          <span style={styles.heroAccent}>line by line.</span>
        </h1>

        <p style={styles.heroSub}>
          Paste your code. Get inline AI comments with severity ratings,
          fix suggestions, and a shareable review link — in seconds.
        </p>

        <div style={styles.heroCtas}>
          <button style={styles.ctaBtn} onClick={() => router.push("/register")}>
            Start reviewing for free
          </button>
          <button style={styles.ghostBtn} onClick={() => router.push("/login")}>
            Sign in →
          </button>
        </div>

        {/* ── DEMO EDITOR ── */}
        <div style={styles.demoWrap}>
          {/* top bar */}
          <div style={styles.demoBar}>
            <div style={styles.trafficLights}>
              <span style={{ ...styles.dot, background: "#f87171" }} />
              <span style={{ ...styles.dot, background: "#fbbf24" }} />
              <span style={{ ...styles.dot, background: "#00ff9d" }} />
            </div>
            <span style={styles.demoFileName}>getUser.js</span>
            <span style={{ ...styles.langBadge }}>JavaScript</span>
          </div>

          {/* code lines */}
          <div style={styles.codeArea}>
            {DEMO_LINES.slice(0, visibleLines).map((line) => (
              <div
                key={line.ln}
                style={{
                  ...styles.codeLine,
                  background: activeComment === line.ln
                    ? "rgba(248,113,113,0.07)"
                    : "transparent",
                }}
                onMouseEnter={() => line.comment && setActiveComment(line.ln)}
                onMouseLeave={() => setActiveComment(null)}
              >
                <span style={styles.lineNum}>{line.ln}</span>

                {/* severity gutter dot */}
                {line.comment ? (
                  <span
                    style={{
                      ...styles.gutterDot,
                      background: SEV_COLOR[line.comment.sev],
                      boxShadow: `0 0 6px ${SEV_COLOR[line.comment.sev]}88`,
                    }}
                  />
                ) : (
                  <span style={styles.gutterEmpty} />
                )}

                <code style={styles.codeText}>{line.code}</code>

                {/* inline comment tooltip */}
                {activeComment === line.ln && line.comment && (
                  <div
                    style={{
                      ...styles.inlineComment,
                      borderColor: SEV_COLOR[line.comment.sev],
                    }}
                  >
                    <span
                      style={{
                        ...styles.commentSev,
                        color: SEV_COLOR[line.comment.sev],
                      }}
                    >
                      {line.comment.sev.toUpperCase()}
                    </span>
                    <span style={styles.commentText}>{line.comment.text}</span>
                  </div>
                )}
              </div>
            ))}

            {/* blinking cursor */}
            {visibleLines < DEMO_LINES.length && (
              <div style={styles.codeLine}>
                <span style={styles.lineNum}>{visibleLines + 1}</span>
                <span style={styles.gutterEmpty} />
                <span style={styles.cursor} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={styles.features}>
        <p style={styles.sectionLabel}>// what you get</p>
        <h2 style={styles.sectionTitle}>Everything a senior dev would tell you.</h2>

        <div style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} style={styles.featureCard}>
              <span style={styles.featureIcon}>{f.icon}</span>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section style={styles.ctaStrip}>
        <h2 style={styles.ctaTitle}>
          Stop guessing. Start reviewing.
        </h2>
        <button style={styles.ctaBtn} onClick={() => router.push("/register")}>
          Create free account →
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={styles.footer}>
        <span style={styles.logo}>
          <span style={{ color: "var(--accent)" }}>&lt;</span>ReviewAI
          <span style={{ color: "var(--accent)" }}>/&gt;</span>
        </span>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          Built with Next.js · MongoDB · OpenAI
        </span>
      </footer>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    background: "var(--bg)",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 40px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontFamily: "var(--font-mono)",
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: "-0.5px",
  },
  navLinks: { display: "flex", gap: 12, alignItems: "center" },
  navBtn: {
    background: "transparent",
    border: "1px solid var(--border2)",
    color: "var(--text)",
    padding: "8px 18px",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontFamily: "var(--font-sans)",
  },
  ctaBtn: {
    background: "var(--accent)",
    border: "none",
    color: "#000",
    padding: "10px 22px",
    borderRadius: "var(--radius)",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "var(--font-sans)",
    transition: "opacity 0.15s",
  },
  ghostBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    fontSize: 15,
    fontFamily: "var(--font-sans)",
    padding: "10px 4px",
  },

  // Hero
  hero: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "80px 24px 60px",
    textAlign: "center",
    gap: 24,
  },
  heroBadge: {
    display: "inline-flex",
    gap: 10,
    alignItems: "center",
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: "5px 14px",
  },
  heroTitle: {
    fontFamily: "var(--font-sans)",
    fontSize: "clamp(36px, 6vw, 72px)",
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: "-2px",
    color: "var(--text)",
  },
  heroAccent: {
    color: "var(--accent)",
    fontStyle: "italic",
  },
  heroSub: {
    fontSize: 17,
    color: "var(--muted)",
    maxWidth: 520,
    lineHeight: 1.7,
    fontFamily: "var(--font-sans)",
  },
  heroCtas: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", justifyContent: "center" },

  // Demo editor
  demoWrap: {
    width: "100%",
    maxWidth: 720,
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: var_radius_lg(),
    overflow: "hidden",
    marginTop: 16,
    textAlign: "left",
  },
  demoBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg3)",
  },
  trafficLights: { display: "flex", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  demoFileName: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--muted)",
    flex: 1,
  },
  langBadge: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--accent)",
    background: "rgba(0,255,157,0.08)",
    border: "1px solid rgba(0,255,157,0.2)",
    borderRadius: 4,
    padding: "2px 8px",
  },
  codeArea: { padding: "12px 0", minHeight: 200 },
  codeLine: {
    display: "flex",
    alignItems: "center",
    padding: "1px 16px",
    position: "relative",
    gap: 8,
    minHeight: 22,
    transition: "background 0.1s",
  },
  lineNum: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--muted)",
    minWidth: 24,
    textAlign: "right",
    userSelect: "none",
  },
  gutterDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    flexShrink: 0,
    cursor: "pointer",
  },
  gutterEmpty: { width: 7, flexShrink: 0 },
  codeText: {
    fontFamily: "var(--font-mono)",
    fontSize: 12.5,
    color: "var(--text)",
    whiteSpace: "pre",
  },
  inlineComment: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    gap: 8,
    alignItems: "center",
    background: "var(--bg4)",
    border: "1px solid",
    borderRadius: 6,
    padding: "3px 10px",
    zIndex: 10,
  },
  commentSev: {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.05em",
  },
  commentText: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--muted)",
  },
  cursor: {
    width: 8,
    height: 14,
    background: "var(--accent)",
    borderRadius: 1,
    animation: "blink 1s step-end infinite",
  },

  // Features
  features: {
    padding: "80px 40px",
    maxWidth: 1100,
    margin: "0 auto",
    width: "100%",
  },
  sectionLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--accent)",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: "clamp(24px, 4vw, 42px)",
    fontWeight: 700,
    letterSpacing: "-1px",
    marginBottom: 48,
    lineHeight: 1.2,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 20,
  },
  featureCard: {
    background: "var(--bg2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "28px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    transition: "border-color 0.2s",
  },
  featureIcon: {
    fontFamily: "var(--font-mono)",
    fontSize: 20,
    color: "var(--accent)",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: "-0.3px",
  },
  featureDesc: {
    fontSize: 14,
    color: "var(--muted)",
    lineHeight: 1.65,
    fontFamily: "var(--font-sans)",
  },

  // CTA strip
  ctaStrip: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 24,
    padding: "80px 24px",
    borderTop: "1px solid var(--border)",
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: "clamp(22px, 4vw, 40px)",
    fontWeight: 700,
    letterSpacing: "-1px",
  },

  // Footer
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 40px",
    borderTop: "1px solid var(--border)",
    flexWrap: "wrap",
    gap: 12,
  },
}

// helper to avoid CSS var in string context
function var_radius_lg() { return "var(--radius-lg)" as unknown as string }