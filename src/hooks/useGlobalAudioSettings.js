import { useEffect, useCallback } from "react";
import { useSettings } from "../contexts/SettingsContext";
import { useAccessibility } from "../contexts/AccessibilityContext";

/**
 * Hook for managing global audio settings
 * Integrates with SettingsContext and AccessibilityContext
 * Provides unified API for audio preferences
 */
export const useGlobalAudioSettings = () => {
  const { preferences, updatePreference } = useSettings();
  const accessibility = useAccessibility();

  // Get effective sound enabled state (respects both settings and accessibility)
  const isSoundEnabled =
    preferences.sound_enabled && accessibility.soundEnabled;

  // Get effective volume (combines master volume with accessibility volume)
  const effectiveVolume = preferences.master_volume * accessibility.soundVolume;

  /**
   * Toggle sound on/off
   */
  const toggleSound = useCallback(() => {
    updatePreference("sound_enabled", !preferences.sound_enabled);
  }, [preferences.sound_enabled, updatePreference]);

  /**
   * Set master volume (0-1)
   */
  const setMasterVolume = useCallback(
    (volume) => {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      updatePreference("master_volume", clampedVolume);
    },
    [updatePreference]
  );

  /**
   * Get volume for a specific audio type
   * Can be extended to support per-type volumes in the future
   */
  const getVolumeForType = useCallback(
    (type = "default") => {
      if (!isSoundEnabled) return 0;

      // For now, all types use the same volume
      // Can be extended to support different volumes per type
      return effectiveVolume;
    },
    [isSoundEnabled, effectiveVolume]
  );

  /**
   * Check if sound should play
   */
  const shouldPlaySound = useCallback(() => {
    return isSoundEnabled;
  }, [isSoundEnabled]);

  /**
   * Sync accessibility audio settings when preferences change
   */
  useEffect(() => {
    if (accessibility.actions) {
      // Sync sound enabled state
      if (preferences.sound_enabled !== accessibility.soundEnabled) {
        if (preferences.sound_enabled) {
          if (!accessibility.soundEnabled) {
            accessibility.actions.toggleSound();
          }
        } else {
          if (accessibility.soundEnabled) {
            accessibility.actions.toggleSound();
          }
        }
      }
    }
  }, [
    preferences.sound_enabled,
    accessibility.soundEnabled,
    accessibility.actions,
  ]);

  return {
    // State
    isSoundEnabled,
    masterVolume: preferences.master_volume,
    effectiveVolume,
    accessibilityVolume: accessibility.soundVolume,

    // Actions
    toggleSound,
    setMasterVolume,
    getVolumeForType,
    shouldPlaySound,

    // Accessibility actions (for convenience)
    setAccessibilityVolume: accessibility.actions?.setSoundVolume,
  };
};

export default useGlobalAudioSettings;
