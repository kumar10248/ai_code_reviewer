// services/ai.service.js
const OpenAI = require("openai")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are an expert code reviewer. 
Analyze the code and return ONLY valid JSON in this exact format, nothing else:
{
  "summary": "Overall review in 2-3 sentences",
  "comments": [
    {
      "lineNumber": 5,
      "severity": "error",
      "category": "security",
      "message": "What the problem is",
      "suggestion": "How to fix it with example code"
    }
  ]
}
Severity must be: info | warning | error
Category must be: security | performance | style | bug`

const streamAIReview = async (code, language, res) => {
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      stream: true,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Language: ${language}\n\nCode:\n${code}` }
      ]
    })

    let fullText = ""

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || ""
      fullText += token

      res.write(`data: ${JSON.stringify({ token })}\n\n`)
    }

    // ✅ Safe JSON parse
    let parsed = {}
    try {
      parsed = JSON.parse(fullText)
    } catch (err) {
      console.log("JSON parse failed:", fullText)
    }

    return {
      summary: parsed.summary || "",
      comments: parsed.comments || []
    }

  } catch (err) {
    console.error("AI ERROR:", err.message)

    // 🔥 Important: SSE safe error
    res.write(`data: ${JSON.stringify({
      type: "error",
      message: err.code === "insufficient_quota"
        ? "AI quota exceeded"
        : "AI service failed"
    })}\n\n`)

    return {
      summary: "AI review unavailable",
      comments: []
    }
  }
}

module.exports = { streamAIReview }