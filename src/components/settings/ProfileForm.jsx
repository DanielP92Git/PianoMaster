import React, { useState, useEffect } from "react";
import { User, Mail, Award, Loader2, Check, Copy } from "lucide-react";
import { useUser } from "../../features/authentication/useUser";
import { updateProfile, validateUsername } from "../../services/profileService";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

/**
 * Profile editing form
 */
export function ProfileForm() {
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.dir() === "rtl";
  const labelAlignClass = isRTL ? "text-right" : "";
  const iconPositionClass = isRTL ? "right-3" : "left-3";
  const inputPaddingClass = isRTL ? "pr-11 pl-4 text-right" : "pl-11 pr-4";
  const usernamePaddingClass = isRTL ? "pr-11 pl-20 text-right" : "pl-11 pr-20";
  const readOnlyPaddingClass = inputPaddingClass;
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [hasNameChanges, setHasNameChanges] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
  });

  const [errors, setErrors] = useState({});

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        username: profile.username || "",
      });
    }
  }, [profile]);

  // Check username availability with debounce
  useEffect(() => {
    if (!formData.username || formData.username === profile?.username) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const available = await validateUsername(
          formData.username,
          profile?.id
        );
        setUsernameAvailable(available);
        if (!available) {
          setErrors((prev) => ({
            ...prev,
            username: "Username is already taken",
          }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.username;
            return newErrors;
          });
        }
      } catch (error) {
        setErrors((prev) => ({ ...prev, username: error.message }));
        setUsernameAvailable(false);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, profile?.username, profile?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Track if name fields have changed
    if (name === "first_name" || name === "last_name") {
      const changed =
        (name === "first_name" && value !== profile?.first_name) ||
        (name === "last_name" && value !== profile?.last_name) ||
        (name === "first_name" && formData.last_name !== profile?.last_name) ||
        (name === "last_name" && formData.first_name !== profile?.first_name);
      setHasNameChanges(changed);
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(formData.username);
    toast.success("Username copied to clipboard!");
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/^[a-zA-Z0-9_-]{3,20}$/.test(formData.username)) {
      newErrors.username =
        "Username must be 3-20 characters (letters, numbers, - and _ only)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    if (isEditingUsername && usernameAvailable === false) {
      toast.error("Please choose a different username");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(profile.id, formData);
      // Invalidate the user query to refetch updated data
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Profile updated successfully!");
      setIsEditingUsername(false);
      setHasNameChanges(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      username: profile?.username || "",
    });
    setErrors({});
    setIsEditingUsername(false);
    setHasNameChanges(false);
  };

  if (!profile) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 text-white/50 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {/* First Name */}
      <div>
        <label
          className={`text-white font-medium text-sm block mb-2 ${labelAlignClass}`}
        >
          {t("pages.settings.profile.firstName")} *
        </label>
        <div className="relative">
          <div
            className={`absolute ${iconPositionClass} top-1/2 -translate-y-1/2 pointer-events-none`}
          >
            <User className="w-5 h-5 text-white/40" />
          </div>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={`
              w-full ${inputPaddingClass} py-2.5 
              bg-white/10 border ${errors.first_name ? "border-red-500" : "border-white/20"} rounded-lg
              text-white placeholder-white/40
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              transition-all
            `}
            placeholder="Enter your first name"
          />
        </div>
        {errors.first_name && (
          <p className="text-red-400 text-xs mt-1">{errors.first_name}</p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <label
          className={`text-white font-medium text-sm block mb-2 ${labelAlignClass}`}
        >
          {t("pages.settings.profile.lastName")} *
        </label>
        <div className="relative">
          <div
            className={`absolute ${iconPositionClass} top-1/2 -translate-y-1/2 pointer-events-none`}
          >
            <User className="w-5 h-5 text-white/40" />
          </div>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={`
              w-full ${inputPaddingClass} py-2.5 
              bg-white/10 border ${errors.last_name ? "border-red-500" : "border-white/20"} rounded-lg
              text-white placeholder-white/40
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              transition-all
            `}
            placeholder="Enter your last name"
          />
        </div>
        {errors.last_name && (
          <p className="text-red-400 text-xs mt-1">{errors.last_name}</p>
        )}
      </div>

      {/* Username */}
      <div>
        <label
          className={`text-white font-medium text-sm block mb-2 ${labelAlignClass}`}
        >
          {t("pages.settings.profile.username")} *
        </label>
        <div className="relative">
          <div
            className={`absolute ${iconPositionClass} top-1/2 -translate-y-1/2 pointer-events-none`}
          >
            <User className="w-5 h-5 text-white/40" />
          </div>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            disabled={!isEditingUsername}
            className={`
              w-full ${usernamePaddingClass} py-2.5 
              bg-white/10 border ${errors.username ? "border-red-500" : "border-white/20"} rounded-lg
              text-white placeholder-white/40
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all
            `}
            placeholder="Choose a username"
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-2 ${
              isRTL ? "left-3" : "right-3"
            }`}
          >
            {isEditingUsername && (
              <>
                {isCheckingUsername ? (
                  <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                ) : usernameAvailable === true ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : null}
              </>
            )}
            <button
              type="button"
              onClick={handleCopyUsername}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Copy username"
            >
              <Copy className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          </div>
        </div>
        {errors.username && (
          <p className="text-red-400 text-xs mt-1">{errors.username}</p>
        )}
        {!isEditingUsername && (
          <button
            type="button"
            onClick={() => setIsEditingUsername(true)}
            className="text-indigo-400 hover:text-indigo-300 text-xs mt-1 transition-colors"
          >
            {t("pages.settings.profile.clickToEditUsername")}
          </button>
        )}
      </div>

      {/* Email (Read-only) */}
      <div>
        <label
          className={`text-white font-medium text-sm block mb-2 ${labelAlignClass}`}
        >
          {t("pages.settings.profile.email")}
        </label>
        <div className="relative">
          <div
            className={`absolute ${iconPositionClass} top-1/2 -translate-y-1/2 pointer-events-none`}
          >
            <Mail className="w-5 h-5 text-white/40" />
          </div>
          <input
            type="email"
            value={profile.email || ""}
            disabled
            className={`w-full ${readOnlyPaddingClass} py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed`}
          />
        </div>
        <p className={`text-white/40 text-xs mt-1 ${labelAlignClass}`}>
          {t("pages.settings.profile.emailDescription")}
        </p>
      </div>

      {/* Level (Read-only, teacher-managed) */}
      <div>
        <label
          className={`text-white font-medium text-sm block mb-2 ${labelAlignClass}`}
        >
          {t("pages.settings.profile.level")}
        </label>
        <div className="relative">
          <div
            className={`absolute ${iconPositionClass} top-1/2 -translate-y-1/2 pointer-events-none`}
          >
            <Award className="w-5 h-5 text-white/40" />
          </div>
          <input
            type="text"
            value={profile.level || "Not set"}
            disabled
            className={`w-full ${readOnlyPaddingClass} py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed`}
          />
        </div>
        <p className={`text-white/40 text-xs mt-1 ${labelAlignClass}`}>
          {t("pages.settings.profile.levelDescription")}
        </p>
      </div>

      {/* Action Buttons */}
      {(hasNameChanges || isEditingUsername) && (
        <div className={`flex gap-3 pt-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <button
            type="submit"
            disabled={
              isSaving ||
              (isEditingUsername &&
                (isCheckingUsername || usernameAvailable === false))
            }
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? t("common.saving") : t("common.save")}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.cancel")}
          </button>
        </div>
      )}
    </form>
  );
}

export default ProfileForm;
