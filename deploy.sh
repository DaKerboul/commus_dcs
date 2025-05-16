#!/bin/bash

# Définir le répertoire de travail
WORKING_DIR="$(dirname "$(readlink -f "$0")")"
cd "$WORKING_DIR" || exit 1

echo "📦 Mise à jour du code depuis le dépôt distant..."
git fetch origin
git reset --hard origin/main

echo "🔄 Redémarrage des conteneurs avec docker-compose..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ Déploiement terminé avec succès!"
echo "Le site est maintenant accessible."
