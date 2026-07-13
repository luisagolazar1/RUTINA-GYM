// Lista de usuarios registrados (para el login y para "copiar rutina de otro usuario").
// GET  /api/users -> { users: [{email, name, picture}, ...] }   (lectura abierta)
// POST /api/users -> registra al usuario autenticado por el token de Google (no confía en el body)

import { kv } from '@vercel/kv';
import { verifyGoogleToken } from '../lib/verify.js';

const USERS_KEY = 'rutina:_usuarios';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const users = (await kv.get(USERS_KEY)) || [];
    return res.status(200).json({ users });
  }

  if (req.method === 'POST') {
    const auth = await verifyGoogleToken(req);
    if (!auth) return res.status(401).json({ error: 'No autenticado' });

    const users = (await kv.get(USERS_KEY)) || [];
    const idx = users.findIndex(u => u.email === auth.email);
    if (idx === -1) {
      users.push({ email: auth.email, name: auth.name, picture: auth.picture });
    } else {
      users[idx] = { email: auth.email, name: auth.name, picture: auth.picture };
    }
    await kv.set(USERS_KEY, users);
    return res.status(200).json({ users });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
