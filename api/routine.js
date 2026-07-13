// Guarda/lee la rutina completa (compartida entre todos los usuarios).
// GET  /api/routine  -> { routine: [...] }
// POST /api/routine  body { routine: [...] } -> guarda

import { kv } from '@vercel/kv';

const ROUTINE_KEY = 'rutina:_shared_routine';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const routine = (await kv.get(ROUTINE_KEY)) || [];
    return res.status(200).json({ routine });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const routine = Array.isArray(body?.routine) ? body.routine : [];
    await kv.set(ROUTINE_KEY, routine);
    return res.status(200).json({ ok: true, count: routine.length });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
