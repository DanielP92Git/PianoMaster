/**
 * DailyMessageBanner Component
 *
 * Shows a rotating music fun-fact message. Each day picks a different fact
 * from a pool of 12, ensuring no repeat from the previous day.
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const FUN_FACT_KEYS = Array.from({ length: 12 }, (_, i) => `dashboard.funFacts.${i}`);
const STORAGE_KEY = 'daily-fun-fact-index';

const DailyMessageBanner = () => {
  const { t } = useTranslation('common');

  const messageIndex = useMemo(() => {
    const todayStr = new Date().toDateString();

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored && stored.date === todayStr) {
        return stored.index;
      }

      const lastIndex = stored?.index ?? -1;
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * FUN_FACT_KEYS.length);
      } while (newIndex === lastIndex && FUN_FACT_KEYS.length > 1);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayStr, index: newIndex }));
      return newIndex;
    } catch {
      // If localStorage fails, just pick random
      return Math.floor(Math.random() * FUN_FACT_KEYS.length);
    }
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-6">
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm italic text-white/60">
        {t(FUN_FACT_KEYS[messageIndex])}
      </div>
    </div>
  );
};

export default DailyMessageBanner;
