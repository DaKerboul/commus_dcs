# Dockerfile pour builder et servir le frontend VitePress
FROM node:20-alpine as build
WORKDIR /app
COPY package.json ./
COPY docs ./docs
RUN npm install && npm run docs:build

FROM nginx:alpine as prod
WORKDIR /usr/share/nginx/html
COPY --from=build /app/docs/.vitepress/dist .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
