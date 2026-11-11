#!/usr/bin/env bash
cd "$(dirname "$0")"

echo "🔐 Generando CERTIFICATE_PRIVATE_KEY (RSA 2048 bits) para Codemagic..."
openssl genrsa -out cert_key.pem 2048

echo ""
echo "================================================================================"
echo "TU CERTIFICATE_PRIVATE_KEY ES ESTA (Copia todo el bloque siguiente):"
echo "================================================================================"
cat cert_key.pem
echo "================================================================================"
echo ""
echo "✅ También ha quedado guardada en el archivo 'cert_key.pem' en este directorio."
echo "   Puedes abrir 'cert_key.pem' en tu editor, copiarlo y pegarlo en Codemagic."

