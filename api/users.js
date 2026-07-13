// Lista compartida de usuarios de la app (para que un usuario creado en
// cualquier dispositivo aparezca en el login de todos los demás).
// GET  /api/users -> { users: [...] }
// POST /api/users  body { username } -> agrega si no existe, devuelve { users: [...] }

import { kv } from '@vercel/kv';

const USERS_KEY = 'rutina:_usuarios';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const users = (await kv.get(USERS_KEY)) || [];
    return res.status(200).json({ users });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const username = (body?.username || '').trim();
    if (!username) return res.status(400).json({ error: 'Falta username' });

    const users = (await kv.get(USERS_KEY)) || [];
    if (!users.includes(username)) {
      users.push(username);
      await kv.set(USERS_KEY, users);
    }
    return res.status(200).json({ users });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
