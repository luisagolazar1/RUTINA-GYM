// Guarda/lee la rutina de UN usuario puntual (cada usuario tiene su propia rutina).
// GET  /api/routine?user=Luis  -> { routine: [...] }
// POST /api/routine?user=Luis  body { routine: [...] } -> guarda

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const user = (req.query.user || '').trim();
  if (!user) return res.status(400).json({ error: 'Falta parámetro user' });
  const key = `rutina:_routine_${user}`;

  if (req.method === 'GET') {
    const routine = (await kv.get(key)) || [];
    return res.status(200).json({ routine });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const routine = Array.isArray(body?.routine) ? body.routine : [];
    await kv.set(key, routine);
    return res.status(200).json({ ok: true, count: routine.length });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
