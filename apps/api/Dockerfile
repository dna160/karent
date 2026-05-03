FROM node:20-alpine
WORKDIR /app

# openssl is required so Prisma can detect the version and use the correct engine binary
RUN apk add --no-cache openssl

# Build context is the repo root; prefix paths with apps/api/
COPY apps/api/package.json ./
COPY apps/api/prisma/ ./prisma/

RUN npm install --omit=dev
RUN node node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma
RUN mkdir -p /app/config/accounts

COPY apps/api/ .

EXPOSE 3001
CMD ["node", "index.js"]
