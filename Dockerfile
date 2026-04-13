# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM caddy:2-alpine
COPY --from=build /build/dist/dawn/browser /srv
# Caddyfile is bind-mounted from ohsheet-infra at runtime, NOT baked in
