const OpenAI = require("openai")

const openai = new OpenAI({
  baseURL: "https://router.huggingface.co/v1",
  apiKey: process.env.HF_TOKEN,
})

const SYSTEM_PROMPT = `You are a senior software engineer and security-focused code reviewer with 15+ years of experience across multiple languages and production systems.

CRITICAL OUTPUT RULE:
Return ONLY a single valid JSON object. No markdown. No backticks. No explanation. No preamble. The response must pass JSON.parse() without any preprocessing.

RESPONSE SCHEMA (every field is required, no exceptions):
{
  "summary": string,         // 2-3 sentences: overall quality, biggest risks, key strengths
  "score": number,           // integer 1-10. 1=broken/dangerous, 5=works but has issues, 10=production-ready
  "scoreReason": string,     // one sentence explaining exactly why this score was given
  "language": string,        // detected language e.g. "javascript", "python", "java"
  "comments": [
    {
      "lineNumber": number,  // exact line number (1-indexed). Use 0 if the issue is file-wide
      "severity": string,    // exactly one of: "info" | "warning" | "error"
      "category": string,    // exactly one of: "security" | "performance" | "style" | "bug" | "best_practice" | "type_safety"
      "message": string,     // what is wrong and why it matters (1-2 sentences, specific)
      "suggestion": string   // concrete fix with a short code example where possible
    }
  ],
  "fix": string,             // complete rewritten version of the code with all issues resolved
  "tags": string[]           // 2-5 lowercase tags e.g. ["sql-injection", "input-validation"]
}

SCORING GUIDE (be honest and strict):
1-2  → Broken, dangerous, or fundamentally incorrect
3-4  → Works but has critical security or correctness issues
5-6  → Functional but has meaningful bugs or bad practices
7-8  → Solid code with minor improvements possible
9-10 → Production-ready, well-structured, handles edge cases

COMMENT RULES:
- Minimum 2 comments, maximum 6 comments
- Every comment must reference a real line number from the submitted code
- No generic advice like "add error handling" — say exactly where and what kind
- Each suggestion must be actionable: tell the developer exactly what to change
- Severity definitions:
    "error"   → will cause bugs, crashes, data loss, or security vulnerabilities
    "warning"  → bad practice, performance issue, or likely future problem
    "info"    → style, readability, or minor improvement

FIX RULES:
- The "fix" field must be a complete, runnable replacement for the entire submitted code
- Apply every fix from your comments — do not leave any flagged issue unresolved
- Follow the language's idiomatic conventions and modern best practices
- Add input validation only if missing and genuinely needed
- Do NOT add unnecessary complexity or change the core logic

ANALYSIS CHECKLIST (check every item for every review):
✓ SQL/command/code injection risks
✓ Unvalidated or unsanitized user input
✓ Authentication and authorization gaps
✓ Memory leaks or unbounded data structures
✓ Type coercion bugs or implicit conversions
✓ Missing null/undefined/empty checks
✓ Error handling gaps (uncaught exceptions, unhandled promise rejections)
✓ Hardcoded credentials, secrets, or sensitive data
✓ Race conditions or concurrency issues
✓ Performance: N+1 queries, inefficient loops, unnecessary re-computation

TAG GUIDE — pick only relevant tags from this list (or add new specific ones):
"sql-injection" | "xss" | "input-validation" | "authentication" | "authorization"
"memory-leak" | "performance" | "type-safety" | "error-handling" | "async-await"
"race-condition" | "hardcoded-secret" | "null-check" | "clean-code" | "best-practice"
"security" | "bug" | "idiomatic" | "over-engineering" | "missing-validation"

FINAL RULE — read this before responding:
If your response contains anything other than the JSON object above, it is wrong. No "Here is the review:", no \`\`\`json, no trailing text. Start with { and end with }.`
// services/ai.service.js

const streamAIReview = async (code, language) => {
  try {
    const response = await openai.chat.completions.create({
      model: "Qwen/Qwen3-Coder-Next:novita",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Language: ${language}\n\nCode:\n${code}` }
      ]
    })

    const fullText = response.choices[0]?.message?.content || ""

    let parsed = {}
    try {
      const start = fullText.indexOf("{")
      const end = fullText.lastIndexOf("}") + 1
      const jsonString = fullText.slice(start, end)

      parsed = JSON.parse(jsonString)
    } catch (err) {
      console.log("JSON parse failed:", fullText)
    }

    const result = {
  summary: parsed.summary || "",
  score: parsed.score ?? 5,
  comments: parsed.comments ?? [],
  fix: parsed.fix ?? code,
 tags: parsed.tags?.length ? parsed.tags : ["best_practice", "clean_code"]
}

// ensure min comments
if (!Array.isArray(result.comments) || result.comments.length === 0) {
  result.comments = [{
    lineNumber: 1,
    severity: "info",
    category: "best_practice",
    message: "Code is simple but can be improved.",
    suggestion: "Consider improving structure or scalability."
  }]
}

return result

    // ✅ 👇 YE HI TUMHARA FALLBACK BLOCK HAI
    return {
      summary: parsed.summary || "",
      score: parsed.score || 5,
      comments: parsed.comments || [],
      fix: parsed.fix || code,
      tags: parsed.tags || []
    }

  } catch (err) {
    console.error("HF AI ERROR:", err.message)

    return {
      summary: "AI review unavailable",
      score: 0,
      comments: [],
      fix: code,
      tags: []
    }
  }
}
module.exports = { streamAIReview }