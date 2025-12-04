import React from "react";
import { useTranslation } from "react-i18next";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import Button from "../ui/Button";
import Card, { CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Container, Stack } from "../ui/Layout";
import {
  Eye,
  Volume2,
  VolumeX,
  Keyboard,
  MousePointer,
  Settings,
  RotateCcw,
  Type,
  Zap,
  Moon,
  Sun,
} from "lucide-react";

const AccessibilitySettings = ({ className = "", ...props }) => {
  const { i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
  const accessibility = useAccessibility();
  const {
    // Visual accessibility
    highContrast,
    reducedMotion,
    fontSize,

    // Navigation accessibility
    keyboardNavigation,
    focusVisible,

    // Audio accessibility
    soundEnabled,
    soundVolume,

    // Motor accessibility
    largeTargets,
    stickyHover,

    // Cognitive accessibility
    simplifiedUI,
    extendedTimeouts,

    // Screen reader
    screenReaderOptimized,
    announcements,

    // Actions
    actions,
  } = accessibility;
  const inlineButtonMargin = isRTL ? "mr-4" : "ml-4";
  const headingDirectionClass = isRTL ? "flex-row-reverse text-right" : "";

  const fontSizeOptions = [
    { value: "small", label: "Small", icon: "🔤" },
    { value: "normal", label: "Normal", icon: "🔠" },
    { value: "large", label: "Large", icon: "🔡" },
    { value: "xl", label: "Extra Large", icon: "🅰️" },
  ];

  const AccessibilityToggle = ({
    checked,
    onChange,
    title,
    description,
    icon: Icon,
    disabled = false,
  }) => (
    <div
      className={`flex items-start gap-4 p-4 rounded-kids-lg border border-gray-200 dark:border-gray-700  ${
        isRTL ? "direction-rtl text-right" : ""
      }`}
    >
      <div className="flex-shrink-0 mt-1">
        <Icon className="w-5 h-5 text-kidsPrimary-600" />
      </div>
      <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
        <div
          className={`flex items-center justify-between ${
            isRTL ? "flex-row-reverse gap-4" : ""
          }`}
        >
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-rounded">
              {title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>
          <Button
            variant={checked ? "primary" : "outline"}
            size="small"
            onClick={onChange}
            disabled={disabled}
            highContrast={highContrast}
            className={inlineButtonMargin}
            aria-label={`${checked ? "Disable" : "Enable"} ${title}`}
          >
            {checked ? "On" : "Off"}
          </Button>
        </div>
      </div>
    </div>
  );

  const VolumeControl = () => (
    <div
      className={`flex items-start gap-4 p-4 rounded-kids-lg border border-gray-200 dark:border-gray-700 ${
        isRTL ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div className="flex-shrink-0 mt-1">
        {soundEnabled ? (
          <Volume2 className="w-5 h-5 text-kidsPrimary-600" />
        ) : (
          <VolumeX className="w-5 h-5 text-gray-400" />
        )}
      </div>
      <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
        <div
          className={`flex items-center justify-between mb-3 ${
            isRTL ? "flex-row-reverse gap-4" : ""
          }`}
        >
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-rounded">
              Sound Volume
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Adjust game sound effects and feedback
            </p>
          </div>
          <Button
            variant={soundEnabled ? "primary" : "outline"}
            size="small"
            onClick={actions.toggleSound}
            highContrast={highContrast}
            className={inlineButtonMargin}
            aria-label={`${soundEnabled ? "Mute" : "Unmute"} sounds`}
          >
            {soundEnabled ? "On" : "Off"}
          </Button>
        </div>

        {soundEnabled && (
          <div
            className={`flex items-center gap-3 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Quiet
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={soundVolume}
              onChange={(e) =>
                actions.setSoundVolume(parseFloat(e.target.value))
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              aria-label="Sound volume"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Loud
            </span>
            <span
              className={`text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] ${
                isRTL ? "text-left" : "text-right"
              }`}
            >
              {Math.round(soundVolume * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const FontSizeSelector = () => (
    <div
      className={`flex items-start gap-4 p-4 rounded-kids-lg border border-gray-200 dark:border-gray-700 ${
        isRTL ? "flex-row-reverse text-right" : ""
      }`}
    >
      <div className="flex-shrink-0 mt-1">
        <Type className="w-5 h-5 text-kidsPrimary-600" />
      </div>
      <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white font-rounded">
            Text Size
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Choose a comfortable text size for reading
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {fontSizeOptions.map((option) => (
            <Button
              key={option.value}
              variant={fontSize === option.value ? "primary" : "outline"}
              size="small"
              onClick={() => actions.setFontSize(option.value)}
              highContrast={highContrast}
              className="flex flex-col items-center justify-center p-3 h-auto"
              aria-label={`Set text size to ${option.label}`}
            >
              <span className="text-lg mb-1">{option.icon}</span>
              <span className="text-xs">{option.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Container size="2xl" className={className} {...props}>
      <Card variant="solid" highContrast={highContrast}>
        <CardHeader>
          <CardTitle
            className={`flex items-center gap-3 ${
              isRTL ? "flex-row-reverse text-right" : ""
            }`}
          >
            <Settings className="w-6 h-6 text-kidsPrimary-600" />
            <span>Accessibility Settings</span>
          </CardTitle>
          <p
            className={`text-sm text-gray-600 dark:text-gray-400 mt-2 ${
              isRTL ? "text-right" : ""
            }`}
          >
            Customize your experience to make the Piano Practice App more
            comfortable and accessible.
          </p>
        </CardHeader>

        <CardContent>
          <Stack spacing={6}>
            {/* Visual Settings */}
            <div>
              <h3
                className={`text-lg font-semibold text-gray-900 dark:text-white font-rounded mb-4 flex items-center gap-2 ${headingDirectionClass}`}
              >
                <Eye className="w-5 h-5 text-kidsPrimary-600" />
                Visual Settings
              </h3>
              <Stack spacing={3}>
                <AccessibilityToggle
                  checked={highContrast}
                  onChange={actions.toggleHighContrast}
                  title="High Contrast Mode"
                  description="Increases contrast between text and background for better visibility"
                  icon={highContrast ? Sun : Moon}
                />

                <AccessibilityToggle
                  checked={reducedMotion}
                  onChange={actions.toggleReducedMotion}
                  title="Reduce Motion"
                  description="Minimizes animations and motion effects that might cause discomfort"
                  icon={Zap}
                />

                <FontSizeSelector />
              </Stack>
            </div>

            {/* Navigation Settings */}
            <div>
              <h3
                className={`text-lg font-semibold text-gray-900 dark:text-white font-rounded mb-4 flex items-center gap-2 ${headingDirectionClass}`}
              >
                <Keyboard className="w-5 h-5 text-kidsPrimary-600" />
                Navigation Settings
              </h3>
              <Stack spacing={3}>
                <AccessibilityToggle
                  checked={keyboardNavigation}
                  onChange={actions.toggleKeyboardNavigation}
                  title="Keyboard Navigation"
                  description="Enable navigation using keyboard keys instead of mouse"
                  icon={Keyboard}
                />

                <AccessibilityToggle
                  checked={focusVisible}
                  onChange={actions.toggleFocusVisible}
                  title="Focus Indicators"
                  description="Show clear visual indicators when elements are focused"
                  icon={MousePointer}
                />
              </Stack>
            </div>

            {/* Audio Settings */}
            <div>
              <h3
                className={`text-lg font-semibold text-gray-900 dark:text-white font-rounded mb-4 flex items-center gap-2 ${headingDirectionClass}`}
              >
                <Volume2 className="w-5 h-5 text-kidsPrimary-600" />
                Audio Settings
              </h3>
              <Stack spacing={3}>
                <VolumeControl />

                <AccessibilityToggle
                  checked={announcements}
                  onChange={actions.toggleAnnouncements}
                  title="Screen Reader Announcements"
                  description="Enable audio announcements for game events and navigation"
                  icon={Volume2}
                />
              </Stack>
            </div>

            {/* Motor Settings */}
            <div>
              <h3
                className={`text-lg font-semibold text-gray-900 dark:text-white font-rounded mb-4 flex items-center gap-2 ${headingDirectionClass}`}
              >
                <MousePointer className="w-5 h-5 text-kidsPrimary-600" />
                Motor Settings
              </h3>
              <Stack spacing={3}>
                <AccessibilityToggle
                  checked={largeTargets}
                  onChange={actions.toggleLargeTargets}
                  title="Large Touch Targets"
                  description="Make buttons and interactive elements larger and easier to tap"
                  icon={MousePointer}
                />

                <AccessibilityToggle
                  checked={stickyHover}
                  onChange={actions.toggleStickyHover}
                  title="Sticky Hover"
                  description="Keep hover effects active longer for easier interaction"
                  icon={MousePointer}
                />
              </Stack>
            </div>

            {/* Cognitive Settings */}
            <div>
              <h3
                className={`text-lg font-semibold text-gray-900 dark:text-white font-rounded mb-4 flex items-center gap-2 ${headingDirectionClass}`}
              >
                <Settings className="w-5 h-5 text-kidsPrimary-600" />
                Cognitive Settings
              </h3>
              <Stack spacing={3}>
                <AccessibilityToggle
                  checked={simplifiedUI}
                  onChange={actions.toggleSimplifiedUI}
                  title="Simplified Interface"
                  description="Reduce visual complexity and show only essential elements"
                  icon={Settings}
                />

                <AccessibilityToggle
                  checked={extendedTimeouts}
                  onChange={actions.toggleExtendedTimeouts}
                  title="Extended Time Limits"
                  description="Give more time to complete tasks and respond to prompts"
                  icon={Settings}
                />

                <AccessibilityToggle
                  checked={screenReaderOptimized}
                  onChange={actions.toggleScreenReaderOptimized}
                  title="Screen Reader Optimization"
                  description="Optimize interface for screen reader users with additional descriptions"
                  icon={Volume2}
                />
              </Stack>
            </div>

            {/* Reset Settings */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={actions.resetSettings}
                icon={RotateCcw}
                highContrast={highContrast}
                className="w-full sm:w-auto"
              >
                Reset to Defaults
              </Button>
              <p
                className={`text-xs text-gray-500 dark:text-gray-400 mt-2 ${
                  isRTL ? "text-right" : ""
                }`}
              >
                This will reset all accessibility settings to their default
                values.
              </p>
            </div>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AccessibilitySettings;
