// Devuelve TODOS los ejercicios de un grupo muscular (bilingüe ES/EN),
// usando los endpoints ya agrupados por músculo de ExerciseGymGifsDB.
// GET /api/exercise-muscle?muscle=biceps -> { results: [...], muscle, count }

const BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0';

// La base de datos de origen archiva algunos ejercicios bajo un músculo distinto
// al esperado (ej: "hack squat" queda en glúteos aunque es un ejercicio de cuádriceps).
// Este mapa agrega esos ejercicios también al grupo donde el usuario los espera encontrar.
const CROSS_MUSCLE_INCLUDES = {
  quads: [{ fromMuscle: 'glutes', matchInSlug: 'hack-squat' }],
};

async function fetchMuscleList(muscle, lang) {
  const r = await fetch(`${BASE}/api/${lang}/muscles/${muscle}.json`);
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : (data.exercises || []);
}

export default async function handler(req, res) {
  const muscle = (req.query.muscle || '').trim();
  if (!muscle) return res.status(400).json({ error: 'Falta parámetro muscle' });

  try {
    const [esList, enList] = await Promise.all([
      fetchMuscleList(muscle, 'es'),
      fetchMuscleList(muscle, 'en'),
    ]);
    if (esList.length === 0) return res.status(404).json({ error: 'Grupo muscular no encontrado' });

    const enById = {};
    enList.forEach(e => { enById[e.id] = e; });

    let combinedEs = esList;

    const crossRefs = CROSS_MUSCLE_INCLUDES[muscle];
    if (crossRefs) {
      for (const ref of crossRefs) {
        const [crossEs, crossEn] = await Promise.all([
          fetchMuscleList(ref.fromMuscle, 'es'),
          fetchMuscleList(ref.fromMuscle, 'en'),
        ]);
        crossEn.forEach(e => { enById[e.id] = e; });
        const matched = crossEs.filter(ex => (ex.slug || '').includes(ref.matchInSlug));
        combinedEs = combinedEs.concat(matched);
      }
    }

    const results = combinedEs.map(ex => ({
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
