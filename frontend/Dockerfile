# Étape 1 : compilation de l'interface Angular
FROM node:20-alpine AS build
WORKDIR /app
ENV NG_CLI_ANALYTICS=false
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npx ng build --configuration production

# Étape 2 : service des fichiers par Nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/logistock/browser /usr/share/nginx/html
EXPOSE 80
