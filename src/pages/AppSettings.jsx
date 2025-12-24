import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Bell,
  Volume2,
  Eye,
  SmilePlus,
  Play,
  Loader2,
  Download,
  Share,
  Plus,
} from "lucide-react";
import { useSettings } from "../contexts/SettingsContext";
import { useAccessibility } from "../contexts/AccessibilityContext";
import useGlobalAudioSettings from "../hooks/useGlobalAudioSettings";
import SettingsSection from "../components/settings/SettingsSection";
import ToggleSetting from "../components/settings/ToggleSetting";
import SliderSetting from "../components/settings/SliderSetting";
import TimePicker from "../components/settings/TimePicker";
import ProfileForm from "../components/settings/ProfileForm";
import NotificationPermissionCard from "../components/settings/NotificationPermissionCard";
import LanguageSelector from "../components/settings/LanguageSelector";
import { toast } from "react-hot-toast";
import {
  isAndroidDevice,
  isChromeBrowser,
  isIOSDevice,
  isSafariBrowser,
  isInStandaloneMode,
} from "../utils/pwaDetection";
import { useTranslation } from "react-i18next";
import AuthButton from "../components/auth/AuthButton";

function AppSettings() {
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
  const toggleProps = { isRTL };
  const sliderProps = { isRTL };
  const timePickerProps = { isRTL };
  const { preferences, updatePreference, updateNotificationType, isLoading } =
    useSettings();
  const accessibility = useAccessibility();
  const audio = useGlobalAudioSettings();
  const [installEnv, setInstallEnv] = useState({
    isReady: false,
    isIOS: false,
    isSafari: false,
    isAndroid: false,
    isChrome: false,
    isStandalone: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    setInstallEnv({
      isReady: true,
      isIOS: isIOSDevice(),
      isSafari: isSafariBrowser(),
      isAndroid: isAndroidDevice(),
      isChrome: isChromeBrowser(),
      isStandalone: isInStandaloneMode(),
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUnavailable = () => {
      toast.error(
        "Install button isn't available right now. Visit in Chrome on Android or Safari on iOS and reload."
      );
    };

    window.addEventListener("pwa-install-unavailable", handleUnavailable);
    return () => {
      window.removeEventListener("pwa-install-unavailable", handleUnavailable);
    };
  }, []);

  const handleAndroidInstallRequest = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("request-pwa-install"));
  };

  const showIOSInstall =
    installEnv.isReady &&
    installEnv.isIOS &&
    installEnv.isSafari &&
    !installEnv.isStandalone;

  const showAndroidInstall =
    installEnv.isReady &&
    installEnv.isAndroid &&
    installEnv.isChrome &&
    !installEnv.isStandalone;

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
    <div className="min-h-screen pb-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 flex flex-col min-h-[calc(100vh-200px)]">
        <LanguageSelector />

        {/* Avatar Selection Link */}
        <Link
          to="/avatars"
          className={`flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 hover:bg-white/20 transition-all duration-300 ${
            isRTL ? "direction-rtl" : ""
          }`}
        >
          <SmilePlus
            className={`w-8 h-8 text-white/80 ${isRTL ? "ml-4" : "mr-4"}`}
          />
          <div>
            <h3 className="text-xl font-bold text-white">
              {t("pages.settings.chooseYourAvatar")}
            </h3>
            <p className="text-white/60 text-sm mt-1">
              {t("pages.settings.chooseYourAvatarDescription")}
            </p>
          </div>
        </Link>
        <SettingsSection
          isRTL={isRTL}
          title={t("pages.settings.installTitle")}
          description={t("pages.settings.installDescription")}
          icon={Download}
          defaultOpen={false}
        >
          {showIOSInstall && (
            <div className="space-y-4 text-white">
              <p className="text-white/80 text-sm">
                {t("install.ios.installDescription")}
              </p>
              <div className="space-y-3">
                <InstallStep
                  isRTL={isRTL}
                  number={1}
                  text={<>{t("install.ios.installStep1")}</>}
                  icon={<Share className="h-4 w-4 text-blue-300" />}
                />
                <InstallStep
                  isRTL={isRTL}
                  number={2}
                  text={<>{t("install.ios.installStep2")}</>}
                  icon={<Plus className="h-4 w-4 text-blue-300" />}
                />
                <InstallStep
                  isRTL={isRTL}
                  number={3}
                  text={<>{t("install.ios.installStep3")}</>}
                />
              </div>
              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs text-white/80">
                {t("install.safari.installDescription")}
              </div>
            </div>
          )}

          {showAndroidInstall && (
            <div className="space-y-4 text-white">
              <p className="text-white/80 text-sm">
                {t("install.chrome.installDescription")}
              </p>
              <button
                onClick={handleAndroidInstallRequest}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-colors text-sm font-medium"
              >
                {t("install.chrome.installButton")}
              </button>
              <p className="text-xs text-white/70">
                {t("pages.settings.installDescriptionAndroid")}
                <strong>{t("install.android.installStep")}</strong>.
              </p>
            </div>
          )}

          {!showIOSInstall && !showAndroidInstall && (
            <p className="text-white/70 text-sm">
              {t("pages.settings.installDescriptionNoInstall")}
            </p>
          )}
        </SettingsSection>

        {/* Profile Settings */}
        <SettingsSection
          isRTL={isRTL}
          title={t("pages.settings.profile.profileSettingsTitle")}
          description={t("pages.settings.profile.profileSettingsDescription")}
          icon={User}
          defaultOpen={false}
        >
          <ProfileForm />
        </SettingsSection>

        {/* Accessibility Settings */}
        <SettingsSection
          isRTL={isRTL}
          title={t("pages.settings.accessibility.accessibilitySettingsTitle")}
          description={t(
            "pages.settings.accessibility.accessibilitySettingsDescription"
          )}
          icon={Eye}
          defaultOpen={false}
        >
          {/* Visual Accessibility */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm mb-3 mt-4">
              {t("pages.settings.accessibility.visualSettingsTitle")}
            </h4>
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.accessibility.highContrastMode")}
              description={t(
                "pages.settings.accessibility.highContrastModeDescription"
              )}
              value={accessibility.highContrast}
              onChange={accessibility.actions.toggleHighContrast}
            />
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.accessibility.reducedMotion")}
              description={t(
                "pages.settings.accessibility.reducedMotionDescription"
              )}
              value={accessibility.reducedMotion}
              onChange={accessibility.actions.toggleReducedMotion}
            />
            <div className="py-3">
              <label className="text-white font-medium text-sm block mb-3">
                {t("pages.settings.accessibility.fontSize")}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["small", "normal", "large", "xl"].map((size) => (
                  <button
                    key={size}
                    onClick={() => accessibility.actions.setFontSize(size)}
                    className={`
                      px-4 py-2 rounded-lg font-medium text-sm transition-all
                      ${
                        accessibility.fontSize === size
                          ? "bg-indigo-600 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }
                    `}
                  >
                    {t(`pages.settings.accessibility.fontSizes.${size}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Motor Accessibility */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm mb-3 mt-6">
              {t("pages.settings.accessibility.motorSettingsTitle")}
            </h4>
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.accessibility.largeTouchTargets")}
              description={t(
                "pages.settings.accessibility.largeTouchTargetsDescription"
              )}
              value={accessibility.largeTargets}
              onChange={accessibility.actions.toggleLargeTargets}
            />
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.accessibility.stickyHover")}
              description={t(
                "pages.settings.accessibility.stickyHoverDescription"
              )}
              value={accessibility.stickyHover}
              onChange={accessibility.actions.toggleStickyHover}
            />
          </div>

          {/* Cognitive Accessibility */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm mb-3 mt-6">
              {t("pages.settings.accessibility.cognitiveSettingsTitle")}
            </h4>
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.accessibility.simplifiedUI")}
              description={t(
                "pages.settings.accessibility.simplifiedUIDescription"
              )}
              value={accessibility.simplifiedUI}
              onChange={accessibility.actions.toggleSimplifiedUI}
            />
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.accessibility.extendedTimeouts")}
              description={t(
                "pages.settings.accessibility.extendedTimeoutsDescription"
              )}
              value={accessibility.extendedTimeouts}
              onChange={accessibility.actions.toggleExtendedTimeouts}
            />
          </div>

          {/* Navigation & Screen Reader */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold text-sm mb-3 mt-6">
              {t("pages.settings.accessibility.navigationSettingsTitle")}
            </h4>
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.accessibility.keyboardNavigation")}
              description={t(
                "pages.settings.accessibility.keyboardNavigationDescription"
              )}
              value={accessibility.keyboardNavigation}
              onChange={accessibility.actions.toggleKeyboardNavigation}
            />
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.accessibility.focusIndicators")}
              description={t(
                "pages.settings.accessibility.focusIndicatorsDescription"
              )}
              value={accessibility.focusVisible}
              onChange={accessibility.actions.toggleFocusVisible}
            />
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.accessibility.screenReaderOptimization")}
              description={t(
                "pages.settings.accessibility.screenReaderOptimizationDescription"
              )}
              value={accessibility.screenReaderOptimized}
              onChange={accessibility.actions.toggleScreenReaderOptimized}
            />
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.accessibility.announcements")}
              description={t(
                "pages.settings.accessibility.announcementsDescription"
              )}
              value={accessibility.announcements}
              onChange={accessibility.actions.toggleAnnouncements}
            />
          </div>
        </SettingsSection>

        {/* Notification Settings */}
        <SettingsSection
          isRTL={isRTL}
          title={t("pages.settings.notifications.notificationsSettingsTitle")}
          description={t(
            "pages.settings.notifications.notificationsSettingsDescription"
          )}
          icon={Bell}
          defaultOpen={false}
        >
          {/* Web Push Permission */}
          <div className="mt-4">
            <NotificationPermissionCard
              isRTL={isRTL}
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
              {...toggleProps}
              label={t("pages.settings.notifications.enableAllNotifications")}
              description={t(
                "pages.settings.notifications.enableAllNotificationsDescription"
              )}
              value={preferences.notifications_enabled}
              onChange={(value) =>
                updatePreference("notifications_enabled", value)
              }
            />
          </div>

          {/* Notification Types */}
          <div className="space-y-2 mt-4">
            <h4 className="text-white font-semibold text-sm mb-3">
              {t("pages.settings.notifications.notificationTypesTitle")}
            </h4>
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.notifications.achievements")}
              value={preferences.notification_types?.achievement !== false}
              onChange={(value) => updateNotificationType("achievement", value)}
              disabled={!preferences.notifications_enabled}
            />
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.notifications.assignments")}
              value={preferences.notification_types?.assignment !== false}
              onChange={(value) => updateNotificationType("assignment", value)}
              disabled={!preferences.notifications_enabled}
            />
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.notifications.messages")}
              value={preferences.notification_types?.message !== false}
              onChange={(value) => updateNotificationType("message", value)}
              disabled={!preferences.notifications_enabled}
            />
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.notifications.reminders")}
              value={preferences.notification_types?.reminder !== false}
              onChange={(value) => updateNotificationType("reminder", value)}
              disabled={!preferences.notifications_enabled}
            />
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.notifications.system")}
              value={preferences.notification_types?.system !== false}
              onChange={(value) => updateNotificationType("system", value)}
              disabled={!preferences.notifications_enabled}
            />
          </div>

          {/* Quiet Hours */}
          <div className="mt-6">
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.notifications.quietHours")}
              description={t(
                "pages.settings.notifications.quietHoursDescription"
              )}
              value={preferences.quiet_hours_enabled}
              onChange={(value) =>
                updatePreference("quiet_hours_enabled", value)
              }
              disabled={!preferences.notifications_enabled}
            />
            {preferences.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <TimePicker
                  {...timePickerProps}
                  label={t("pages.settings.notifications.startTime")}
                  value={preferences.quiet_hours_start}
                  onChange={(value) =>
                    updatePreference("quiet_hours_start", value)
                  }
                />
                <TimePicker
                  {...timePickerProps}
                  label={t("pages.settings.notifications.endTime")}
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
              {...toggleProps}
              label={t("pages.settings.notifications.dailyPracticeReminder")}
              description={t(
                "pages.settings.notifications.dailyPracticeReminderDescription"
              )}
              value={preferences.daily_reminder_enabled}
              onChange={(value) =>
                updatePreference("daily_reminder_enabled", value)
              }
              disabled={!preferences.notifications_enabled}
            />
            {preferences.daily_reminder_enabled && (
              <div className="mt-4">
                <TimePicker
                  {...timePickerProps}
                  label={t("pages.settings.notifications.reminderTime")}
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
          isRTL={isRTL}
          title={t("pages.settings.audio.audioSettingsTitle")}
          description={t("pages.settings.audio.audioSettingsDescription")}
          icon={Volume2}
          defaultOpen={false}
        >
          <div className="mt-4 space-y-4">
            <ToggleSetting
              {...toggleProps}
              label={t("pages.settings.audio.enableSounds")}
              description={t("pages.settings.audio.enableSoundsDescription")}
              value={preferences.sound_enabled}
              onChange={(value) => updatePreference("sound_enabled", value)}
            />

            <SliderSetting
              {...sliderProps}
              label={t("pages.settings.audio.masterVolume")}
              description={t("pages.settings.audio.masterVolumeDescription")}
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
                {t("pages.settings.audio.testSound")}
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* Logout Button */}
        <div className="mt-auto pt-12 pb-8 border-t border-white/20">
          <div className="max-w-xs mx-auto">
            <AuthButton />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppSettings;

function InstallStep({ number, text, icon, isRTL = false }) {
  return (
    <div
      className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse text-right" : ""}`}
    >
      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
        {number}
      </div>
      <div
        className={`flex items-center gap-2 text-sm text-white/90 ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <span>{text}</span>
        {icon && <span>{icon}</span>}
      </div>
    </div>
  );
}
