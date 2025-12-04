const MATCH_FIELDS = ["pitch", "englishName", "note", "id"];

const sanitizeValue = (value) =>
  value !== undefined && value !== null && value !== "" ? value : undefined;

const getFieldValue = (note, targetField, fallbacks) => {
  if (!note) return undefined;
  const targetValue = sanitizeValue(note[targetField]);
  if (targetValue !== undefined) return targetValue;

  for (const field of fallbacks) {
    const fallbackValue = sanitizeValue(note[field]);
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
  }

  return undefined;
};

const buildFieldOrder = (targetField) => {
  const order = [];
  if (targetField && !order.includes(targetField)) {
    order.push(targetField);
  }
  MATCH_FIELDS.forEach((field) => {
    if (!order.includes(field)) {
      order.push(field);
    }
  });
  return order;
};

const buildLookupMaps = (notes, fields) => {
  return fields.reduce((acc, field) => {
    acc[field] = new Map();
    notes.forEach((note) => {
      const value = sanitizeValue(note?.[field]);
      if (value !== undefined && !acc[field].has(value)) {
        acc[field].set(value, note);
      }
    });
    return acc;
  }, {});
};

const dedupeValues = (values) => {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    if (value !== undefined && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  });
  return result;
};

export function normalizeSelectedNotes({
  selectedNotes,
  clef = "Treble",
  trebleNotes = [],
  bassNotes = [],
  targetField = "pitch",
} = {}) {
  const notePool = clef === "Bass" ? bassNotes : trebleNotes;

  if (!Array.isArray(notePool) || notePool.length === 0) {
    return Array.isArray(selectedNotes)
      ? selectedNotes.filter(
          (value) => value !== undefined && value !== null && value !== ""
        )
      : [];
  }

  const fallbackFields = MATCH_FIELDS.filter((field) => field !== targetField);
  const defaultSelection = dedupeValues(
    notePool.map((note) => getFieldValue(note, targetField, fallbackFields))
  );

  if (!Array.isArray(selectedNotes) || selectedNotes.length === 0) {
    return defaultSelection;
  }

  const fieldsInPriority = buildFieldOrder(targetField);
  const lookupMaps = buildLookupMaps(notePool, fieldsInPriority);

  const normalized = [];
  const seen = new Set();

  selectedNotes.forEach((rawValue) => {
    if (rawValue === undefined || rawValue === null) return;

    const lookupValue =
      typeof rawValue === "object"
        ? sanitizeValue(
            rawValue[targetField] ||
              rawValue.pitch ||
              rawValue.englishName ||
              rawValue.note
          )
        : sanitizeValue(rawValue);

    if (lookupValue === undefined) return;

    let matchedNote = null;

    for (const field of fieldsInPriority) {
      const noteMatch = lookupMaps[field]?.get(lookupValue);
      if (noteMatch) {
        matchedNote = noteMatch;
        break;
      }
    }

    if (!matchedNote) return;

    const targetValue = getFieldValue(matchedNote, targetField, fallbackFields);

    if (!targetValue || seen.has(targetValue)) return;

    seen.add(targetValue);
    normalized.push(targetValue);
  });

  return normalized.length > 0 ? normalized : defaultSelection;
}
