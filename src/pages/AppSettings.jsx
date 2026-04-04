import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Volume2,
  Eye,
  SmilePlus,
  Play,
  Loader2,
  Download,
  Share,
  Plus,
} from "lucide-react";
import FeedbackForm from "../components/settings/FeedbackForm";
import { useSettings } from "../contexts/SettingsContext";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { useUser } from "../features/authentication/useUser";
import useGlobalAudioSettings from "../hooks/useGlobalAudioSettings";
import SettingsSection from "../components/settings/SettingsSection";
import ToggleSetting from "../components/settings/ToggleSetting";
import SliderSetting from "../components/settings/SliderSetting";
import ProfileForm from "../components/settings/ProfileForm";
import LanguageSelector from "../components/settings/LanguageSelector";
import ParentZoneEntryCard from "../components/settings/ParentZoneEntryCard";
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
  const { preferences, updatePreference, isLoading } = useSettings();
  const accessibility = useAccessibility();
  const audio = useGlobalAudioSettings();
  const { user, isStudent } = useUser();

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
      toast.error(t("install.unavailableToast"));
    };

    window.addEventListener("pwa-install-unavailable", handleUnavailable);
    return () => {
      window.removeEventListener("pwa-install-unavailable", handleUnavailable);
    };
  }, [t]);

  const handleInstallRequest = () => {
    if (typeof window === "undefined") return;
    // The native install prompt only works in a secure context (HTTPS / localhost).
    // On LAN HTTP, show manual Add-to-Home-Screen guidance instead.
    if (!window.isSecureContext) {
      toast(
        t("install.android.unavailableInsecure", {
          step: t("install.android.installStep"),
        })
      );
      return;
    }
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

  const showDesktopInstall =
    installEnv.isReady &&
    !installEnv.isStandalone &&
    !showIOSInstall &&
    !showAndroidInstall;

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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-4xl flex-col space-y-6 px-4 py-6">
        <LanguageSelector />

        {/* Parent Zone Entry Card — hidden when sidebar is visible (xl+) */}
        {isStudent && (
          <div className="xl:hidden">
            <ParentZoneEntryCard />
          </div>
        )}

        {/* Avatar Selection Link */}
        <Link
          to="/avatars"
          className={`flex items-center rounded-xl border border-white/20 bg-white/10 p-6 shadow-lg backdrop-blur-md transition-all duration-300 hover:bg-white/20 ${
            isRTL ? "direction-rtl" : ""
          }`}
        >
          <SmilePlus
            className={`h-8 w-8 text-white/80 ${isRTL ? "ml-4" : "mr-4"}`}
          />
          <div>
            <h3 className="text-xl font-bold text-white">
              {t("pages.settings.chooseYourAvatar")}
            </h3>
            <p className="mt-1 text-sm text-white/60">
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
              <p className="text-sm text-white/80">
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
              <p className="text-sm text-white/80">
                {t("install.chrome.installDescription")}
              </p>
              <button
                onClick={handleInstallRequest}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-medium transition-colors hover:from-indigo-700 hover:to-purple-700"
              >
                {t("install.chrome.installButton")}
              </button>
              <p className="text-xs text-white/70">
                {t("pages.settings.installDescriptionAndroid")}
                <strong>{t("install.android.installStep")}</strong>.
              </p>
            </div>
          )}

          {showDesktopInstall && (
            <div className="space-y-4 text-white">
              <p className="text-sm text-white/80">
                {t("install.desktop.installDescription")}
              </p>
              <button
                onClick={handleInstallRequest}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-medium transition-colors hover:from-indigo-700 hover:to-purple-700"
              >
                <Download className="h-4 w-4" />
                {t("install.desktop.installButton")}
              </button>
              <p className="text-xs text-white/70">
                {t("install.desktop.installFallback")}
              </p>
            </div>
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
            <h4 className="mb-3 mt-4 text-sm font-semibold text-white">
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
              <label className="mb-3 block text-sm font-medium text-white">
                {t("pages.settings.accessibility.fontSize")}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["small", "normal", "large", "xl"].map((size) => (
                  <button
                    key={size}
                    onClick={() => accessibility.actions.setFontSize(size)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                      accessibility.fontSize === size
                        ? "bg-indigo-600 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    } `}
                  >
                    {t(`pages.settings.accessibility.fontSizes.${size}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Motor Accessibility */}
          <div className="space-y-2">
            <h4 className="mb-3 mt-6 text-sm font-semibold text-white">
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
            <h4 className="mb-3 mt-6 text-sm font-semibold text-white">
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
            <h4 className="mb-3 mt-6 text-sm font-semibold text-white">
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
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {t("pages.settings.audio.testSound")}
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* Logout Button */}
        <div className="mt-auto border-t border-white/20 pb-8 pt-12">
          <div className="mx-auto max-w-xs">
            <AuthButton />
          </div>
        </div>

        {/* Feedback Form - per D-04: standalone centered button below Logout */}
        <FeedbackForm isRTL={isRTL} />
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
