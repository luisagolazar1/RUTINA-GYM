// Verificación del ID token de Google (Sign in with Google) en el servidor.
// Usa el endpoint público de Google para validar la firma y extraer el email
// verificado del usuario. No confía en nada que mande el cliente sin validar.
//
// IMPORTANTE: reemplazar GOOGLE_CLIENT_ID por el mismo valor configurado en
// index.html (google.accounts.id.initialize). Deben coincidir exactamente.

export const GOOGLE_CLIENT_ID = 'TU_GOOGLE_CLIENT_ID_AQUI.apps.googleusercontent.com';
export const ADMIN_EMAIL = 'luisagolazar1@gmail.com';

export async function verifyGoogleToken(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`);
    if (!r.ok) return null;
    const data = await r.json();

    if (!data.email || data.email_verified !== 'true') return null;
    if (GOOGLE_CLIENT_ID !== 'TU_GOOGLE_CLIENT_ID_AQUI.apps.googleusercontent.com' && data.aud !== GOOGLE_CLIENT_ID) {
      return null; // token emitido para otra app, rechazar
    }

    return {
      email: data.email.toLowerCase(),
      name: data.name || data.email,
      picture: data.picture || ''
    };
  } catch (e) {
    return null;
  }
}
