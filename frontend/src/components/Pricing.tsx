import { useTranslation } from 'react-i18next';

export default function Pricing() {
  const { t } = useTranslation();

  return (
    <section className="max-w-3xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-medium text-gray-900">{t('pricing_title')}</h2>
        <p className="text-gray-500 mt-2">{t('pricing_subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-2xl p-6 bg-white">
          <h3 className="text-lg font-medium text-gray-900">{t('plan_free')}</h3>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-semibold text-gray-900">{t('plan_free_price')}</span>
            <span className="text-sm text-gray-500">{t('plan_free_period')}</span>
          </div>
          <ul className="mt-6 space-y-3">
            <Li text={t('plan_free_f1')} />
            <Li text={t('plan_free_f2')} />
            <Li text={t('plan_free_f3')} />
          </ul>
          <button className="mt-8 w-full py-2.5 rounded-full border border-gray-300 text-sm font-medium text-gray-600 cursor-default">
            {t('plan_free_cta')}
          </button>
        </div>
        <div className="border-2 border-blue-600 rounded-2xl p-6 bg-white relative">
          <div className="absolute -top-3 left-6 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">PRO</div>
          <h3 className="text-lg font-medium text-gray-900">{t('plan_pro')}</h3>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-semibold text-gray-900">{t('plan_pro_price')}</span>
            <span className="text-sm text-gray-500">{t('plan_pro_period')}</span>
          </div>
          <ul className="mt-6 space-y-3">
            <Li text={t('plan_pro_f1')} />
            <Li text={t('plan_pro_f2')} />
            <Li text={t('plan_pro_f3')} />
            <Li text={t('plan_pro_f4')} />
          </ul>
          <button className="mt-8 w-full py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
            {t('plan_pro_cta')}
          </button>
        </div>
      </div>
    </section>
  );
}

function Li({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-600">
      <svg className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {text}
    </li>
  );
}
