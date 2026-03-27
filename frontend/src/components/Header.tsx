import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'it', flag: '🇮🇹' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'es', flag: '🇪🇸' },
];

interface HeaderProps {
  currentSection: 'tool' | 'pricing';
  onNavigate: (section: 'tool' | 'pricing') => void;
}

export default function Header({ currentSection, onNavigate }: HeaderProps) {
  const { t, i18n } = useTranslation();

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('tool')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-lg font-medium text-gray-800">{t('app_name')}</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onNavigate('tool')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                currentSection === 'tool'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('nav_tool')}
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                currentSection === 'pricing'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
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
                className={`w-8 h-8 rounded-full text-base flex items-center justify-center transition-all ${
                  i18n.language?.startsWith(lang.code)
                    ? 'bg-gray-100 ring-2 ring-blue-500'
                    : 'hover:bg-gray-100'
                }`}
              >
                {lang.flag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
