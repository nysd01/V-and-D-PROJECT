# ── Stage 1: Build the Expo web app ──────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ENV EXPO_PUBLIC_API_URL=http://38.242.246.126/api

RUN npx expo export --platform web --output-dir dist

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
