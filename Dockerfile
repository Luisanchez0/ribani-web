# syntax=docker/dockerfile:1
# Imagen de producción del panel web RIBANI (React 19 + Vite).
# Se construye desde la raíz del repo: docker build -t ribani-web .
#
# VITE_API_URL se incrusta en el bundle en tiempo de build: si la URL de la API
# cambia, hay que reconstruir la imagen.

FROM node:24-bookworm-slim AS build
WORKDIR /app

ENV NPM_CONFIG_FETCH_RETRIES=5 \
    NPM_CONFIG_FETCH_RETRY_MAXTIMEOUT=120000 \
    NPM_CONFIG_FETCH_RETRY_MINTIMEOUT=20000 \
    NPM_CONFIG_MAXSOCKETS=4

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

# `src/config/env.ts` aborta en producción si la URL no es HTTPS; fallar aquí
# evita publicar un bundle que no arranca.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN case "$VITE_API_URL" in \
      https://*) ;; \
      *) echo "VITE_API_URL debe ser una URL https:// (recibido: '$VITE_API_URL')." >&2; exit 1 ;; \
    esac
RUN npm run build

FROM nginx:1.29-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
