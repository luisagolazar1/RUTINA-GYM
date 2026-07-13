// Endpoint de sincronización en la nube.
// Usa Vercel KV (Redis administrado por Vercel/Upstash).
// GET  /api/data?user=NOMBRE  -> devuelve { entries: [...] }
// POST /api/data?user=NOMBRE  body { entries: [...] } -> guarda

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const user = (req.query.user || '').trim();
  if (!user) return res.status(400).json({ error: 'Falta parámetro user' });

  const key = `rutina:${user}`;

  if (req.method === 'GET') {
    if (user === '__ping__') return res.status(200).json({ ok: true });
    const entries = (await kv.get(key)) || [];
    return res.status(200).json({ entries });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const entries = Array.isArray(body?.entries) ? body.entries : [];
    await kv.set(key, entries);
    return res.status(200).json({ ok: true, count: entries.length });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
