import React from "react";
import { Card, CardContent } from "../../../ui/Card";

/**
 * Interactive tap area component for rhythm games
 * Provides visual feedback for user taps and timing accuracy
 */
export function TapArea({
  onTap,
  feedback = null,
  isActive = true,
  title = "TAP HERE",
  subtitle = "Tap in rhythm with the pattern",
  className = "",
}) {
  return (
    <Card
      className={`bg-white/10 backdrop-blur-md border-white/20 cursor-pointer ${className} ${
        isActive
          ? "hover:bg-white/15 transition-colors"
          : "opacity-50 cursor-not-allowed"
      }`}
      onClick={isActive ? onTap : undefined}
    >
      <CardContent className="pt-6">
        <div className="text-center py-12">
          <div className="text-4xl font-bold text-white mb-4">{title}</div>
          <div className="text-lg text-gray-300">{subtitle}</div>
          {feedback && (
            <div
              className={`
              mt-4 text-2xl font-bold animate-pulse
              ${
                feedback.accuracy === "PERFECT"
                  ? "text-green-400"
                  : feedback.accuracy === "GOOD"
                    ? "text-yellow-400"
                    : feedback.accuracy === "FAIR"
                      ? "text-orange-400"
                      : "text-red-400"
              }
            `}
            >
              {feedback.accuracy}! +{feedback.points}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TapArea;
