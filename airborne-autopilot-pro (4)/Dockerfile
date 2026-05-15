FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG VITE_API_URL=http://localhost:5001
ARG VITE_GOOGLE_MAPS_KEY=AIzaSyDEpy_UKoOH2NSjpNf_RfJFXjpYDXGQs5U

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_MAPS_KEY=${VITE_GOOGLE_MAPS_KEY}

RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3001 || exit 1

CMD ["serve", "-s", "dist", "-l", "3001"]
