import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'it', label: 'IT' },
  { code: 'es', label: 'ES' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'pt', label: 'PT' },
];

interface HeaderProps {
  currentSection: 'tool' | 'pricing';
  onNavigate: (section: 'tool' | 'pricing') => void;
}

export default function Header({ currentSection, onNavigate }: HeaderProps) {
  const { t, i18n } = useTranslation();

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-5">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-0 text-xl font-heading font-extrabold tracking-tight">
            <span className="text-slate-900">Real</span>
            <span className="text-accent">Text</span>
            <span className="cursor-blink text-accent">_</span>
          </a>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('tool')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                currentSection === 'tool'
                  ? 'border-accent text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t('nav_tool')}
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                currentSection === 'pricing'
                  ? 'border-accent text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t('nav_pricing')}
            </button>
          </nav>

          {/* Language */}
          <div className="flex items-center gap-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  i18n.language?.startsWith(lang.code)
                    ? 'bg-accent text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
