// Devuelve TODOS los ejercicios de un grupo muscular (bilingüe ES/EN),
// usando los endpoints ya agrupados por músculo de ExerciseGymGifsDB.
// GET /api/exercise-muscle?muscle=biceps -> { results: [...], muscle, count }

const BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0';

export default async function handler(req, res) {
  const muscle = (req.query.muscle || '').trim();
  if (!muscle) return res.status(400).json({ error: 'Falta parámetro muscle' });

  try {
    const [esRes, enRes] = await Promise.all([
      fetch(`${BASE}/api/es/muscles/${muscle}.json`),
      fetch(`${BASE}/api/en/muscles/${muscle}.json`),
    ]);
    if (!esRes.ok) return res.status(404).json({ error: 'Grupo muscular no encontrado' });

    const esData = await esRes.json();
    const enData = enRes.ok ? await enRes.json() : null;

    const esList = Array.isArray(esData) ? esData : (esData.exercises || []);
    const enList = enData ? (Array.isArray(enData) ? enData : (enData.exercises || [])) : [];
    const enById = {};
    enList.forEach(e => { enById[e.id] = e; });

    const results = esList.map(ex => ({
      name: ex.name,
      nameEn: (enById[ex.id] && enById[ex.id].name) || ex.name,
      muscle: ex.muscle,
      bodyPart: ex.bodyPart,
      equipment: ex.equipment,
      gifUrl: ex.gifUrl,
    }));

    return res.status(200).json({ results, muscle, count: results.length });
  } catch (e) {
    return res.status(500).json({ error: 'Error consultando el grupo muscular' });
  }
}
