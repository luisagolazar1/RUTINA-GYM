// Proxy de búsqueda contra ExerciseGymGifsDB (API estática bilingüe ES/EN,
// servida gratis vía jsDelivr desde GitHub, sin necesidad de API key).
// Busca por nombre del ejercicio (español o inglés) O por grupo muscular
// (español o inglés), y devuelve nombre + músculo + gif para autocompletar.
//
// GET /api/exercise-search?q=biceps -> { results: [{name, nameEn, muscle, bodyPart, gifUrl}, ...] }

const BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0';
const MAX_RESULTS = 12;

// Sinónimos en español -> slugs de músculo usados por la API (en inglés)
const MUSCLE_ES_SYNONYMS = {
  pecho: ['pectorals'],
  espalda: ['lats', 'upper-back', 'traps', 'spine'],
  dorsal: ['lats'], dorsales: ['lats'],
  hombro: ['delts'], hombros: ['delts'],
  pierna: ['quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves'],
  piernas: ['quads', 'hamstrings', 'glutes', 'adductors', 'abductors', 'calves'],
  cuadriceps: ['quads'], cuadricep: ['quads'],
  isquiotibiales: ['hamstrings'], femoral: ['hamstrings'], femorales: ['hamstrings'],
  gluteo: ['glutes'], gluteos: ['glutes'],
  pantorrilla: ['calves'], pantorrillas: ['calves'], gemelos: ['calves'],
  abdomen: ['abs'], abdominales: ['abs'],
  antebrazo: ['forearms'], antebrazos: ['forearms'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  trapecio: ['traps'], trapecios: ['traps'],
  aductores: ['adductors'], abductores: ['abductors'],
  serrato: ['serratus-anterior'],
};

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default async function handler(req, res) {
  const raw = (req.query.q || '').trim();
  if (!raw) return res.status(400).json({ error: 'Falta parámetro q' });
  const q = normalize(raw);

  try {
    const [esRes, enRes] = await Promise.all([
      fetch(`${BASE}/api/es/exercises.json`),
      fetch(`${BASE}/api/en/exercises.json`),
    ]);
    if (!esRes.ok) return res.status(502).json({ error: 'No se pudo consultar la base de ejercicios' });

    const esData = await esRes.json();
    const enData = enRes.ok ? await enRes.json() : null;

    const esList = Array.isArray(esData) ? esData : (esData.exercises || []);
    const enList = enData ? (Array.isArray(enData) ? enData : (enData.exercises || [])) : [];
    const enById = {};
    enList.forEach(e => { enById[e.id] = e; });

    const synonymSlugs = MUSCLE_ES_SYNONYMS[q] || [];
    const results = [];

    for (const ex of esList) {
      const nameEs = normalize(ex.name);
      const enEx = enById[ex.id];
      const nameEn = normalize(enEx && enEx.name);
      const muscleText = normalize((ex.muscle || '').replace(/-/g, ' '));
      const bodyPartText = normalize((ex.bodyPart || '').replace(/-/g, ' '));
      const equipmentText = normalize((ex.equipment || '').replace(/-/g, ' '));

      const hit =
        nameEs.includes(q) ||
        nameEn.includes(q) ||
        muscleText.includes(q) ||
        bodyPartText.includes(q) ||
        equipmentText.includes(q) ||
        synonymSlugs.includes(ex.muscle);

      if (hit) {
        results.push({
          name: ex.name,
          nameEn: (enEx && enEx.name) || ex.name,
          muscle: ex.muscle,
          bodyPart: ex.bodyPart,
          gifUrl: ex.gifUrl,
        });
        if (results.length >= MAX_RESULTS) break;
      }
    }

    return res.status(200).json({ results, source: 'ExerciseGymGifsDB (jsDelivr)' });
  } catch (e) {
    return res.status(500).json({ error: 'Error buscando ejercicios' });
  }
}
