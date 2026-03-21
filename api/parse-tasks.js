export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, context } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "No text content provided" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Anthropic API key not configured. Add ANTHROPIC_API_KEY to Vercel environment variables." });
  }

  // Build compact context block from project questionnaire
  const ctx = context || {};
  const teamList = (ctx.team || []).map(m => m.name + "(" + m.role + ")").join(", ");
  const existingSections = (ctx.sections || []).join(", ");
  const deadline = ctx.deadline || "none";
  const goal = ctx.goal || "complete project checklist";

  // Efficient system prompt - compact, no wasted tokens
  const systemPrompt = "You extract tasks from documents into structured JSON. Rules: Each task must be actionable with one clear deliverable. Skip headers, intros, duplicates, vague items. Assign owner by role match. Assign priority by deadline proximity and impact: CRITICAL=blocks launch, HIGH=important, MEDIUM=nice-to-have. Group into logical sections, reuse existing sections when they fit. Return ONLY valid JSON, no other text.";

  // Compact user prompt with project context
  const userPrompt = "PROJECT: " + goal + "\nTEAM: " + (teamList || "You(owner), Spencer(builder), Chase(QA)") + "\nDEADLINE: " + deadline + "\nEXISTING SECTIONS: " + (existingSections || "none yet") + "\nOWNERS: " + ((ctx.team || []).map(m => m.name).join(", ") || "You, Spencer, Chase") + "\n\nDOCUMENT:\n" + text.slice(0, 15000) + '\n\nReturn JSON: {"tasks":[{"text":"...","owner":"...","priority":"CRITICAL|HIGH|MEDIUM","section":"..."}]}';

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "Anthropic API error" });
    }

    const content = data.content?.[0]?.text || "";
    
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse AI response", raw: content.slice(0, 300) });
    }

    return res.status(200).json({
      tasks: parsed.tasks || [],
      usage: data.usage || {}
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
