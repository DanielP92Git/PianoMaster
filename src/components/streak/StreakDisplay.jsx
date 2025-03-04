import { Flame, Loader2 } from "lucide-react";
import { streakService } from "../../services/streakService";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function StreakDisplay() {
  const { data: streak, isLoading } = useQuery({
    queryKey: ["streak"],
    queryFn: () => streakService.getStreak(),
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 bg-orange-500/20 px-3 py-1.5 rounded-full">
        <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!streak) return null;

  return (
    <div className="flex items-center gap-2 bg-orange-500/20 px-3 py-1.5 rounded-full">
      <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
      <span className="text-sm font-medium text-orange-500">
        {streak} Day{streak !== 1 ? "s" : ""} Streak!
      </span>
    </div>
  );
}
