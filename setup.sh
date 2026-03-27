#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       TestoReale — Setup Script       ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}[ERROR] $1 non trovato. Installalo prima di procedere.${NC}"
        exit 1
    fi
    echo -e "${GREEN}[OK] $1 trovato${NC}"
}

echo ""
echo "Verifica prerequisiti..."
check_command docker
check_command git

if docker compose version &> /dev/null; then
    echo -e "${GREEN}[OK] docker compose v2 trovato${NC}"
else
    echo -e "${RED}[ERROR] docker compose v2 non trovato.${NC}"
    echo "Installa Docker con: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if [ ! -f .env ]; then
    echo ""
    echo -e "${YELLOW}File .env non trovato. Configurazione interattiva:${NC}"
    echo ""

    read -p "OpenRouter API Key (sk-or-..., lascia vuoto per funzionare senza LLM): " OPENROUTER_API_KEY
    read -p "Cloudflare Tunnel Token (lascia vuoto se non usi tunnel): " CLOUDFLARE_TUNNEL_TOKEN
    read -p "Dominio (es. testoreale.com, lascia vuoto per localhost): " DOMAIN

    ADMIN_SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '=/+' | head -c 32)

    cat > .env << EOF
# OpenRouter
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}

# Cloudflare Tunnel (lascia vuoto se non usi tunnel)
CLOUDFLARE_TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}

# App Config
RATE_LIMIT_PER_DAY=3
MAX_TEXT_LENGTH=10000
ADMIN_SECRET=${ADMIN_SECRET}

# Domain
DOMAIN=${DOMAIN:-localhost}
EOF

    echo -e "${GREEN}[OK] .env generato${NC}"
else
    echo -e "${GREEN}[OK] .env esistente trovato${NC}"
fi

mkdir -p data

echo ""
echo "Build in corso (puo richiedere qualche minuto la prima volta)..."
docker compose down -v 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

echo ""
echo "Attendo che il servizio sia pronto..."
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -sf http://localhost:8080/api/health > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║      TestoReale e' ONLINE!            ║${NC}"
        echo -e "${GREEN}╠══════════════════════════════════════╣${NC}"
        echo -e "${GREEN}║  Locale: http://localhost:8080        ║${NC}"
        if [ -n "$CLOUDFLARE_TUNNEL_TOKEN" ] && [ "$CLOUDFLARE_TUNNEL_TOKEN" != "" ]; then
            DOMAIN_VAL=$(grep DOMAIN .env | cut -d= -f2)
            echo -e "${GREEN}║  Pubblico: https://${DOMAIN_VAL}  ║${NC}"
        fi
        echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"
        echo ""
        echo "Admin secret: $(grep ADMIN_SECRET .env | cut -d= -f2)"
        echo "Comandi utili:"
        echo "  docker compose logs -f    # Vedi i log"
        echo "  docker compose down       # Ferma tutto"
        echo "  docker compose up -d      # Riavvia"
        exit 0
    fi
    RETRY=$((RETRY + 1))
    echo -n "."
    sleep 2
done

echo ""
echo -e "${RED}[ERROR] Il servizio non risponde dopo 60 secondi.${NC}"
echo "Controlla i log con: docker compose logs"
exit 1
