FROM node:22-alpine AS builder
WORKDIR /app

COPY admin/package*.json ./
RUN npm ci

COPY admin/ .

ARG NEXT_PUBLIC_API_URL
ARG ADMIN_API_TOKEN
ARG ADMIN_SECRET
ARG ADMIN_PASSWORD

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV ADMIN_API_TOKEN=$ADMIN_API_TOKEN
ENV ADMIN_SECRET=$ADMIN_SECRET
ENV ADMIN_PASSWORD=$ADMIN_PASSWORD

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY admin/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

EXPOSE 3001

CMD ["node_modules/.bin/next", "start", "-p", "3001"]
