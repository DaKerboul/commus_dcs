# Étape de build
FROM node:18-alpine as build-stage
WORKDIR /app

# Copier package.json et package-lock.json (si existant)
COPY package*.json ./
RUN npm install

# Copier les sources
COPY . .

# Construire le site
RUN npm run docs:build

# Étape de production avec Nginx
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/docs/.vitepress/dist /usr/share/nginx/html
# Configuration Nginx par défaut
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
