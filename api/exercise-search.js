// Proxy de búsqueda contra la API gratuita de ExerciseDB (oss.exercisedb.dev).
// GET /api/exercise-search?q=lat pulldown -> { results: [{name, gifUrl}, ...] }
// No requiere API key. Uso no comercial, con atribución (ver footer del lightbox en la app).

const BASE = 'https://oss.exercisedb.dev/api/v1/exercises';
const MAX_PAGES = 15;
const MAX_RESULTS = 8;

export default async function handler(req, res) {
  const q = (req.query.q || '').trim().toLowerCase();
  if (!q) return res.status(400).json({ error: 'Falta parámetro q' });

  try {
    let results = [];
    let cursor = null;
    let page = 0;
    let hasNext = true;

    while (page < MAX_PAGES && hasNext && results.length < MAX_RESULTS) {
      const url = new URL(BASE);
      if (cursor) url.searchParams.set('cursor', cursor);
      const r = await fetch(url.toString());
      if (!r.ok) break;
      const data = await r.json();
      const items = Array.isArray(data.data) ? data.data : [];

      const matches = items.filter(ex => ex.name && ex.name.toLowerCase().includes(q));
      for (const m of matches) {
        results.push({ name: m.name, gifUrl: m.gifUrl });
        if (results.length >= MAX_RESULTS) break;
      }

      hasNext = !!data.meta?.hasNextPage;
      cursor = data.meta?.nextCursor;
      page++;
      if (!cursor) break;
    }

    return res.status(200).json({ results, source: 'ExerciseDB (oss.exercisedb.dev)' });
  } catch (e) {
    return res.status(500).json({ error: 'Error buscando en ExerciseDB' });
  }
}
