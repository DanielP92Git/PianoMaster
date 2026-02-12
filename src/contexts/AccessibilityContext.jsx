import React, { createContext, useContext, useReducer, useEffect } from "react";

// Initial accessibility state
const initialState = {
  // Visual accessibility
  highContrast: false,
  reducedMotion: false,
  fontSize: "normal", // 'small', 'normal', 'large', 'xl'

  // Navigation accessibility
  keyboardNavigation: true,
  focusVisible: true,

  // Audio accessibility
  soundEnabled: true,
  soundVolume: 0.8,

  // Motor accessibility
  largeTargets: false,
  stickyHover: false,

  // Cognitive accessibility
  simplifiedUI: false,
  extendedTimeouts: false,

  // Screen reader
  screenReaderOptimized: false,
  announcements: true,
};

// Action types
const ACCESSIBILITY_ACTIONS = {
  TOGGLE_HIGH_CONTRAST: "TOGGLE_HIGH_CONTRAST",
  TOGGLE_REDUCED_MOTION: "TOGGLE_REDUCED_MOTION",
  SET_FONT_SIZE: "SET_FONT_SIZE",
  TOGGLE_KEYBOARD_NAVIGATION: "TOGGLE_KEYBOARD_NAVIGATION",
  TOGGLE_FOCUS_VISIBLE: "TOGGLE_FOCUS_VISIBLE",
  TOGGLE_SOUND: "TOGGLE_SOUND",
  SET_SOUND_VOLUME: "SET_SOUND_VOLUME",
  TOGGLE_LARGE_TARGETS: "TOGGLE_LARGE_TARGETS",
  TOGGLE_STICKY_HOVER: "TOGGLE_STICKY_HOVER",
  TOGGLE_SIMPLIFIED_UI: "TOGGLE_SIMPLIFIED_UI",
  TOGGLE_EXTENDED_TIMEOUTS: "TOGGLE_EXTENDED_TIMEOUTS",
  TOGGLE_SCREEN_READER_OPTIMIZED: "TOGGLE_SCREEN_READER_OPTIMIZED",
  TOGGLE_ANNOUNCEMENTS: "TOGGLE_ANNOUNCEMENTS",
  RESET_SETTINGS: "RESET_SETTINGS",
  LOAD_SETTINGS: "LOAD_SETTINGS",
};

// Reducer
const accessibilityReducer = (state, action) => {
  switch (action.type) {
    case ACCESSIBILITY_ACTIONS.TOGGLE_HIGH_CONTRAST:
      return { ...state, highContrast: !state.highContrast };

    case ACCESSIBILITY_ACTIONS.TOGGLE_REDUCED_MOTION:
      return { ...state, reducedMotion: !state.reducedMotion };

    case ACCESSIBILITY_ACTIONS.SET_FONT_SIZE:
      return { ...state, fontSize: action.payload };

    case ACCESSIBILITY_ACTIONS.TOGGLE_KEYBOARD_NAVIGATION:
      return { ...state, keyboardNavigation: !state.keyboardNavigation };

    case ACCESSIBILITY_ACTIONS.TOGGLE_FOCUS_VISIBLE:
      return { ...state, focusVisible: !state.focusVisible };

    case ACCESSIBILITY_ACTIONS.TOGGLE_SOUND:
      return { ...state, soundEnabled: !state.soundEnabled };

    case ACCESSIBILITY_ACTIONS.SET_SOUND_VOLUME:
      return { ...state, soundVolume: action.payload };

    case ACCESSIBILITY_ACTIONS.TOGGLE_LARGE_TARGETS:
      return { ...state, largeTargets: !state.largeTargets };

    case ACCESSIBILITY_ACTIONS.TOGGLE_STICKY_HOVER:
      return { ...state, stickyHover: !state.stickyHover };

    case ACCESSIBILITY_ACTIONS.TOGGLE_SIMPLIFIED_UI:
      return { ...state, simplifiedUI: !state.simplifiedUI };

    case ACCESSIBILITY_ACTIONS.TOGGLE_EXTENDED_TIMEOUTS:
      return { ...state, extendedTimeouts: !state.extendedTimeouts };

    case ACCESSIBILITY_ACTIONS.TOGGLE_SCREEN_READER_OPTIMIZED:
      return { ...state, screenReaderOptimized: !state.screenReaderOptimized };

    case ACCESSIBILITY_ACTIONS.TOGGLE_ANNOUNCEMENTS:
      return { ...state, announcements: !state.announcements };

    case ACCESSIBILITY_ACTIONS.RESET_SETTINGS:
      return { ...initialState };

    case ACCESSIBILITY_ACTIONS.LOAD_SETTINGS:
      return { ...state, ...action.payload };

    default:
      return state;
  }
};

// Create context
const AccessibilityContext = createContext();

