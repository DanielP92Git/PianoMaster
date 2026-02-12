import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useEquipAccessory } from "../../hooks/useAccessories";

const AccessoryUnlockModal = ({ accessories, onClose, onEquip }) => {
  const { t, i18n } = useTranslation("common");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationStage, setAnimationStage] = useState("chest"); // chest, reveal, complete
  const equipAccessory = useEquipAccessory();

  const currentAccessory = accessories?.[currentIndex];
  const isHebrew = useMemo(
    () => i18n.language?.startsWith("he"),
    [i18n.language]
  );
  const hebrewFontStack =
    "'Heebo','Assistant','Noto Sans Hebrew','Open Sans','Arial',sans-serif";
  const textFontStyle = isHebrew ? { fontFamily: hebrewFontStack } : undefined;
  const requirementChipText = formatRequirementChip(
    currentAccessory?.unlock_requirement,
    t
  );

  const confettiParticles = useMemo(() => {
    if (!currentAccessory) return [];
    return Array.from({ length: 20 }).map((_, i) => ({
      id: `${currentAccessory.id}-confetti-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      emoji: ["🎉", "✨", "⭐", "🎊", "💫"][Math.floor(Math.random() * 5)],
    }));
  }, [currentAccessory]);

  useEffect(() => {
    if (!currentAccessory) return;

    // Animation sequence
    const chestTimer = setTimeout(() => setAnimationStage("opening"), 300);
    const revealTimer = setTimeout(() => setAnimationStage("reveal"), 1000);
    const completeTimer = setTimeout(() => setAnimationStage("complete"), 1800);

    return () => {
      clearTimeout(chestTimer);
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [currentAccessory]);

  // Lock body scroll
  useEffect(() => {
    if (accessories?.length > 0) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [accessories]);

  if (!accessories || accessories.length === 0) return null;

  const handleEquipNow = async () => {
    if (!currentAccessory?.id) return;
    try {
      await equipAccessory.mutateAsync({
        accessoryId: currentAccessory.id,
        slot: currentAccessory.category || "auto",
      });
      onEquip?.(currentAccessory);
      handleNext();
    } catch (error) {
      console.error("Failed to equip accessory:", error);
      toast.error(
        t("avatars.unlockAnimation.equipFailed", {
          defaultValue: "Couldn’t equip this accessory. Please try again.",
        })
      );
    }
  };

  const handleNext = () => {
    if (currentIndex < accessories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setAnimationStage("chest");
    } else {
      onClose();
    }
  };

  const modalContent = (
    <div className="fixed left-0 top-0 z-[10000] flex h-screen w-screen items-center justify-center bg-black/70 p-4 backdrop-blur-sm safe-area-padding">
      {/* Confetti particles */}
      {animationStage !== "chest" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confettiParticles.map((particle) => (
            <div
              key={particle.id}
              className="confetti-particle absolute"
              style={{
                left: `${particle.left}%`,
                top: "-10%",
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            >
              {particle.emoji}
            </div>
          ))}
        </div>
      )}

      <div className="relative w-full max-w-md landscape:max-w-4xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white/90 transition-colors hover:bg-white/30 sm:h-9 sm:w-9"
          aria-label="Close"
        >
          <span className="text-lg leading-none">×</span>
        </button>

        {/* Main content */}
        <div className="relative max-h-[calc(100vh-var(--safe-area-top)-var(--safe-area-bottom)-2rem)] overflow-auto rounded-2xl border border-white/20 bg-gradient-to-br from-purple-900/95 via-indigo-900/95 to-blue-900/95 p-6 shadow-2xl sm:p-8 landscape:p-6">
          {/* Glow effect */}
          <div
            className="bg-gradient-radial absolute inset-0 from-yellow-400/20 via-transparent to-transparent opacity-0 transition-opacity duration-1000"
            style={{ opacity: animationStage === "reveal" ? 1 : 0 }}
          />

          {/* Content container */}
          <div className="relative space-y-4 sm:space-y-6">
            {/* Title */}
            <div className="text-center">
              <div
                className={`transition-all duration-500 ${animationStage === "complete" ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
              >
                <span className="mb-2 bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-400 bg-clip-text text-2xl font-black text-transparent sm:text-3xl">
                  {t("avatars.unlockAnimation.newAccessoryUnlocked")}
                </span>
              </div>
            </div>

            {/* Landscape-friendly layout: animation left, details/buttons right */}
            <div className="space-y-4 sm:space-y-6 landscape:grid landscape:grid-cols-[minmax(240px,0.9fr)_minmax(260px,1.1fr)] landscape:items-center landscape:gap-6 landscape:space-y-0">
              {/* Animation area */}
              <div className="relative flex items-center justify-center py-4 sm:py-8 landscape:py-2">
                {/* Treasure chest */}
                <div
                  className={`transition-all duration-700 ${
                    animationStage === "chest"
                      ? "treasure-chest-shake scale-100 opacity-100"
                      : animationStage === "opening"
                        ? "treasure-chest-open scale-110 opacity-100"
                        : "scale-0 opacity-0"
                  }`}
                >
                  <div className="text-8xl sm:text-9xl">🎁</div>
                </div>

                {/* Accessory reveal */}
                <div
                  className={`absolute transition-all duration-1000 ${
                    animationStage === "reveal" || animationStage === "complete"
                      ? "accessory-reveal scale-100 opacity-100"
                      : "translate-y-8 scale-0 opacity-0"
                  }`}
                >
                  <div className="relative">
                    {/* Glow ring */}
                    <div className="absolute inset-0 -m-4 animate-pulse rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 opacity-50 blur-xl" />

                    {/* Accessory image */}
                    <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-4 border-yellow-400/50 bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-2xl sm:h-40 sm:w-40 landscape:h-36 landscape:w-36">
                      <img
                        src={currentAccessory.image_url}
                        alt={currentAccessory.name}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column: info + buttons + progress */}
              <div className="space-y-4 sm:space-y-6">
                {/* Accessory info */}
                <div
                  className={`text-center transition-all duration-500 landscape:text-left ${
                    animationStage === "complete"
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0"
                  }`}
                >
                  <h3 className="mb-1 text-xl font-bold text-white sm:text-2xl">
                    {currentAccessory.name}
                  </h3>
                  <p className="text-sm text-white/70">
                    {requirementChipText && (
                      <span className="ml-2 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-xs">
                        {requirementChipText}
                      </span>
                    )}
                  </p>
                </div>

                {/* Action buttons */}
                <div
                  className={`flex gap-3 transition-all duration-500 ${
                    animationStage === "complete"
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0"
                  }`}
                >
                  <button
                    onClick={handleNext}
                    className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/20 sm:text-base"
                  >
                    {currentIndex < accessories.length - 1
                      ? t("common.next")
                      : t("avatars.unlockAnimation.viewLater")}
                  </button>
                  <button
                    onClick={handleEquipNow}
                    disabled={equipAccessory.isPending}
                    className="flex-1 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-all hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 sm:text-base"
                  >
                    {equipAccessory.isPending
                      ? t("common.loading")
                      : t("avatars.unlockAnimation.equipNow")}
                  </button>
                </div>

                {/* Progress indicator */}
                {accessories.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 pt-2 landscape:justify-start">
                    {accessories.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          i === currentIndex
                            ? "w-4 bg-yellow-400"
                            : i < currentIndex
                              ? "bg-white/50"
                              : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .confetti-particle {
          animation: confetti-fall linear forwards;
          font-size: 1.5rem;
        }

        @keyframes treasure-shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        .treasure-chest-shake {
          animation: treasure-shake 0.5s ease-in-out;
        }

        @keyframes accessory-rise {
          0% {
            transform: translateY(20px) scale(0.5);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .accessory-reveal {
          animation: accessory-rise 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AccessoryUnlockModal;

function formatRequirementChip(requirement, t) {
  if (!requirement?.type) return null;

  const formatNumber = (value) => {
    const numeric =
      typeof value === "number"
        ? value
        : Number.isFinite(Number(value))
          ? Number(value)
          : null;
    if (numeric === null) return `${value ?? ""}`;
    return numeric.toLocaleString();
  };

  switch (requirement.type) {
    case "games_played":
      return t("avatars.unlockModal.gamesPlayedDescription", {
        count: requirement.count || 0,
      });
    case "points_earned":
      return t("avatars.unlockModal.pointsEarnedShort", {
        amount: formatNumber(requirement.amount || 0),
      });
    case "streak":
      return t("avatars.unlockModal.streakDescription", {
        days: requirement.days || 0,
      });
    case "perfect_games":
      return t("avatars.unlockModal.perfectGamesDescription", {
        count: requirement.count || 0,
      });
    case "level":
      return t("avatars.unlockModal.levelDescription", {
        level: requirement.level || 0,
      });
    case "achievement":
      return requirement.name || requirement.id || "";
    default:
      return null;
  }
}
