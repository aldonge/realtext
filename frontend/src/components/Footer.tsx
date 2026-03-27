import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{t('footer_text')}</span>
          <span className="mx-1.5 text-gray-300">·</span>
          <span>{t('footer_sub')}</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="hover:text-gray-600 cursor-pointer">{t('privacy')}</span>
          <span className="hover:text-gray-600 cursor-pointer">{t('terms')}</span>
          <span className="hover:text-gray-600 cursor-pointer">{t('about')}</span>
        </div>
      </div>
    </footer>
  );
}
