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
  enableSharps = false,
  enableFlats = false,
} = {}) {
  const clefKey = String(clef || "Treble").toLowerCase();
  const isBothClefs = clefKey === "both";
  const shouldIncludePitch = (pitch) => {
    if (!pitch) return false;
    const p = String(pitch);
    // Selection normalization should always operate on *natural notes only*.
    // Accidentals are controlled separately by gameplay toggles.
    return !p.includes("#") && !p.includes("b");
  };

  const parseClefQualifiedId = (raw) => {
    if (typeof raw !== "string") return { clef: null, value: raw };
    if (raw.startsWith("treble:")) return { clef: "treble", value: raw.slice(7) };
    if (raw.startsWith("bass:")) return { clef: "bass", value: raw.slice(5) };
    return { clef: null, value: raw };
  };

  const makeClefQualifiedId = (clefTag, pitch) => {
    if (!pitch) return undefined;
    return `${clefTag}:${pitch}`;
  };

  if (isBothClefs) {
    const treblePool = (Array.isArray(trebleNotes) ? trebleNotes : []).filter(
      (note) => shouldIncludePitch(note?.pitch || note?.note)
    );
    const bassPool = (Array.isArray(bassNotes) ? bassNotes : []).filter((note) =>
      shouldIncludePitch(note?.pitch || note?.note)
    );
    const combinedPool = [...treblePool, ...bassPool];

    if (combinedPool.length === 0) {
      return Array.isArray(selectedNotes)
        ? selectedNotes.filter(
            (value) => value !== undefined && value !== null && value !== ""
          )
        : [];
    }

    const fallbackFields = MATCH_FIELDS.filter((field) => field !== targetField);
    const fieldsInPriority = buildFieldOrder(targetField);
    const trebleLookup = buildLookupMaps(treblePool, fieldsInPriority);
    const bassLookup = buildLookupMaps(bassPool, fieldsInPriority);

    // Default selection for Both Clefs is all notes in each clef independently.
    const defaultTreble = treblePool
      .map((note) => getFieldValue(note, targetField, fallbackFields))
      .filter(Boolean)
      .map((pitch) => makeClefQualifiedId("treble", pitch));
    const defaultBass = bassPool
      .map((note) => getFieldValue(note, targetField, fallbackFields))
      .filter(Boolean)
      .map((pitch) => makeClefQualifiedId("bass", pitch));
    const defaultSelection = dedupeValues([...defaultTreble, ...defaultBass]);

    if (!Array.isArray(selectedNotes) || selectedNotes.length === 0) {
      return defaultSelection;
    }

    const normalized = [];
    const seen = new Set();

    const tryMatch = (lookupMaps, lookupValue) => {
      for (const field of fieldsInPriority) {
        const noteMatch = lookupMaps[field]?.get(lookupValue);
        if (noteMatch) return noteMatch;
      }
      return null;
    };

    selectedNotes.forEach((rawValue) => {
      if (rawValue === undefined || rawValue === null) return;

      const rawString =
        typeof rawValue === "object"
          ? sanitizeValue(
              rawValue[targetField] ||
                rawValue.pitch ||
                rawValue.englishName ||
                rawValue.note ||
                rawValue.id
            )
          : sanitizeValue(rawValue);

      if (rawString === undefined) return;

      const parsed = parseClefQualifiedId(rawString);
      const lookupValue = sanitizeValue(parsed.value);
      if (lookupValue === undefined) return;

      // Clef-qualified IDs resolve only within their respective clef pools.
      if (parsed.clef === "treble" || parsed.clef === "bass") {
        const lookupMaps = parsed.clef === "treble" ? trebleLookup : bassLookup;
        const matchedNote = tryMatch(lookupMaps, lookupValue);
        if (!matchedNote) return;

        const pitch = getFieldValue(matchedNote, targetField, fallbackFields);
        const id = makeClefQualifiedId(parsed.clef, pitch);
        if (!id || seen.has(id)) return;

        seen.add(id);
        normalized.push(id);
        return;
      }

      // Back-compat: pitch-only selections in Both mode apply to BOTH clefs when possible.
      const trebleMatch = tryMatch(trebleLookup, lookupValue);
      if (trebleMatch) {
        const pitch = getFieldValue(trebleMatch, targetField, fallbackFields);
        const id = makeClefQualifiedId("treble", pitch);
        if (id && !seen.has(id)) {
          seen.add(id);
          normalized.push(id);
        }
      }

      const bassMatch = tryMatch(bassLookup, lookupValue);
      if (bassMatch) {
        const pitch = getFieldValue(bassMatch, targetField, fallbackFields);
        const id = makeClefQualifiedId("bass", pitch);
        if (id && !seen.has(id)) {
          seen.add(id);
          normalized.push(id);
        }
      }
    });

    return normalized.length > 0 ? normalized : defaultSelection;
  }

  const notePool =
    clefKey === "bass"
      ? (Array.isArray(bassNotes) ? bassNotes : []).filter((note) =>
          shouldIncludePitch(note?.pitch || note?.note)
        )
      : clefKey === "both"
        ? [
            ...(Array.isArray(trebleNotes) ? trebleNotes : []).filter((note) =>
              shouldIncludePitch(note?.pitch || note?.note)
            ),
            ...(Array.isArray(bassNotes) ? bassNotes : []).filter((note) =>
              shouldIncludePitch(note?.pitch || note?.note)
            ),
          ]
        : (Array.isArray(trebleNotes) ? trebleNotes : []).filter((note) =>
            shouldIncludePitch(note?.pitch || note?.note)
          );

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
