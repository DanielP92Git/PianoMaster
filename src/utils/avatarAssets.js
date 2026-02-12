import BeethovenPng from "../assets/avatars/beethoven.png";

/**
 * Map normalized avatar keys to bundled asset imports.
 * Add new composer assets here as they are added to src/assets/avatars.
 */
export const AVATAR_ASSETS = {
  beethoven: BeethovenPng,
};

/**
 * Alias map lets multiple names point to the same bundled asset.
 */
const AVATAR_ALIASES = {
  "ludwig van beethoven": "beethoven",
  "ludwig-van-beethoven": "beethoven",
  ludwig_beethoven: "beethoven",
};

const IMAGE_FIELD_CANDIDATES = ["image_url", "imageUrl", "url"];

/**
 * Normalize incoming avatar identifiers (object or string)
 */
export function normalizeAvatarKey(input) {
  if (!input) return null;

  if (typeof input === "string") {
    const slug = input.trim().toLowerCase();
    return AVATAR_ALIASES[slug] || slug || null;
  }

  if (typeof input === "object") {
    const name =
      input.name ||
      input.slug ||
      input.composer ||
      input.label ||
      input.title ||
      null;
    if (name) {
      const slug = name.trim().toLowerCase();
      return AVATAR_ALIASES[slug] || slug || null;
    }
  }

  return null;
}

/**
 * Given an avatar record (or URL/string) return the best image source to use.
 * Falls back to Supabase URL or null when no bundled asset exists.
 */
export function getAvatarImageSource(avatarOrUrl, fallbackUrl = null) {
  const normalizedKey = normalizeAvatarKey(avatarOrUrl);

  if (normalizedKey && AVATAR_ASSETS[normalizedKey]) {
    return AVATAR_ASSETS[normalizedKey];
  }

  if (typeof avatarOrUrl === "object" && avatarOrUrl !== null) {
    for (const candidate of IMAGE_FIELD_CANDIDATES) {
      if (avatarOrUrl[candidate]) {
        return avatarOrUrl[candidate];
      }
    }
  }

  if (typeof avatarOrUrl === "string" && avatarOrUrl.length > 0) {
    return avatarOrUrl;
  }

  return fallbackUrl;
}

/**
 * Helper for cases where avatar info is spread across profile fields.
 */
export function resolveProfileAvatarSource(profile) {
  if (!profile) return null;
  return getAvatarImageSource(
    profile.avatars || profile.avatar_url,
    profile.avatar_url
  );
}
