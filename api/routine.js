// Guarda/lee la rutina de UN usuario puntual (cada usuario tiene su propia rutina).
// GET  /api/routine?user=email  -> { routine: [...] }   (lectura abierta, para poder "copiar de otro")
// POST /api/routine?user=email  body { routine: [...] } -> requiere estar logueado como ese usuario, o ser admin

import { kv } from '@vercel/kv';
import { verifyGoogleToken, ADMIN_EMAIL } from '../lib/verify.js';

export default async function handler(req, res) {
  const user = (req.query.user || '').trim().toLowerCase();
  if (!user) return res.status(400).json({ error: 'Falta parámetro user' });
  const key = `rutina:_routine_${user}`;

  if (req.method === 'GET') {
    const routine = (await kv.get(key)) || [];
    return res.status(200).json({ routine });
  }

  if (req.method === 'POST') {
    const auth = await verifyGoogleToken(req);
    if (!auth) return res.status(401).json({ error: 'No autenticado' });
    if (auth.email !== user && auth.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'No autorizado para editar la rutina de otro usuario' });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const routine = Array.isArray(body?.routine) ? body.routine : [];
    await kv.set(key, routine);
    return res.status(200).json({ ok: true, count: routine.length });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
