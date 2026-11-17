#!/usr/bin/env bash
# ==========================================================
# Proyecto final - DAST con OWASP ZAP (Docker)
#
# Uso (desde backend/, con la API y el frontend corriendo):
#   DAST_EMAIL=auditor@... DAST_PASSWORD=... bash scripts/dast-zap.sh [salida]
#
# - API scan: importa /openapi.json y ataca cada endpoint con
#   un JWT de AUDITOR (puede leer todo, pero el servidor le
#   rechaza cualquier escritura: el escaneo activo no altera datos).
# - Baseline: araña el frontend y revisa cabeceras y respuestas
#   de forma pasiva.
# Para que el rate limit no tape los resultados, la API se inicia
# con RATE_LIMIT_GLOBAL alto SOLO en local durante el escaneo.
# ==========================================================
set -euo pipefail

SALIDA="${1:-despues}"
RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
TRABAJO="$RAIZ/reportes/tmp/zap"
DESTINO="$RAIZ/reportes/$SALIDA"
API_HOST="http://host.docker.internal:3000"
FE_HOST="${FE_URL:-http://host.docker.internal:5173}"
IMAGEN="ghcr.io/zaproxy/zaproxy:stable"

: "${DAST_EMAIL:?Defina DAST_EMAIL (usuario auditor)}"
: "${DAST_PASSWORD:?Defina DAST_PASSWORD}"

mkdir -p "$TRABAJO" "$DESTINO"
chmod 777 "$TRABAJO"

TOKEN="$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  --data "$(node -e 'console.log(JSON.stringify({email:process.env.DAST_EMAIL,password:process.env.DAST_PASSWORD}))')" \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).token||""))')"

if [ -z "$TOKEN" ]; then
  echo "No se obtuvo el JWT del auditor" >&2
  exit 1
fi

# El replacer de ZAP agrega Authorization a todas las peticiones.
AUTH="-config replacer.full_list(0).description=jwt \
 -config replacer.full_list(0).enabled=true \
 -config replacer.full_list(0).matchtype=REQ_HEADER \
 -config replacer.full_list(0).matchstr=Authorization \
 -config replacer.full_list(0).regex=false \
 -config replacer.full_list(0).replacement=Bearer\ $TOKEN"

echo "== ZAP API scan (OpenAPI, activo)"
docker run --rm -v "$TRABAJO":/zap/wrk:rw "$IMAGEN" zap-api-scan.py \
  -t "$API_HOST/openapi.json" -f openapi -O "$API_HOST" \
  -r dast-zap-api.html -J dast-zap-api.json -w dast-zap-api.md \
  -z "$AUTH" -I || true

echo "== ZAP baseline (frontend, pasivo)"
docker run --rm -v "$TRABAJO":/zap/wrk:rw "$IMAGEN" zap-baseline.py \
  -t "$FE_HOST" -j -m 2 \
  -r dast-zap-frontend.html -J dast-zap-frontend.json -w dast-zap-frontend.md -I || true

# Nunca guardar el JWT en las evidencias.
for archivo in "$TRABAJO"/dast-zap-*; do
  TOKEN="$TOKEN" node -e '
    const fs=require("fs"); const f=process.argv[1];
    let t=fs.readFileSync(f,"utf8").split(process.env.TOKEN).join("<JWT_REDACTADO>");
    t=t.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/g,"<JWT_REDACTADO>");
    fs.writeFileSync(f,t);' "$archivo"
  cp "$archivo" "$DESTINO/"
done

echo "Reportes en reportes/$SALIDA/"
