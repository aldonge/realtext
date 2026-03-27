# TestoReale

Analisi stilistica del testo — il tuo testo è autentico?

## Quick Start

```bash
git clone https://github.com/youruser/testoreale.git
cd testoreale
bash setup.sh
```

## Requirements

- Docker + Docker Compose v2
- Git

## Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: FastAPI (Python) + NLTK
- **LLM**: OpenRouter (free models, graceful degradation)
- **Proxy**: Nginx
- **Tunnel**: Cloudflare (optional)

## How It Works

1. Paste your text (min 50 characters)
2. The backend analyzes it with algorithmic metrics (no AI involved in scoring)
3. A circular gauge shows a 0-100 score (0 = AI, 100 = Human)
4. An LLM provides actionable suggestions to make the text sound more natural
5. If the LLM is unavailable, fallback suggestions based on metrics are shown

## Deploy to Production

1. Setup a VM (Ubuntu 22.04+)
2. Install Docker: `curl -fsSL https://get.docker.com | sh`
3. Clone, run `bash setup.sh`
4. Configure Cloudflare Tunnel for HTTPS
