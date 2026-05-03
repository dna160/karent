FROM node:20-alpine
WORKDIR /app

# Build context is the repo root; prefix paths with apps/api/
COPY apps/api/package.json ./
COPY apps/api/prisma/ ./prisma/

RUN npm install --omit=dev
RUN node node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

COPY apps/api/ .

EXPOSE 3001
CMD ["node", "index.js"]
