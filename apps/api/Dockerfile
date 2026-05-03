FROM node:20-alpine
WORKDIR /app

# Copy package.json and prisma schema first (for layer caching)
COPY apps/api/package.json ./
COPY prisma/ ./prisma/

# Install deps and generate Prisma client
RUN npm install --omit=dev
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy the rest of the API source
COPY apps/api/ .

EXPOSE 3001
CMD ["node", "index.js"]
