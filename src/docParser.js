// Parses various file types and returns extracted text
export async function extractText(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  
  if (ext === "csv" || ext === "tsv" || ext === "txt") {
    const text = await file.text();
    return { text, type: ext, lines: text.split("\n").map(l => l.trim()).filter(l => l.length > 2) };
  }
  
  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return { text: result.value, type: "docx", lines: result.value.split("\n").map(l => l.trim()).filter(l => l.length > 2) };
  }
  
  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    let allText = "";
    const lines = [];
    workbook.SheetNames.forEach((name) => {
      const sheet = workbook.Sheets[name];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      allText += csv + "\n";
      csv.split("\n").forEach(l => {
        const trimmed = l.trim();
        if (trimmed.length > 2) lines.push(trimmed);
      });
    });
    return { text: allText, type: "xlsx", lines };
  }
  
  // Fallback: try reading as text
  try {
    const text = await file.text();
    return { text, type: "unknown", lines: text.split("\n").map(l => l.trim()).filter(l => l.length > 2) };
  } catch(e) {
    throw new Error("Unsupported file type: " + ext);
  }
}

// Sends extracted text to AI for task parsing
export async function aiParseTasks(text, filename) {
  const response = await fetch("/api/parse-tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 30000), filename }),
  });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Server error" }));
    throw new Error(err.error || "Failed to parse tasks");
  }
  
  return response.json();
}
