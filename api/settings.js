// Guarda/lee la configuración personal de cada usuario (por ahora: qué días entrena).
// GET  /api/settings?user=email  -> { activeDays: ['LUN','MIE','VIE'] }
// POST /api/settings?user=email  body { activeDays: [...] } -> requiere ser ese usuario, o admin

import { kv } from '@vercel/kv';
import { verifyGoogleToken, ADMIN_EMAIL } from '../lib/verify.js';

const DEFAULT_DAYS = ['LUN','MAR','MIE','JUE','VIE'];
const VALID_DAYS = ['LUN','MAR','MIE','JUE','VIE','SAB','DOM'];

export default async function handler(req, res) {
  const user = (req.query.user || '').trim().toLowerCase();
  if (!user) return res.status(400).json({ error: 'Falta parámetro user' });
  const key = `rutina:_settings_${user}`;

  if (req.method === 'GET') {
    const settings = (await kv.get(key)) || { activeDays: DEFAULT_DAYS };
    return res.status(200).json(settings);
  }

  if (req.method === 'POST') {
    const auth = await verifyGoogleToken(req);
    if (!auth) return res.status(401).json({ error: 'No autenticado' });
    if (auth.email !== user && auth.email !== ADMIN_EMAIL) {
      return res.status(403).json({ error: 'No autorizado para editar la configuración de otro usuario' });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    let activeDays = Array.isArray(body?.activeDays) ? body.activeDays.filter(d => VALID_DAYS.includes(d)) : [];
    if (activeDays.length === 0) activeDays = DEFAULT_DAYS;
    await kv.set(key, { activeDays });
    return res.status(200).json({ activeDays });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
