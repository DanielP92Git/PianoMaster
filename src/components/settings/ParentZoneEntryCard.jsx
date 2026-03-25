import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ChevronRight } from 'lucide-react';

/**
 * Entry card for the Parent Zone, displayed at the top of AppSettings.
 * Primary mobile entry point to /parent-portal (D-02).
 * Also shown on desktop as a prominent link replacing the subscription section (D-12).
 */
export default function ParentZoneEntryCard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('common');
  const isRTL = i18n.dir() === 'rtl';

  return (
    <button
      onClick={() => navigate('/parent-portal')}
      className={`w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 mb-6 flex items-center gap-4 hover:bg-white/15 transition-colors cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
    >
      <ShieldCheck size={24} className="text-amber-400 flex-shrink-0" />
      <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
        <p className="text-base font-bold text-white">{t('navigation.links.parentZone')}</p>
        <p className="text-sm text-white/60">{t('parentPortal.entryCardSubtitle')}</p>
      </div>
      <ChevronRight size={16} className={`text-white/40 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
    </button>
  );
}
