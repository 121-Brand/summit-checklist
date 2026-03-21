export default async function handler(req, res) {
  // This endpoint just validates and compresses share data
  // Actual sharing uses URL-encoded data - no storage needed
  
  if (req.method === "POST") {
    const { action, data, permissions } = req.body;
    
    if (action === "encode") {
      try {
        // Strip heavy fields to keep URL reasonable
        const slim = {
          sections: (data.sections || []).map(s => ({
            id: s.id, title: s.title, due: s.due,
            items: s.items.map(i => ({ id: i.id, text: i.text, owner: i.owner, p: i.p, blockedBy: i.blockedBy }))
          })),
          checks: data.checks || {},
          statuses: data.statuses || {},
          notes: data.notes || {},
          context: data.context || {},
          permissions: permissions || { canEdit: true },
        };
        const json = JSON.stringify(slim);
        const encoded = Buffer.from(json).toString("base64url");
        return res.status(200).json({ encoded, size: encoded.length });
      } catch (e) {
        return res.status(500).json({ error: "Failed to encode: " + e.message });
      }
    }
    
    if (action === "decode") {
      try {
        const { encoded } = req.body;
        const json = Buffer.from(encoded, "base64url").toString("utf-8");
        const data = JSON.parse(json);
        return res.status(200).json({ data });
      } catch (e) {
        return res.status(500).json({ error: "Failed to decode: " + e.message });
      }
    }
    
    return res.status(400).json({ error: "Invalid action" });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}
