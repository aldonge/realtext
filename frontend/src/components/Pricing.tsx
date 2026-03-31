import { useTranslation } from 'react-i18next';

export default function Pricing() {
  const { t } = useTranslation();

  return (
    <section className="max-w-3xl mx-auto py-16 px-5">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-heading font-bold text-slate-900">{t('pricing_title')}</h2>
        <p className="text-slate-500 mt-2 font-body">{t('pricing_subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="border border-slate-200 rounded-xl p-6 bg-white transition-shadow hover:shadow-md">
          <h3 className="text-lg font-heading font-bold text-slate-900">{t('plan_free')}</h3>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-heading font-bold text-slate-900">{t('plan_free_price')}</span>
            <span className="text-sm text-slate-500">{t('plan_free_period')}</span>
          </div>
          <ul className="mt-6 space-y-3">
            <Li text={t('plan_free_f1')} />
            <Li text={t('plan_free_f2')} />
            <Li text={t('plan_free_f3')} />
          </ul>
          <button className="mt-8 w-full py-3 rounded-xl border-[1.5px] border-slate-200 text-sm font-semibold text-slate-500 cursor-default">
            {t('plan_free_cta')}
          </button>
        </div>
        <div className="border-2 border-accent rounded-xl p-6 bg-white relative transition-shadow hover:shadow-md">
          <div className="absolute -top-3 left-6 bg-accent text-white text-xs font-semibold px-3 py-1 rounded-md">PRO</div>
          <h3 className="text-lg font-heading font-bold text-slate-900">{t('plan_pro')}</h3>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-heading font-bold text-slate-900">{t('plan_pro_price')}</span>
            <span className="text-sm text-slate-500">{t('plan_pro_period')}</span>
          </div>
          <ul className="mt-6 space-y-3">
            <Li text={t('plan_pro_f1')} />
            <Li text={t('plan_pro_f2')} />
            <Li text={t('plan_pro_f3')} />
            <Li text={t('plan_pro_f4')} />
          </ul>
          <button className="mt-8 w-full py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors">
            {t('plan_pro_cta')}
          </button>
        </div>
      </div>
    </section>
  );
}

function Li({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-slate-600">
      <svg className="w-4 h-4 text-accent mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {text}
    </li>
  );
}
