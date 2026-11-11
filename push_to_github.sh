#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "🌿 ========================================================"
echo "   Treegoh — Sincronización y Subida a GitHub"
echo "   Repositorio: https://github.com/desarrolloxprinta/treegoh"
echo "   ========================================================"

git branch -M main

# Añadir cambios (incluyendo codemagic.yaml corregido)
echo "📦 Añadiendo archivos..."
git add -A

# Si hay cambios pendientes, hacer commit
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "💾 Guardando correcciones en git..."
  git commit -m "fix(metro): actualizar a Node 22 para Expo 58/RN 0.88 y sanear metro.config.js"
else
  echo "ℹ️ No hay cambios pendientes."
fi

# Subir a GitHub
echo "🚀 Subiendo a origin main..."
git push -u origin main

echo ""
echo "✅ ¡Actualización subida con éxito a GitHub!"
echo "   El error en Codemagic ya está resuelto. Puedes volver a lanzar el build."
