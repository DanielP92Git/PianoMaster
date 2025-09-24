import { useEffect, useRef, useCallback } from "react";
import { useAccessibility } from "../contexts/AccessibilityContext";

// Custom hook for keyboard navigation
export const useKeyboardNavigation = (options = {}) => {
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  const { keyboardNavigation } = useAccessibility();

  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled || !keyboardNavigation) return;

      const { key, shiftKey, ctrlKey, altKey, metaKey } = event;

      // Prevent default behavior if specified
      if (preventDefault) {
        const shouldPreventDefault =
          (key === "Enter" && onEnter) ||
          (key === " " && onSpace) ||
          (key === "Escape" && onEscape) ||
          (key === "ArrowUp" && onArrowUp) ||
          (key === "ArrowDown" && onArrowDown) ||
          (key === "ArrowLeft" && onArrowLeft) ||
          (key === "ArrowRight" && onArrowRight) ||
          (key === "Tab" && (onTab || onShiftTab));

        if (shouldPreventDefault) {
          event.preventDefault();
        }
      }

      if (stopPropagation) {
        event.stopPropagation();
      }

      // Handle key events
      switch (key) {
        case "Enter":
          onEnter?.(event);
          break;
        case " ":
          onSpace?.(event);
          break;
        case "Escape":
          onEscape?.(event);
          break;
        case "ArrowUp":
          onArrowUp?.(event);
          break;
        case "ArrowDown":
          onArrowDown?.(event);
          break;
        case "ArrowLeft":
          onArrowLeft?.(event);
          break;
        case "ArrowRight":
          onArrowRight?.(event);
          break;
        case "Tab":
          if (shiftKey) {
            onShiftTab?.(event);
          } else {
            onTab?.(event);
          }
          break;
      }
    },
    [
      enabled,
      keyboardNavigation,
      preventDefault,
      stopPropagation,
      onEnter,
      onSpace,
      onEscape,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      onShiftTab,
    ]
  );

  return { handleKeyDown };
};

// Focus management utilities
export const useFocusManagement = () => {
  const { focusVisible } = useAccessibility();
  const focusableElements = useRef([]);
  const currentFocusIndex = useRef(-1);

  // Get all focusable elements within a container
  const getFocusableElements = useCallback((container) => {
    const selector = [
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="tab"]:not([disabled])',
      '[role="menuitem"]:not([disabled])',
    ].join(", ");

    return Array.from(container.querySelectorAll(selector)).filter(
      (element) => {
        // Check if element is visible
        const style = window.getComputedStyle(element);
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0"
        );
      }
    );
  }, []);

  // Focus the first focusable element
  const focusFirst = useCallback(
    (container) => {
      const elements = getFocusableElements(container);
      if (elements.length > 0) {
        elements[0].focus();
        currentFocusIndex.current = 0;
        focusableElements.current = elements;
        return true;
      }
      return false;
    },
    [getFocusableElements]
  );

  // Focus the last focusable element
  const focusLast = useCallback(
    (container) => {
      const elements = getFocusableElements(container);
      if (elements.length > 0) {
        const lastIndex = elements.length - 1;
        elements[lastIndex].focus();
        currentFocusIndex.current = lastIndex;
        focusableElements.current = elements;
        return true;
      }
      return false;
    },
    [getFocusableElements]
  );

  // Focus the next focusable element
  const focusNext = useCallback(
    (container, wrap = true) => {
      const elements = getFocusableElements(container);
      if (elements.length === 0) return false;

      focusableElements.current = elements;
      const nextIndex = currentFocusIndex.current + 1;

      if (nextIndex < elements.length) {
        elements[nextIndex].focus();
        currentFocusIndex.current = nextIndex;
        return true;
      } else if (wrap) {
        elements[0].focus();
        currentFocusIndex.current = 0;
        return true;
      }
      return false;
    },
    [getFocusableElements]
  );

  // Focus the previous focusable element
  const focusPrevious = useCallback(
    (container, wrap = true) => {
      const elements = getFocusableElements(container);
      if (elements.length === 0) return false;

      focusableElements.current = elements;
      const prevIndex = currentFocusIndex.current - 1;

      if (prevIndex >= 0) {
        elements[prevIndex].focus();
        currentFocusIndex.current = prevIndex;
        return true;
      } else if (wrap) {
        const lastIndex = elements.length - 1;
        elements[lastIndex].focus();
        currentFocusIndex.current = lastIndex;
        return true;
      }
      return false;
    },
    [getFocusableElements]
  );

  // Trap focus within a container
  const trapFocus = useCallback(
    (container) => {
      const handleKeyDown = (event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          if (event.shiftKey) {
            focusPrevious(container);
          } else {
            focusNext(container);
          }
        }
      };

      container.addEventListener("keydown", handleKeyDown);
      focusFirst(container);

      return () => {
        container.removeEventListener("keydown", handleKeyDown);
      };
    },
    [focusFirst, focusNext, focusPrevious]
  );

  return {
    getFocusableElements,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    trapFocus,
  };
};

// Roving tabindex for composite widgets
export const useRovingTabindex = (containerRef, options = {}) => {
  const { orientation = "horizontal", wrap = true } = options;
  const { handleKeyDown } = useKeyboardNavigation({
    onArrowUp: orientation === "vertical" ? handlePrevious : undefined,
    onArrowDown: orientation === "vertical" ? handleNext : undefined,
    onArrowLeft: orientation === "horizontal" ? handlePrevious : undefined,
    onArrowRight: orientation === "horizontal" ? handleNext : undefined,
    onHome: handleFirst,
    onEnd: handleLast,
  });

  const { focusNext, focusPrevious, focusFirst, focusLast } =
    useFocusManagement();

  function handleNext(event) {
    if (containerRef.current) {
      focusNext(containerRef.current, wrap);
    }
  }

  function handlePrevious(event) {
    if (containerRef.current) {
      focusPrevious(containerRef.current, wrap);
    }
  }

  function handleFirst(event) {
    if (containerRef.current) {
      focusFirst(containerRef.current);
    }
  }

  function handleLast(event) {
    if (containerRef.current) {
      focusLast(containerRef.current);
    }
  }

  // Set initial tabindex values
  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll(
      '[role="tab"], [role="menuitem"], [role="option"]'
    );
    elements.forEach((element, index) => {
      element.setAttribute("tabindex", index === 0 ? "0" : "-1");
    });
  }, []);

  return { handleKeyDown };
};

// Skip link functionality
export const useSkipLink = () => {
  const skipToContent = useCallback((targetId) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return { skipToContent };
};