// Provider component
export const AccessibilityProvider = ({ children }) => {
  const [state, dispatch] = useReducer(accessibilityReducer, initialState);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("accessibility-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        dispatch({
          type: ACCESSIBILITY_ACTIONS.LOAD_SETTINGS,
          payload: parsed,
        });
      } catch (error) {
        console.warn("Failed to load accessibility settings:", error);
      }
    }

    // Check for system preferences
    if (window.matchMedia) {
      // High contrast preference
      const highContrastQuery = window.matchMedia("(prefers-contrast: high)");
      if (highContrastQuery.matches && !savedSettings) {
        dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_HIGH_CONTRAST });
      }

      // Reduced motion preference
      const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );
      if (reducedMotionQuery.matches && !savedSettings) {
        dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_REDUCED_MOTION });
      }

      // Listen for changes
      const handleHighContrastChange = (e) => {
        if (e.matches) {
          dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_HIGH_CONTRAST });
        }
      };

      const handleReducedMotionChange = (e) => {
        if (e.matches) {
          dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_REDUCED_MOTION });
        }
      };

      highContrastQuery.addEventListener("change", handleHighContrastChange);
      reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

      return () => {
        highContrastQuery.removeEventListener(
          "change",
          handleHighContrastChange
        );
        reducedMotionQuery.removeEventListener(
          "change",
          handleReducedMotionChange
        );
      };
    }
  }, []);

  // Save settings to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("accessibility-settings", JSON.stringify(state));
  }, [state]);

  // Apply CSS classes to document based on settings
  useEffect(() => {
    const { documentElement } = document;

    // High contrast
    if (state.highContrast) {
      documentElement.classList.add("high-contrast");
    } else {
      documentElement.classList.remove("high-contrast");
    }

    // Reduced motion
    if (state.reducedMotion) {
      documentElement.classList.add("reduced-motion");
    } else {
      documentElement.classList.remove("reduced-motion");
    }

    // Font size
    documentElement.classList.remove(
      "font-small",
      "font-normal",
      "font-large",
      "font-xl"
    );
    documentElement.classList.add(`font-${state.fontSize}`);

    // Large targets
    if (state.largeTargets) {
      documentElement.classList.add("large-targets");
    } else {
      documentElement.classList.remove("large-targets");
    }

    // Focus visible
    if (state.focusVisible) {
      documentElement.classList.add("focus-visible");
    } else {
      documentElement.classList.remove("focus-visible");
    }

    // Simplified UI
    if (state.simplifiedUI) {
      documentElement.classList.add("simplified-ui");
    } else {
      documentElement.classList.remove("simplified-ui");
    }

    // Sticky hover
    if (state.stickyHover) {
      documentElement.classList.add("sticky-hover");
    } else {
      documentElement.classList.remove("sticky-hover");
    }

    // Screen reader optimized
    if (state.screenReaderOptimized) {
      documentElement.classList.add("screen-reader-optimized");
    } else {
      documentElement.classList.remove("screen-reader-optimized");
    }
  }, [state]);

  // Sticky hover interaction handler
  useEffect(() => {
    if (!state.stickyHover) return undefined;

    const interactiveSelector =
      'button, [role="button"], [role="tab"], [role="menuitem"], [role="link"], a[href], input, select, textarea';
    const trackedElements = new Map();
    const persistDuration = 800;

    const clearStickyState = (element) => {
      if (!element) return;
      const timeoutId = trackedElements.get(element);
      if (timeoutId) {
        clearTimeout(timeoutId);
        trackedElements.delete(element);
      }
      element.classList.remove("sticky-hover-active");
    };

    const handleMouseLeave = (event) => {
      const target = event.target.closest(interactiveSelector);
      if (!target) return;
      target.classList.add("sticky-hover-active");
      clearStickyState(target);
      const timeoutId = window.setTimeout(() => {
        target.classList.remove("sticky-hover-active");
        trackedElements.delete(target);
      }, persistDuration);
      trackedElements.set(target, timeoutId);
    };

    const handleMouseEnter = (event) => {
      const target = event.target.closest(interactiveSelector);
      if (!target) return;
      clearStickyState(target);
    };

    document.addEventListener("mouseleave", handleMouseLeave, true);
    document.addEventListener("mouseenter", handleMouseEnter, true);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave, true);
      document.removeEventListener("mouseenter", handleMouseEnter, true);
      trackedElements.forEach((timeoutId, element) => {
        clearTimeout(timeoutId);
        element.classList.remove("sticky-hover-active");
      });
      trackedElements.clear();
    };
  }, [state.stickyHover]);

  // Action creators
  const actions = {
    toggleHighContrast: () =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_HIGH_CONTRAST }),
    toggleReducedMotion: () =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_REDUCED_MOTION }),
    setFontSize: (size) =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.SET_FONT_SIZE, payload: size }),
    toggleKeyboardNavigation: () =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_KEYBOARD_NAVIGATION }),
    toggleFocusVisible: () =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_FOCUS_VISIBLE }),
    toggleSound: () => dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_SOUND }),
    setSoundVolume: (volume) =>
      dispatch({
        type: ACCESSIBILITY_ACTIONS.SET_SOUND_VOLUME,
        payload: volume,
      }),
    toggleLargeTargets: () =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_LARGE_TARGETS }),
    toggleStickyHover: () =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_STICKY_HOVER }),
    toggleSimplifiedUI: () =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_SIMPLIFIED_UI }),
    toggleExtendedTimeouts: () =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_EXTENDED_TIMEOUTS }),
    toggleScreenReaderOptimized: () =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_SCREEN_READER_OPTIMIZED }),
    toggleAnnouncements: () =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.TOGGLE_ANNOUNCEMENTS }),
    resetSettings: () =>
      dispatch({ type: ACCESSIBILITY_ACTIONS.RESET_SETTINGS }),
  };

  const value = {
    ...state,
    actions,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook to use accessibility context
export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    );
  }
  return context;
};

// HOC for components that need accessibility props
export const withAccessibility = (Component) => {
  return React.forwardRef((props, ref) => {
    const accessibility = useAccessibility();
    return (
      <Component
        ref={ref}
        {...props}
        highContrast={accessibility.highContrast}
        reducedMotion={accessibility.reducedMotion}
        largeTargets={accessibility.largeTargets}
        simplifiedUI={accessibility.simplifiedUI}
        accessibility={accessibility}
      />
    );
  });
};

export default AccessibilityContext;
