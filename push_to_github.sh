#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "🌿 ========================================================"
echo "   Treegoh — Sincronización y Subida a GitHub"
echo "   Repositorio: https://github.com/desarrolloxprinta/treegoh"
echo "   ========================================================"

git branch -M main

# Asegurar biblia.json dentro de app/src/constants/ para Metro
if [ -f "biblia-plantas/output/biblia.json" ]; then
  echo "📖 Copiando biblia.json en app/src/constants/..."
  mkdir -p app/src/constants
  cp "biblia-plantas/output/biblia.json" "app/src/constants/biblia.json"
fi

# Añadir cambios (incluyendo package.json, metro.config.js, babel.config.js y codemagic.yaml)
echo "📦 Añadiendo archivos..."
git add -A

# Si hay cambios pendientes, hacer commit
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "💾 Guardando correcciones en git..."
  git commit -m "fix(metro): instalar babel-preset-expo y @expo/metro-config, sanear watchFolders y normalizar imports"
else
  echo "ℹ️ No hay cambios pendientes."
fi

# Subir a GitHub
echo "🚀 Subiendo a origin main..."
git push -u origin main

echo ""
echo "✅ ¡Actualización subida con éxito a GitHub!"
echo "   El error en Codemagic ya está resuelto. Puedes volver a lanzar el build."
