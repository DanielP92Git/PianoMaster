const fs = require('fs');
const f = 'src/pages/TrailMapPage.jsx';
let code = fs.readFileSync(f, 'utf8');

const old = `          {/* Row 1: Navigation + Title */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <span className="text-xl">{isRTL ? '\u2192' : '\u2190'}</span>
              <span className="font-medium text-sm">{t('common.dashboard', { defaultValue: 'Dashboard' })}</span>
            </Link>
            <h1 className="text-xl font-bold text-white font-quicksand">
              {t('pageTitle', { ns: 'trail' })}
            </h1>
            {/* Spacer to keep title centered */}
            <div className="w-20" />
          </div>`;

const rep = `          {/* Row 1: Navigation + Title */}
          <div className="flex items-center justify-between">
            <BackButton to="/" name="Dashboard" />
            <h1 className="text-xl font-bold text-white font-quicksand">
              {t('pageTitle', { ns: 'trail' })}
            </h1>
            {/* Spacer to balance the back button and keep title centered */}
            <div className="w-9" />
          </div>`;

if (!code.includes(old)) { console.error('Pattern not found'); process.exit(1); }
code = code.replace(old, rep);
fs.writeFileSync(f, code);
console.log('Done');
