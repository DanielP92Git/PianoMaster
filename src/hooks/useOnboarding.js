import { useState, useEffect } from 'react';
import { useUser } from '../features/authentication/useUser';

const STORAGE_KEY = 'pianoapp-onboarding-complete';

export function useOnboarding() {
  const { user, isStudent } = useUser();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!user || !isStudent) {
      setShouldShow(false);
      return;
    }
    const completed = localStorage.getItem(STORAGE_KEY);
    setShouldShow(!completed);
  }, [user, isStudent]);

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShouldShow(false);
  };

  return { shouldShowOnboarding: shouldShow, completeOnboarding };
}
