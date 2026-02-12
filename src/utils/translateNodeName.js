/**
 * Utility function to translate note names in trail node titles
 *
 * Converts English note names (C, D, E, F, G, A, B) to their localized equivalents
 * Example: "C & D" -> "דו, רה" (in Hebrew)
 *
 * @param {string} nodeName - The original node name (e.g., "C, D, E")
 * @param {Function} t - The i18next translation function
 * @param {Object} i18n - Optional i18next instance (for accessing language/dir)
 * @returns {string} The translated node name
 */
export function translateNodeName(nodeName, t, i18n = null) {
  if (!nodeName || !t) return nodeName || "";

  const i18nInstance = i18n || t.i18n;

  // First, try to get a full node translation from nodes.{nodeName}
  const translationKey = `nodes.${nodeName}`;
  const fullTranslation = t(translationKey, { ns: 'trail', defaultValue: '' });

  // Check if translation was found:
  // - Not empty (defaultValue wasn't returned)
  // - Not the key itself (i18next returns key when missing)
  // - Not starting with 'nodes.' (another sign of failed lookup)
  if (fullTranslation &&
      fullTranslation !== nodeName &&
      fullTranslation !== translationKey &&
      !fullTranslation.startsWith('nodes.')) {
    return fullTranslation;
  }

  // If no full translation exists, fall back to note-by-note translation
  // Map of note letters to translation keys with fallback to original
  const noteLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  let translatedName = nodeName;
  noteLetters.forEach(note => {
    // Match note letter as standalone or followed by non-letter (e.g., "C,", "C ", "C&")
    // Uses word boundary \b to match only complete note letters
    const regex = new RegExp(`\\b${note}\\b`, 'g');
    // Try with namespace prefix, fallback to without prefix
    const translatedNote = t(`noteNames.${note}`, { ns: 'trail', defaultValue: note });
    translatedName = translatedName.replace(regex, translatedNote);
  });

  // Also translate common words that appear in node names
  // Replace "Units" (plural) with the translated version
  const unitsTranslation = t('units.unitsPlural', { ns: 'trail', defaultValue: 'Units' });

  if (unitsTranslation !== 'Units') {
    translatedName = translatedName.replace(/\bUnits\b/g, unitsTranslation);
  }

  // For Hebrew (and other RTL languages), replace ampersands with commas
  // This ensures consistent separator usage: "דו & רה" becomes "דו, רה"
  if (i18nInstance && i18nInstance.dir() === 'rtl') {
    translatedName = translatedName.replace(/\s*&\s*/g, ', ');
  }

  return translatedName;
}

/**
 * Utility function to translate unit names
 *
 * @param {string} unitName - The original unit name
 * @param {Function} t - The i18next translation function
 * @returns {string} The translated unit name
 */
export function translateUnitName(unitName, t) {
  if (!unitName || !t) return unitName || "";

  // Try to find translation in units.names, fallback to original
  const translatedName = t(`units.names.${unitName}`, { ns: 'trail', defaultValue: unitName });
  return translatedName;
}
