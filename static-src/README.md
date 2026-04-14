# Static Site Build System

## Architettura

Template HTML (`templates/`) + JSON traduzioni (`translations/`) + script Node (`build.js`) = cartella `static/` generata.

Il build avviene **dentro Docker** (multi-stage Dockerfile), non sull'host. Non serve Node installato sulla macchina.

## Comando build (uno solo)

```bash
docker compose up -d --build nginx
```

Esegue il build dentro Docker, nessun Node sull'host.

## Modificare le traduzioni

1. Edit `static-src/translations/{lang}.json`
2. `docker compose up -d --build nginx`
3. `git add static-src/ static/ && git commit && git push`

## Aggiungere un articolo blog

1. Crea `static-src/articles/{lang}/nuovo-slug.json` con la struttura:
   ```json
   {
     "slug": "nuovo-slug",
     "lang": "it",
     "title": "Titolo articolo",
     "description": "Meta description...",
     "date": "2026-04-14",
     "minRead": 5,
     "bodyHtml": "<h1>Titolo</h1><p>Contenuto...</p>"
   }
   ```
2. Se è una traduzione di un articolo esistente, aggiorna `static-src/articles-meta.json` spostandolo da `standalone` a `translationGroups`
3. `docker compose up -d --build nginx`
4. `git add static-src/ static/ && git commit && git push`

## Aggiungere una nuova lingua (futuro)

1. Crea `static-src/translations/{lang}.json` con stessa struttura di `en.json`
2. Modifica `build.js`: aggiungi `'xx'` all'array `LANGUAGES`
3. Aggiorna `nginx/nginx.conf`: aggiungi `'xx'` al regex `location ~ ^/(en|it|...|xx)/`
4. `docker compose up -d --build nginx`

## Cosa NON modificare a mano

- `static/{lang}/` — tutto auto-generato dal build
- `static/sitemap.xml` — auto-generato
- `static/robots.txt` — auto-generato
- `static/shared/styles.css` — copiato da `static-src/shared/`

## Cosa modificare per cambiare contenuti

- `static-src/translations/*.json` — testi UI
- `static-src/articles/{lang}/*.json` — articoli blog
- `static-src/templates/*.html` — struttura HTML
- `static-src/shared/styles.css` — CSS condiviso

## Workflow di rollback

```bash
git checkout static/ static-src/ nginx/ docker-compose.yml
docker compose up -d --build nginx
```

## Debug del build

Per vedere l'output di Node durante il build:

```bash
docker compose build nginx --progress=plain --no-cache
```
