#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// ─── Configuration ──────────────────────────────────────────────────────────
const LANGUAGES = ['en', 'it', 'es', 'de', 'fr', 'pt'];
const BASE_URL = 'https://realtext.org';
const SRC_DIR = __dirname;
const OUT_DIR = path.resolve(SRC_DIR, '..', 'static');

const startTime = Date.now();
let errorCount = 0;
let warnCount = 0;
const allUrls = []; // for sitemap

// ─── Logging ────────────────────────────────────────────────────────────────
function log(msg) { console.log(`[build] ✓ ${msg}`); }
function warn(msg) { warnCount++; console.log(`[build] ⚠ ${msg}`); }
function error(msg) { errorCount++; console.error(`[build] ✗ ${msg}`); }

// ─── Helpers ────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function deepGet(obj, dotPath) {
  const parts = dotPath.split('.');
  let val = obj;
  for (const p of parts) {
    if (val == null) return undefined;
    val = val[p];
  }
  return val;
}

function countKeys(obj, prefix) {
  let count = 0;
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      count += countKeys(val, prefix ? `${prefix}.${key}` : key);
    } else {
      count++;
    }
  }
  return count;
}

function findMissingKeys(ref, target, prefix, missing) {
  for (const key of Object.keys(ref)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (!(key in target)) {
      missing.push(fullKey);
    } else if (typeof ref[key] === 'object' && ref[key] !== null && !Array.isArray(ref[key])) {
      if (typeof target[key] === 'object' && target[key] !== null) {
        findMissingKeys(ref[key], target[key], fullKey, missing);
      }
    }
  }
}

function deepMerge(base, override) {
  const result = Object.assign({}, base);
  for (const key of Object.keys(override)) {
    if (typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key])
        && typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key])) {
      result[key] = deepMerge(result[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

// ─── Template engine ────────────────────────────────────────────────────────
function renderTemplate(template, vars) {
  // Handle partials {{> partialName}} (supports hyphens in names)
  let result = template.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (match, name) => {
    const partialPath = path.join(SRC_DIR, 'templates', 'partials', name + '.html');
    if (fs.existsSync(partialPath)) {
      return fs.readFileSync(partialPath, 'utf8');
    }
    warn(`Partial not found: ${name}`);
    return '';
  });

  // Handle {{#each array}}...{{/each}}
  result = result.replace(/\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayPath, body) => {
    const arr = deepGet(vars, arrayPath);
    if (!Array.isArray(arr)) return '';
    return arr.map((item, idx) => {
      const itemVars = Object.assign({}, vars, item, {
        _index: idx,
        _first: idx === 0,
        _last: idx === arr.length - 1,
        stepNumber: idx + 1,
        comma: idx < arr.length - 1 ? ',' : ''
      });
      // Handle nested dot access {{.}} for string arrays
      let rendered = body;
      rendered = rendered.replace(/\{\{\.\}\}/g, typeof item === 'string' ? item : '');
      return renderTemplate(rendered, itemVars);
    }).join('');
  });

  // Handle {{#if condition}}...{{/if}}
  result = result.replace(/\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condPath, body) => {
    const val = deepGet(vars, condPath);
    if (val && (!Array.isArray(val) || val.length > 0)) {
      return renderTemplate(body, vars);
    }
    return '';
  });

  // Replace {{var}} with dot notation support
  result = result.replace(/\{\{([\w.]+)\}\}/g, (match, varPath) => {
    const val = deepGet(vars, varPath);
    if (val === undefined) return match;
    return String(val);
  });

  return result;
}

