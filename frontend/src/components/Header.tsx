import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

interface HeaderProps {
  currentSection: 'tool' | 'pricing';
  onNavigate: (section: 'tool' | 'pricing') => void;
}

export default function Header({ currentSection, onNavigate }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => i18n.language?.startsWith(l.code)) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Language dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span>{current.flag}</span>
              <span>{current.code.toUpperCase()}</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                      i18n.language?.startsWith(lang.code)
                        ? 'bg-blue-50 text-accent font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
