#Install dependencies only when needed
FROM node:22.14.0-alpine3.21 AS deps
WORKDIR /nextjs/bhsl-webapp
RUN corepack enable pnpm

COPY .npmrc package.json pnpm-lock.yaml ./
RUN apk add --no-cache openssl3
RUN pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM node:22.14.0-alpine3.21 AS builder
WORKDIR /nextjs/bhsl-webapp
RUN corepack enable pnpm

COPY . .
COPY --from=deps /nextjs/bhsl-webapp/node_modules ./node_modules

# Production image, copy all the files and run next
FROM node:22.14.0-alpine3.21 AS runner
WORKDIR /nextjs/bhsl-webapp
RUN corepack enable pnpm

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S webapp -u 1001
RUN chown -R webapp:nodejs /nextjs/bhsl-webapp ./
COPY --from=builder --chown=webapp:nodejs /nextjs/bhsl-webapp/ ./

USER webapp
EXPOSE 3000
CMD ["pnpm", "start:prod"]