// ─── Load translations with EN fallback ─────────────────────────────────────
function loadTranslations() {
  console.log('[build] Loading translations...');
  const translations = {};
  const enPath = path.join(SRC_DIR, 'translations', 'en.json');
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const enKeyCount = countKeys(enData, '');
  translations.en = enData;
  log(`en (${enKeyCount} keys)`);

  for (const lang of LANGUAGES) {
    if (lang === 'en') continue;
    const langPath = path.join(SRC_DIR, 'translations', lang + '.json');
    if (!fs.existsSync(langPath)) {
      warn(`${lang}.json not found, using EN fallback`);
      translations[lang] = Object.assign({}, enData);
      continue;
    }
    const langData = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    const missing = [];
    findMissingKeys(enData, langData, '', missing);
    const langKeyCount = countKeys(langData, '');
    if (missing.length > 0) {
      warn(`${lang} (${langKeyCount} keys, ${missing.length} falling back to en: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''})`);
      translations[lang] = deepMerge(enData, langData);
    } else {
      log(`${lang} (${langKeyCount} keys)`);
      translations[lang] = langData;
    }
  }
  return translations;
}

// ─── Load articles ──────────────────────────────────────────────────────────
function loadArticles() {
  const articles = {};
  for (const lang of LANGUAGES) {
    articles[lang] = [];
    const dir = path.join(SRC_DIR, 'articles', lang);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      articles[lang].push(data);
    }
    // Sort by date descending
    articles[lang].sort((a, b) => b.date.localeCompare(a.date));
  }
  return articles;
}

// ─── Load articles-meta ─────────────────────────────────────────────────────
function loadArticlesMeta() {
  const metaPath = path.join(SRC_DIR, 'articles-meta.json');
  if (!fs.existsSync(metaPath)) return { translationGroups: [], standalone: [] };
  return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
}

// ─── Hreflang builder ───────────────────────────────────────────────────────
function buildHreflang(currentLang, currentPath, availableLangs) {
  const langs = availableLangs || LANGUAGES;
  let tags = '';
  for (const lang of langs) {
    const href = `${BASE_URL}/${lang}/${currentPath}`;
    tags += `    <link rel="alternate" hreflang="${lang}" href="${href}">\n`;
  }
  tags += `    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/en/${currentPath}">`;
  return tags;
}

// ─── Article hreflang (respects translations) ───────────────────────────────
function buildArticleHreflang(articleLang, articleSlug, meta) {
  // Check if this article is in a translation group
  for (const group of meta.translationGroups) {
    if (group.versions && group.versions[articleLang] === articleSlug) {
      let tags = '';
      for (const [lang, slug] of Object.entries(group.versions)) {
        tags += `    <link rel="alternate" hreflang="${lang}" href="${BASE_URL}/${lang}/blog/${slug}.html">\n`;
      }
      // x-default: prefer EN version if it exists, otherwise self
      const defaultLang = group.versions.en ? 'en' : articleLang;
      const defaultSlug = group.versions.en || articleSlug;
      tags += `    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/${defaultLang}/blog/${defaultSlug}.html">`;
      return tags;
    }
  }
  // Standalone: only self hreflang
  return `    <link rel="alternate" hreflang="${articleLang}" href="${BASE_URL}/${articleLang}/blog/${articleSlug}.html">\n` +
         `    <link rel="alternate" hreflang="x-default" href="${BASE_URL}/${articleLang}/blog/${articleSlug}.html">`;
}

// ─── Article language links (smart switcher) ─────────────────────────────────
function buildArticleLanguageLinks(articleLang, articleSlug, meta) {
  const links = {};
  // Check if this article is in a translation group
  let group = null;
  for (const g of meta.translationGroups) {
    if (g.versions && g.versions[articleLang] === articleSlug) {
      group = g;
      break;
    }
  }
  for (const lang of LANGUAGES) {
    if (lang === articleLang) {
      // Self link
      links[lang] = `/${lang}/blog/${articleSlug}.html`;
    } else if (group && group.versions[lang]) {
      // Translation exists in group
      links[lang] = `/${lang}/blog/${group.versions[lang]}.html`;
    } else {
      // No translation: go to blog index
      links[lang] = `/${lang}/blog/`;
    }
  }
  return links;
}

