# Étape de build
FROM node:18-alpine as build-stage
WORKDIR /app

# Augmenter la mémoire disponible pour Node.js
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copier package.json et package-lock.json (si existant)
COPY package*.json ./
RUN npm install --no-audit --no-fund --quiet

# Copier les sources
COPY . .

# Construire le site avec une option plus silencieuse
RUN npm run docs:build-silent || (echo "Build failed. Trying with reduced memory usage..." && NODE_OPTIONS="--max-old-space-size=256" npm run docs:build-silent)

# Étape de production avec Nginx
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/docs/.vitepress/dist /usr/share/nginx/html
# Configuration Nginx par défaut
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
