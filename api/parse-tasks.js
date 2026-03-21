export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, filename } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: "No text content provided" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Anthropic API key not configured. Add ANTHROPIC_API_KEY to Vercel environment variables." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are parsing a document into checklist tasks for a construction business AI agent system pre-sales readiness checklist.

The document is: "${filename || "uploaded file"}"

Extract every actionable task, requirement, or checklist item from this document. For each item, determine:
- text: The task description (clear, actionable)
- owner: Who should do it - one of "You" (business owner/strategy), "Spencer" (builder/customizer), or "Chase" (QA/onboarding). Use your best judgment based on the task type.
- priority: "CRITICAL", "HIGH", or "MEDIUM"
- section: A logical grouping/category for the task

Respond with ONLY valid JSON in this exact format, no other text:
{
  "tasks": [
    {"text": "...", "owner": "Chase", "priority": "CRITICAL", "section": "..."},
    ...
  ]
}

Here is the document content:

${text.slice(0, 30000)}`
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || "Anthropic API error" });
    }

    const content = data.content?.[0]?.text || "";
    
    // Parse the JSON from Claude's response
    let parsed;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse AI response", raw: content.slice(0, 500) });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
// env trigger
