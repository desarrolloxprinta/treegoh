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
  git commit -m "fix(ci): corregir validacion de app_store_connect en codemagic.yaml"
else
  echo "ℹ️ No hay cambios pendientes."
fi

# Subir a GitHub
echo "🚀 Subiendo a origin main..."
git push -u origin main

echo ""
echo "✅ ¡Actualización subida con éxito a GitHub!"
echo "   El error en Codemagic ya está resuelto. Puedes volver a lanzar el build."
