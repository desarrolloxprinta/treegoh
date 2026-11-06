#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

echo "🌿 ========================================================"
echo "   Treegoh — Sincronización y Subida a GitHub"
echo "   Repositorio: https://github.com/ruyx/treegoh"
echo "   ========================================================"

# 1. Asegurar rama main
git branch -M main

# 2. Si el último commit fue el que contenía las claves bloqueadas por GitHub, deshacerlo conservando cambios
LAST_COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")
if [[ "$LAST_COMMIT_MSG" == *"preparar Treegoh para Codemagic"* ]]; then
  echo "🧹 Deshaciendo el commit bloqueado para regenerarlo 100% limpio..."
  git reset --soft HEAD~1
fi

# 3. Añadir todos los archivos limpios (código saneado, variables seguras en .env ignorado)
echo "📦 Añadiendo archivos limpios..."
git add -A

# 4. Crear commit definitivo sin secretos
echo "💾 Creando commit limpio para GitHub..."
git commit -m "feat: preparar Treegoh para Codemagic CI/CD y Apple TestFlight"

# 5. Subir a GitHub
echo "🚀 Subiendo a origin main..."
git push -u origin main

echo ""
echo "✅ ¡Todo el código se ha subido correctamente a GitHub sin secretos!"
echo "   Ya puedes ir a Codemagic a iniciar la compilación para TestFlight."