// ─── Language switcher builder ──────────────────────────────────────────────
function buildLangSwitcher(currentLang, pagePath) {
  const langNames = { en: 'EN', it: 'IT', es: 'ES', de: 'DE', fr: 'FR', pt: 'PT' };
  return LANGUAGES.map(lang => {
    const href = '/' + lang + '/' + pagePath;
    const active = lang === currentLang;
    const cls = active
      ? 'px-2.5 py-1 text-xs font-medium rounded-md bg-accent text-white'
      : 'px-2.5 py-1 text-xs font-medium rounded-md text-slate-500 hover:bg-slate-100';
    return `<a href="${href}" class="${cls}">${langNames[lang]}</a>`;
  }).join('\n                ');
}

// ─── Date formatter ─────────────────────────────────────────────────────────
function formatDate(isoDate, lang) {
  const months = {
    en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    it: ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'],
    es: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
    de: ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'],
    fr: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'],
    pt: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  };
  const [y, m, d] = isoDate.split('-').map(Number);
  const ml = (months[lang] || months.en)[m - 1];
  return `${d} ${ml} ${y}`;
}

// ─── Write file helper ──────────────────────────────────────────────────────
function writeFile(relPath, content) {
  const fullPath = path.join(OUT_DIR, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

// ─── Validate generated HTML ────────────────────────────────────────────────
function validateHtml(html, filePath) {
  if (!/<html\s+lang="/.test(html)) {
    error(`${filePath}: missing <html lang="...">`);
  }
  if (!/<title>[^<]+<\/title>/.test(html)) {
    error(`${filePath}: missing or empty <title>`);
  }
  if (!/<meta\s+name="description"/.test(html)) {
    error(`${filePath}: missing <meta name="description">`);
  }
  if (!/hreflang/.test(html)) {
    error(`${filePath}: missing hreflang tags`);
  }
}

// ─── Sitemap generator ──────────────────────────────────────────────────────
function generateSitemap(urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  // Router page
  xml += '  <url>\n';
  xml += `    <loc>${BASE_URL}/</loc>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>1.0</priority>\n';
  for (const lang of LANGUAGES) {
    xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE_URL}/${lang}/"/>\n`;
  }
  xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/en/"/>\n`;
  xml += '  </url>\n';

  for (const url of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    if (url.lastmod) xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq || 'weekly'}</changefreq>\n`;
    xml += `    <priority>${url.priority || '0.8'}</priority>\n`;
    if (url.alternates) {
      for (const alt of url.alternates) {
        xml += `    <xhtml:link rel="alternate" hreflang="${alt.lang}" href="${alt.href}"/>\n`;
      }
      xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${url.alternates.find(a => a.lang === 'en')?.href || url.loc}"/>\n`;
    }
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';
  return xml;
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN BUILD
// ═══════════════════════════════════════════════════════════════════════════

function main() {
  // Load data
  const translations = loadTranslations();
  const articles = loadArticles();
  const articlesMeta = loadArticlesMeta();
  const sitemapUrls = [];

  // Load templates
  const landingTpl = fs.readFileSync(path.join(SRC_DIR, 'templates', 'landing.template.html'), 'utf8');
  const articleTpl = fs.readFileSync(path.join(SRC_DIR, 'templates', 'article.template.html'), 'utf8');
  const legalTpl = fs.readFileSync(path.join(SRC_DIR, 'templates', 'legal.template.html'), 'utf8');
  const blogIndexTpl = fs.readFileSync(path.join(SRC_DIR, 'templates', 'blog-index.template.html'), 'utf8');
  const routerTpl = fs.readFileSync(path.join(SRC_DIR, 'templates', 'router.template.html'), 'utf8');

  console.log('[build] Generating pages...');

  // ─── Router (static/index.html) ──────────────────────────────────────────
  const routerHtml = routerTpl; // router is static, no templating needed
  writeFile('index.html', routerHtml);
  log('/index.html (router)');

  // ─── Per-language pages ───────────────────────────────────────────────────
  for (const lang of LANGUAGES) {
    const t = translations[lang];
    const langArticles = articles[lang] || [];

    // Blog articles for landing page (max 3)
    const topArticles = langArticles.slice(0, 3);

    // Prepare FAQ JSON-LD data (escape for JSON)
    const faqJsonLd = t.faq.items.map(item => ({
      q: escapeHtml(item.q),
      a: escapeHtml(item.a)
    }));

    // ─── Landing page ──────────────────────────────────────────────────────
    const landingVars = Object.assign({}, t, {
      currentLang: lang,
      currentPath: '',
      pageTitle: t.meta.landing.title,
      pageDescription: t.meta.landing.description,
      ogTitle: t.meta.landing.ogTitle,
      ogDescription: t.meta.landing.ogDescription,
      hreflangTags: buildHreflang(lang, ''),
      langSwitcher: buildLangSwitcher(lang, ''),
      blogArticles: topArticles,
      faqJsonLd: faqJsonLd
    });
    const landingHtml = renderTemplate(landingTpl, landingVars);
    validateHtml(landingHtml, `/${lang}/index.html`);
    writeFile(`${lang}/index.html`, landingHtml);
    log(`/${lang}/index.html`);

    sitemapUrls.push({
      loc: `${BASE_URL}/${lang}/`,
      changefreq: 'weekly',
      priority: '1.0',
      alternates: LANGUAGES.map(l => ({ lang: l, href: `${BASE_URL}/${l}/` }))
    });

    // ─── Privacy page ──────────────────────────────────────────────────────
    const privacyVars = Object.assign({}, t, {
      currentLang: lang,
      currentPath: 'privacy.html',
      pageTitle: t.meta.privacy.title,
      pageDescription: t.meta.privacy.description,
      ogTitle: t.meta.privacy.title,
      ogDescription: t.meta.privacy.description,
      hreflangTags: buildHreflang(lang, 'privacy.html'),
      langSwitcher: buildLangSwitcher(lang, 'privacy.html'),
      legalTitle: t.privacy.title,
      legalLastUpdated: t.privacy.lastUpdated,
      legalSections: t.privacy.sections,
      isEn: lang === 'en',
      isIt: lang === 'it',
      isEs: lang === 'es',
      isDe: lang === 'de',
      isFr: lang === 'fr',
      isPt: lang === 'pt'
    });
    const privacyHtml = renderTemplate(legalTpl, privacyVars);
    validateHtml(privacyHtml, `/${lang}/privacy.html`);
    writeFile(`${lang}/privacy.html`, privacyHtml);
    log(`/${lang}/privacy.html`);

    sitemapUrls.push({
      loc: `${BASE_URL}/${lang}/privacy.html`,
      changefreq: 'monthly',
      priority: '0.4',
      alternates: LANGUAGES.map(l => ({ lang: l, href: `${BASE_URL}/${l}/privacy.html` }))
    });

    // ─── Terms page ────────────────────────────────────────────────────────
    const termsVars = Object.assign({}, t, {
      currentLang: lang,
      currentPath: 'terms.html',
      pageTitle: t.meta.terms.title,
      pageDescription: t.meta.terms.description,
      ogTitle: t.meta.terms.title,
      ogDescription: t.meta.terms.description,
      hreflangTags: buildHreflang(lang, 'terms.html'),
      langSwitcher: buildLangSwitcher(lang, 'terms.html'),
      legalTitle: t.terms.title,
      legalLastUpdated: t.terms.lastUpdated,
      legalSections: t.terms.sections,
      isEn: lang === 'en',
      isIt: lang === 'it',
      isEs: lang === 'es',
      isDe: lang === 'de',
      isFr: lang === 'fr',
      isPt: lang === 'pt'
    });
    const termsHtml = renderTemplate(legalTpl, termsVars);
    validateHtml(termsHtml, `/${lang}/terms.html`);
    writeFile(`${lang}/terms.html`, termsHtml);
    log(`/${lang}/terms.html`);

    sitemapUrls.push({
      loc: `${BASE_URL}/${lang}/terms.html`,
      changefreq: 'monthly',
      priority: '0.4',
      alternates: LANGUAGES.map(l => ({ lang: l, href: `${BASE_URL}/${l}/terms.html` }))
    });

    // ─── Blog index page ───────────────────────────────────────────────────
    const blogArticlesWithDate = langArticles.map(a => Object.assign({}, a, {
      formattedDate: formatDate(a.date, lang)
    }));
    const blogIndexVars = Object.assign({}, t, {
      currentLang: lang,
      currentPath: 'blog/',
      pageTitle: t.meta.blog.title,
      pageDescription: t.meta.blog.description,
      ogTitle: t.meta.blog.title,
      ogDescription: t.meta.blog.description,
      hreflangTags: buildHreflang(lang, 'blog/'),
      langSwitcher: buildLangSwitcher(lang, 'blog/'),
      blogArticles: blogArticlesWithDate
    });
    const blogIndexHtml = renderTemplate(blogIndexTpl, blogIndexVars);
    validateHtml(blogIndexHtml, `/${lang}/blog/index.html`);
    writeFile(`${lang}/blog/index.html`, blogIndexHtml);
    log(`/${lang}/blog/index.html`);

    sitemapUrls.push({
      loc: `${BASE_URL}/${lang}/blog/`,
      changefreq: 'weekly',
      priority: '0.7',
      alternates: LANGUAGES.map(l => ({ lang: l, href: `${BASE_URL}/${l}/blog/` }))
    });

    // ─── Individual blog articles ──────────────────────────────────────────
    for (const article of langArticles) {
      const relatedArticles = langArticles.filter(a => a.slug !== article.slug).slice(0, 3);
      const artHreflang = buildArticleHreflang(lang, article.slug, articlesMeta);
      const languageLinks = buildArticleLanguageLinks(lang, article.slug, articlesMeta);

      const articleVars = Object.assign({}, t, {
        currentLang: lang,
        currentPath: `blog/${article.slug}.html`,
        pageTitle: article.title + ' — RealText Blog',
        pageDescription: article.description,
        ogTitle: article.title,
        ogDescription: article.description,
        hreflangTags: artHreflang,
        langSwitcher: buildLangSwitcher(lang, `blog/${article.slug}.html`),
        article: article,
        relatedArticles: relatedArticles,
        languageLinks: languageLinks,
        isEn: lang === 'en',
        isIt: lang === 'it',
        isEs: lang === 'es',
        isDe: lang === 'de',
        isFr: lang === 'fr',
        isPt: lang === 'pt'
      });
      const articleHtml = renderTemplate(articleTpl, articleVars);
      validateHtml(articleHtml, `/${lang}/blog/${article.slug}.html`);
      writeFile(`${lang}/blog/${article.slug}.html`, articleHtml);
      log(`/${lang}/blog/${article.slug}.html`);

      sitemapUrls.push({
        loc: `${BASE_URL}/${lang}/blog/${article.slug}.html`,
        lastmod: article.date,
        changefreq: 'monthly',
        priority: '0.6'
      });
    }
  }

  // ─── Sitemap ─────────────────────────────────────────────────────────────
  const sitemapXml = generateSitemap(sitemapUrls);
  writeFile('sitemap.xml', sitemapXml);
  log(`/sitemap.xml (${sitemapUrls.length + 1} URLs)`);

  // ─── robots.txt ──────────────────────────────────────────────────────────
  const robotsTxt = `User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /api\nDisallow: /assets/\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;
  writeFile('robots.txt', robotsTxt);
  log('/robots.txt');

  // ─── Copy shared CSS ─────────────────────────────────────────────────────
  const sharedSrc = path.join(SRC_DIR, 'shared', 'styles.css');
  const sharedDest = path.join(OUT_DIR, 'shared', 'styles.css');
  fs.mkdirSync(path.dirname(sharedDest), { recursive: true });
  fs.copyFileSync(sharedSrc, sharedDest);
  log('/shared/styles.css');

  // ─── Summary ─────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  if (errorCount > 0) {
    console.error(`\n[build] ✗ Build completed with ${errorCount} error(s) and ${warnCount} warning(s) in ${elapsed}s`);
    process.exit(1);
  } else {
    console.log(`\n[build] Build complete in ${elapsed}s` + (warnCount > 0 ? ` (${warnCount} warnings)` : ''));
  }
}

main();
