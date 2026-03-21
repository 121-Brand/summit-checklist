export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Anthropic API key not configured" });
  }

  const { action, data } = req.body;
  if (!action) {
    return res.status(400).json({ error: "No action specified" });
  }

  let systemPrompt = "";
  let userPrompt = "";

  // ── FOCUS RECOMMENDATIONS ──
  if (action === "focus") {
    const { person, tasks, context } = data;
    systemPrompt = "You are a project manager AI. Given a person's pending tasks with deadlines and priorities, recommend the top 5 things they should focus on TODAY with brief reasoning. Be direct and actionable. Return ONLY valid JSON.";
    const taskList = tasks.slice(0, 30).map((t, i) => `${i + 1}. [${t.p}] ${t.text} (due ${t.due}, section: ${t.sectionTitle})`).join("\n");
    userPrompt = `Person: ${person}\nProject goal: ${context?.goal || "complete project"}\nDeadline: ${context?.deadline || "soon"}\nToday: ${new Date().toISOString().slice(0, 10)}\n\nTheir pending tasks:\n${taskList}\n\nReturn JSON: {"recommendations":[{"taskIndex":1,"reason":"brief reason"}],"dailyAdvice":"one sentence motivational advice for today"}`;
  }

  // ── TASK DECOMPOSITION ──
  else if (action === "decompose") {
    const { task, context } = data;
    systemPrompt = "You break a high-level task into 3-7 concrete subtasks. Each subtask should be completable in under 2 hours. Be specific to the domain (construction software, AI agents, etc). Return ONLY valid JSON.";
    userPrompt = `Project: ${context?.goal || "software project"}\nTeam: ${(context?.team || []).map(m => m.name + "(" + m.role + ")").join(", ")}\n\nBreak this task into subtasks:\n"${task.text}" (owner: ${task.owner}, priority: ${task.p})\n\nReturn JSON: {"subtasks":[{"text":"...","owner":"${task.owner}","priority":"${task.p}"}]}`;
  }

  // ── DUPLICATE DETECTION ──
  else if (action === "duplicates") {
    const { tasks } = data;
    systemPrompt = "You find duplicate or very similar tasks in a list. Group truly overlapping tasks together. Only flag genuine duplicates, not merely related tasks. Return ONLY valid JSON.";
    const taskList = tasks.slice(0, 100).map((t, i) => `${i}|${t.text}`).join("\n");
    userPrompt = `Find duplicate/overlapping tasks:\n${taskList}\n\nReturn JSON: {"groups":[{"indices":[0,5],"reason":"brief reason they overlap","suggestion":"merge|delete_one"}]}. If no duplicates found, return {"groups":[]}`;
  }

  // ── COMPLETION SCANNER ──
  else if (action === "completion_scan") {
    const { docText, tasks } = data;
    systemPrompt = "You compare a document showing completed work against a list of open tasks. For each task that appears to be completed based on the document evidence, include it in the matches. Be conservative - only match tasks where the document clearly shows the work is done. Return ONLY valid JSON.";
    const taskList = tasks.slice(0, 80).map((t) => `${t.id}|${t.text}|${t.section}`).join("\n");
    userPrompt = `OPEN TASKS:\n${taskList}\n\nDOCUMENT CONTENT (proof of completed work):\n${docText.slice(0, 12000)}\n\nWhich tasks are completed based on this document?\nReturn JSON: {"matches":[{"taskId":"...", "taskText":"the task text", "reason":"brief evidence from doc"}], "summary":"one sentence summary of what the document shows was completed"}`;
  }

  else {
    return res.status(400).json({ error: "Unknown action: " + action });
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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    const apiData = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: apiData.error?.message || "API error" });
    }

    const content = apiData.content?.[0]?.text || "";
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      return res.status(500).json({ error: "Failed to parse AI response", raw: content.slice(0, 300) });
    }

    return res.status(200).json({ result: parsed, usage: apiData.usage || {} });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
