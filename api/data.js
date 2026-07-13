// Endpoint de sincronización de historial de entrenamiento (por usuario).
// GET  /api/data?user=email  -> devuelve { entries: [...] }   (lectura abierta)
// POST /api/data?user=email  body { entries: [...] } -> requiere ser ese usuario, o admin

import { kv } from '@vercel/kv';
import { verifyGoogleToken, ADMIN_EMAIL } from '../lib/verify.js';

export default async function handler(req, res) {
  const user = (req.query.user || '').trim().toLowerCase();
  if (!user) return res.status(400).json({ error: 'Falta parámetro user' });

  const key = `rutina:${user}`;

  if (req.method === 'GET') {
    if (user === '__ping__') return res.status(200).json({ ok: true });
    const entries = (await kv.get(key)) || [];
    return res.status(200).json({ entries });
  }

  if (req.method === 'POST') {
    const auth = await verifyGoogleToken(req);
    if (!auth) return res.status(401).json({ error: 'No autenticado' });
    if (auth.email !== user && auth.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'No autorizado para editar el historial de otro usuario' });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const entries = Array.isArray(body?.entries) ? body.entries : [];
    await kv.set(key, entries);
    return res.status(200).json({ ok: true, count: entries.length });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
