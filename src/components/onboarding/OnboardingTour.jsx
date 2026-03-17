import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Map, Gamepad2, Star, Music } from "lucide-react";
import { useMotionTokens } from "../../utils/useMotionTokens";

const STEPS = [
  {
    icon: Music,
    titleKey: "onboarding.step1Title",
    titleFallback: "Welcome to PianoMaster!",
    descKey: "onboarding.step1Desc",
    descFallback:
      "Your musical journey starts here. Let's show you around!",
  },
  {
    icon: Map,
    titleKey: "onboarding.step2Title",
    titleFallback: "Follow the Learning Trail",
    descKey: "onboarding.step2Desc",
    descFallback:
      "Complete skill nodes to unlock new notes and challenges. Each node builds on what you've learned.",
  },
  {
    icon: Gamepad2,
    titleKey: "onboarding.step3Title",
    titleFallback: "Practice with Fun Games",
    descKey: "onboarding.step3Desc",
    descFallback:
      "Note recognition, sight reading, memory games, and rhythm training — learn while having fun!",
  },
  {
    icon: Star,
    titleKey: "onboarding.step4Title",
    titleFallback: "Earn Stars and XP",
    descKey: "onboarding.step4Desc",
    descFallback:
      "Get up to 3 stars on each exercise. Earn XP to level up and unlock achievements!",
  },
];

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const noMotionVariants = {
  enter: { opacity: 1 },
  center: { opacity: 1 },
  exit: { opacity: 1 },
};

export default function OnboardingTour({ onComplete }) {
  const { t } = useTranslation();
  const { reduce } = useMotionTokens();
  const shouldAnimate = !reduce;

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const Icon = step.icon;

  const goNext = () => {
    if (isLastStep) {
      onComplete();
      return;
    }
    setDirection(1);
    setStepIndex((prev) => prev + 1);
  };

  const handleSkip = () => {
    onComplete();
  };

  const variants = shouldAnimate ? slideVariants : noMotionVariants;
  const transition = shouldAnimate
    ? { type: "spring", stiffness: 300, damping: 30 }
    : { duration: 0 };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8 flex flex-col items-center text-center">
          {/* Animated step content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={stepIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="flex flex-col items-center"
            >
              {/* Icon */}
              <div className="w-20 h-20 rounded-full bg-white/15 border border-white/25 flex items-center justify-center mb-6">
                <Icon className="w-10 h-10 text-indigo-300" />
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-3">
                {t(step.titleKey, step.titleFallback)}
              </h2>

              {/* Description */}
              <p className="text-white/70 text-base leading-relaxed mb-8">
                {t(step.descKey, step.descFallback)}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                  i === stepIndex ? "bg-indigo-400" : "bg-white/25"
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex w-full gap-3">
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="flex-1 min-h-[48px] px-6 py-3 rounded-xl text-white/60 hover:text-white/80 hover:bg-white/5 transition-colors text-base font-medium"
              >
                {t("onboarding.skip", "Skip")}
              </button>
            )}
            <button
              onClick={goNext}
              className={`${
                isLastStep ? "w-full" : "flex-1"
              } min-h-[48px] px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-base transition-colors shadow-lg`}
            >
              {isLastStep
                ? t("onboarding.letsGo", "Let's Go!")
                : t("onboarding.next", "Next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
