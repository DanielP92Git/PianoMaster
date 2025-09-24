import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/Card";
import { Progress } from "../../../ui/Progress";

/**
 * Visual pattern display component
 * Shows rhythm patterns, progress, and timing feedback
 */
export function PatternDisplay({
  pattern = [],
  currentBeat = 0,
  isPlaying = false,
  showProgress = true,
  title = "Rhythm Pattern",
  className = "",
}) {
  const progressPercentage =
    pattern.length > 0 ? (currentBeat / pattern.length) * 100 : 0;

  return (
    <Card
      className={`bg-white/10 backdrop-blur-md border-white/20 ${className}`}
    >
      <CardHeader>
        <CardTitle className="text-white text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Pattern visualization */}
        <div className="flex justify-center gap-1 mb-4 flex-wrap">
          {pattern.map((beat, index) => (
            <div
              key={index}
              className={`
                w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-bold
                transition-all duration-200
                ${
                  index === currentBeat && isPlaying
                    ? "bg-yellow-400 border-yellow-400 text-black scale-110"
                    : beat === 1
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white/10 border-white/30 text-white/60"
                }
              `}
            >
              {beat === 1 ? "♩" : "·"}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="mb-2">
            <Progress value={progressPercentage} className="h-2 bg-white/20" />
            <div className="text-xs text-gray-300 text-center mt-1">
              Beat {currentBeat + 1} of {pattern.length}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Simple pattern visualization without card wrapper
 * For inline display within other components
 */
export function PatternVisualization({
  pattern = [],
  currentBeat = 0,
  isPlaying = false,
  size = "md", // "sm", "md", "lg"
  className = "",
}) {
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-xs",
    lg: "w-10 h-10 text-sm",
  };

  return (
    <div className={`flex justify-center gap-1 flex-wrap ${className}`}>
      {pattern.map((beat, index) => (
        <div
          key={index}
          className={`
            ${sizeClasses[size]} rounded border-2 flex items-center justify-center font-bold
            transition-all duration-200
            ${
              index === currentBeat && isPlaying
                ? "bg-yellow-400 border-yellow-400 text-black scale-110"
                : beat === 1
                  ? "bg-blue-500 border-blue-500 text-white"
                  : "bg-white/10 border-white/30 text-white/60"
            }
          `}
        >
          {beat === 1 ? "♩" : "·"}
        </div>
      ))}
    </div>
  );
}

export default PatternDisplay;
