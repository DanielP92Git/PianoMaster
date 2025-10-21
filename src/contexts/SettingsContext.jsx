import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useUser } from "../features/authentication/useUser";
import {
  getUserPreferences,
  updateUserPreferences,
} from "../services/apiSettings";
import { toast } from "react-hot-toast";

// Default preferences
const DEFAULT_PREFERENCES = {
  // Notification preferences
  notifications_enabled: true,
  web_push_enabled: false,
  push_subscription: null,
  notification_types: {
    achievement: true,
    assignment: true,
    message: true,
    reminder: true,
    system: true,
  },
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",

  // Audio preferences
  sound_enabled: true,
  master_volume: 0.8,

  // Daily reminder preferences
  daily_reminder_enabled: false,
  daily_reminder_time: "16:00",
};

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const { user } = useUser();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Refs for debouncing
  const saveTimeoutRef = useRef(null);
  const pendingChangesRef = useRef(null);

  /**
   * Load preferences from database
   */
  const loadPreferences = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await getUserPreferences(user.id);

      if (data) {
        // Merge with defaults to ensure all fields exist
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...data,
          notification_types: {
            ...DEFAULT_PREFERENCES.notification_types,
            ...(data.notification_types || {}),
          },
        });
      } else {
        // No preferences yet, use defaults
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (err) {
      console.error("Error loading preferences:", err);
      setError(err.message);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  /**
   * Save preferences to database with debouncing
   */
  const savePreferences = useCallback(
    async (newPreferences) => {
      if (!user?.id) return;

      // Store pending changes
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        ...newPreferences,
      };

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Debounce save for 500ms
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true);
          setError(null);

          const dataToSave = pendingChangesRef.current;
          pendingChangesRef.current = null;

          await updateUserPreferences(user.id, dataToSave);
        } catch (err) {
          console.error("Error saving preferences:", err);
          setError(err.message);
          toast.error("Failed to save settings");

          // Reload preferences on save failure
          await loadPreferences();
        } finally {
          setIsSaving(false);
        }
      }, 500);
    },
    [user?.id, loadPreferences]
  );

  /**
   * Update preferences (optimistic update + debounced save)
   */
  const updatePreference = useCallback(
    (key, value) => {
      setPreferences((prev) => {
        const newPreferences = { ...prev, [key]: value };
        savePreferences({ [key]: value });
        return newPreferences;
      });
    },
    [savePreferences]
  );

  /**
   * Update multiple preferences at once
   */
  const updatePreferences = useCallback(
    (updates) => {
      setPreferences((prev) => {
        const newPreferences = { ...prev, ...updates };
        savePreferences(updates);
        return newPreferences;
      });
    },
    [savePreferences]
  );

  /**
   * Update notification type preference
   */
  const updateNotificationType = useCallback(
    (type, enabled) => {
      setPreferences((prev) => {
        const newTypes = {
          ...prev.notification_types,
          [type]: enabled,
        };
        const newPreferences = {
          ...prev,
          notification_types: newTypes,
        };
        savePreferences({ notification_types: newTypes });
        return newPreferences;
      });
    },
    [savePreferences]
  );

  /**
   * Reset preferences to defaults
   */
  const resetPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      await updateUserPreferences(user.id, DEFAULT_PREFERENCES);
      setPreferences(DEFAULT_PREFERENCES);
      toast.success("Settings reset to defaults");
    } catch (err) {
      console.error("Error resetting preferences:", err);
      toast.error("Failed to reset settings");
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  // Load preferences on mount and when user changes
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    preferences,
    isLoading,
    isSaving,
    error,
    updatePreference,
    updatePreferences,
    updateNotificationType,
    resetPreferences,
    loadPreferences,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to use settings context
 */
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

export default SettingsContext;
