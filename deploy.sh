#!/bin/bash

# Définir le répertoire de travail
WORKING_DIR="$(dirname "$(readlink -f "$0")")"
cd "$WORKING_DIR" || exit 1

echo "📦 Mise à jour du code depuis le dépôt distant..."
git fetch origin
git reset --hard origin/main

echo "🔄 Redémarrage des conteneurs avec docker-compose..."
docker compose down

# Construction avec des options pour limiter la mémoire et optimiser le build
echo "🔨 Construction des conteneurs..."
DOCKER_BUILDKIT=1 docker compose build --progress=plain

echo "🚀 Démarrage des conteneurs..."
docker compose up -d

echo "✅ Déploiement terminé avec succès!"
echo "Le site est maintenant accessible."
