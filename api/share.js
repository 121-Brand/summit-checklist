import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Create or update a shared project
    const { action, shareId, data, permissions } = req.body;

    if (action === "create") {
      const id = "share_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const payload = JSON.stringify({
        id, data, permissions: permissions || { canEdit: true },
        createdAt: Date.now(), updatedAt: Date.now(),
      });
      try {
        const blob = await put(`shares/${id}.json`, payload, { access: "public", contentType: "application/json" });
        return res.status(200).json({ shareId: id, url: blob.url });
      } catch (e) {
        return res.status(500).json({ error: "Failed to create share: " + e.message });
      }
    }

    if (action === "update" && shareId) {
      try {
        // Delete old blob first
        const blobs = await list({ prefix: `shares/${shareId}` });
        for (const b of blobs.blobs) { await del(b.url); }
        const payload = JSON.stringify({
          id: shareId, data, permissions: permissions || { canEdit: true },
          createdAt: Date.now(), updatedAt: Date.now(),
        });
        const blob = await put(`shares/${shareId}.json`, payload, { access: "public", contentType: "application/json" });
        return res.status(200).json({ shareId, url: blob.url });
      } catch (e) {
        return res.status(500).json({ error: "Failed to update share: " + e.message });
      }
    }

    return res.status(400).json({ error: "Invalid action" });
  }

  if (req.method === "GET") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing share ID" });
    try {
      const blobs = await list({ prefix: `shares/${id}` });
      if (blobs.blobs.length === 0) return res.status(404).json({ error: "Share not found" });
      const response = await fetch(blobs.blobs[0].url);
      const data = await response.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: "Failed to load share: " + e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
