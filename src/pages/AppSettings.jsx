import React from "react";
import { Link } from "react-router-dom";
import {
  User,
  Bell,
  Volume2,
  Eye,
  SmilePlus,
  Play,
  Loader2,
} from "lucide-react";
import BackButton from "../components/ui/BackButton";
import { useSettings } from "../contexts/SettingsContext";
import { useAccessibility } from "../contexts/AccessibilityContext";
import useGlobalAudioSettings from "../hooks/useGlobalAudioSettings";
import SettingsSection from "../components/settings/SettingsSection";
import ToggleSetting from "../components/settings/ToggleSetting";
import SliderSetting from "../components/settings/SliderSetting";
import TimePicker from "../components/settings/TimePicker";
import ProfileForm from "../components/settings/ProfileForm";
import NotificationPermissionCard from "../components/settings/NotificationPermissionCard";
import { toast } from "react-hot-toast";

function AppSettings() {
  const { preferences, updatePreference, updateNotificationType, isLoading } =
    useSettings();
  const accessibility = useAccessibility();
  const audio = useGlobalAudioSettings();

  const handleTestSound = () => {
    if (audio.shouldPlaySound()) {
      // Play a test beep sound
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440; // A4 note
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        audio.effectiveVolume,
        audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      toast.success("Test sound played!");
    } else {
      toast.error("Sound is disabled");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      <BackButton to="/" name="Dashboard" />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-white/70">Customize your practice experience</p>
        </div>

        {/* Avatar Selection Link */}
        <Link
          to="/avatars"
          className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 hover:bg-white/20 transition-all duration-300"
        >
          <SmilePlus className="w-8 h-8 text-white/80 mr-4" />
          <div>
            <h3 className="text-xl font-bold text-white">Choose Your Avatar</h3>
            <p className="text-white/60 text-sm mt-1">
              Personalize your profile with a custom avatar
            </p>
          </div>
        </Link>

        {/* Profile Settings */}
        <SettingsSection
          title="Profile Settings"
          description="Manage your personal information"
          icon={User}
          defaultOpen={false}
        >
          <ProfileForm />
        </SettingsSection>

        {/* Accessibility Settings */}
        <SettingsSection
          title="Accessibility"
          description="Visual, navigation, and interaction preferences"
          icon={Eye}
          defaultOpen={false}
        >
          {/* Visual Accessibility */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm mb-3 mt-4">
              Visual Settings
            </h4>
            <ToggleSetting
              label="High Contrast Mode"
              description="Increase contrast for better visibility"
              value={accessibility.highContrast}
              onChange={accessibility.actions.toggleHighContrast}
            />
            <ToggleSetting
              label="Reduced Motion"
              description="Minimize animations and transitions"
              value={accessibility.reducedMotion}
              onChange={accessibility.actions.toggleReducedMotion}
            />
            <div className="py-3">
              <label className="text-white font-medium text-sm block mb-3">
                Font Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["small", "normal", "large", "xl"].map((size) => (
                  <button
                    key={size}
                    onClick={() => accessibility.actions.setFontSize(size)}
                    className={`
                      px-4 py-2 rounded-lg font-medium text-sm capitalize transition-all
                      ${
                        accessibility.fontSize === size
                          ? "bg-indigo-600 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }
                    `}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Motor Accessibility */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm mb-3 mt-6">
              Motor Settings
            </h4>
            <ToggleSetting
              label="Large Touch Targets"
              description="Make buttons and controls easier to tap"
              value={accessibility.largeTargets}
              onChange={accessibility.actions.toggleLargeTargets}
            />
            <ToggleSetting
              label="Sticky Hover"
              description="Keep hover states active longer"
              value={accessibility.stickyHover}
              onChange={accessibility.actions.toggleStickyHover}
            />
          </div>

          {/* Cognitive Accessibility */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm mb-3 mt-6">
              Cognitive Settings
            </h4>
            <ToggleSetting
              label="Simplified UI"
              description="Show a cleaner, less complex interface"
              value={accessibility.simplifiedUI}
              onChange={accessibility.actions.toggleSimplifiedUI}
            />
            <ToggleSetting
              label="Extended Timeouts"
              description="Give more time to complete tasks"
              value={accessibility.extendedTimeouts}
              onChange={accessibility.actions.toggleExtendedTimeouts}
            />
          </div>

          {/* Navigation & Screen Reader */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm mb-3 mt-6">
              Navigation & Screen Reader
            </h4>
            <ToggleSetting
              label="Keyboard Navigation"
              description="Enable keyboard shortcuts and navigation"
              value={accessibility.keyboardNavigation}
              onChange={accessibility.actions.toggleKeyboardNavigation}
            />
            <ToggleSetting
              label="Focus Indicators"
              description="Show visible focus outlines"
              value={accessibility.focusVisible}
              onChange={accessibility.actions.toggleFocusVisible}
            />
            <ToggleSetting
              label="Screen Reader Optimization"
              description="Optimize for screen reader users"
              value={accessibility.screenReaderOptimized}
              onChange={accessibility.actions.toggleScreenReaderOptimized}
            />
            <ToggleSetting
              label="Announcements"
              description="Enable audio announcements for actions"
              value={accessibility.announcements}
              onChange={accessibility.actions.toggleAnnouncements}
            />
          </div>
        </SettingsSection>

        {/* Notification Settings */}
        <SettingsSection
          title="Notifications & Reminders"
          description="Manage your notification preferences"
          icon={Bell}
          defaultOpen={false}
        >
          {/* Web Push Permission */}
          <div className="mt-4">
            <NotificationPermissionCard
              onPermissionChange={(permission) => {
                if (permission === "granted") {
                  updatePreference("web_push_enabled", true);
                } else {
                  updatePreference("web_push_enabled", false);
                }
              }}
            />
          </div>

          {/* Master Toggle */}
          <div className="mt-4">
            <ToggleSetting
              label="Enable All Notifications"
              description="Master toggle for all notification types"
              value={preferences.notifications_enabled}
              onChange={(value) =>
                updatePreference("notifications_enabled", value)
              }
            />
          </div>

          {/* Notification Types */}
          <div className="space-y-2 mt-4">
            <h4 className="text-white font-semibold text-sm mb-3">
              Notification Types
            </h4>
            <ToggleSetting
              label="Achievements"
              description="Get notified when you earn achievements"
              value={preferences.notification_types?.achievement !== false}
              onChange={(value) => updateNotificationType("achievement", value)}
              disabled={!preferences.notifications_enabled}
            />
            <ToggleSetting
              label="Assignments"
              description="Notifications about new assignments from teachers"
              value={preferences.notification_types?.assignment !== false}
              onChange={(value) => updateNotificationType("assignment", value)}
              disabled={!preferences.notifications_enabled}
            />
            <ToggleSetting
              label="Messages"
              description="Get notified of new messages"
              value={preferences.notification_types?.message !== false}
              onChange={(value) => updateNotificationType("message", value)}
              disabled={!preferences.notifications_enabled}
            />
            <ToggleSetting
              label="Reminders"
              description="Practice reminder notifications"
              value={preferences.notification_types?.reminder !== false}
              onChange={(value) => updateNotificationType("reminder", value)}
              disabled={!preferences.notifications_enabled}
            />
            <ToggleSetting
              label="System"
              description="Important system announcements"
              value={preferences.notification_types?.system !== false}
              onChange={(value) => updateNotificationType("system", value)}
              disabled={!preferences.notifications_enabled}
            />
          </div>

          {/* Quiet Hours */}
          <div className="mt-6">
            <ToggleSetting
              label="Quiet Hours"
              description="Disable notifications during specific times"
              value={preferences.quiet_hours_enabled}
              onChange={(value) =>
                updatePreference("quiet_hours_enabled", value)
              }
              disabled={!preferences.notifications_enabled}
            />
            {preferences.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <TimePicker
                  label="Start Time"
                  value={preferences.quiet_hours_start}
                  onChange={(value) =>
                    updatePreference("quiet_hours_start", value)
                  }
                />
                <TimePicker
                  label="End Time"
                  value={preferences.quiet_hours_end}
                  onChange={(value) =>
                    updatePreference("quiet_hours_end", value)
                  }
                />
              </div>
            )}
          </div>

          {/* Daily Practice Reminder */}
          <div className="mt-6">
            <ToggleSetting
              label="Daily Practice Reminder"
              description="Get a daily reminder to practice"
              value={preferences.daily_reminder_enabled}
              onChange={(value) =>
                updatePreference("daily_reminder_enabled", value)
              }
              disabled={!preferences.notifications_enabled}
            />
            {preferences.daily_reminder_enabled && (
              <div className="mt-4">
                <TimePicker
                  label="Reminder Time"
                  value={preferences.daily_reminder_time}
                  onChange={(value) =>
                    updatePreference("daily_reminder_time", value)
                  }
                />
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Audio/Sound Settings */}
        <SettingsSection
          title="Audio & Sound"
          description="Control volume and sound effects"
          icon={Volume2}
          defaultOpen={false}
        >
          <div className="mt-4 space-y-4">
            <ToggleSetting
              label="Enable Sounds"
              description="Turn all sounds on or off"
              value={preferences.sound_enabled}
              onChange={(value) => updatePreference("sound_enabled", value)}
            />

            <SliderSetting
              label="Master Volume"
              description="Overall volume for all sounds"
              value={preferences.master_volume * 100}
              onChange={(value) => audio.setMasterVolume(value / 100)}
              min={0}
              max={100}
              step={1}
              unit="%"
              disabled={!preferences.sound_enabled}
            />

            <div className="pt-2">
              <button
                onClick={handleTestSound}
                disabled={!preferences.sound_enabled}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                Test Sound
              </button>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

export default AppSettings;
