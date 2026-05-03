FROM node:20-alpine
WORKDIR /app

# Copy package.json and prisma files (self-contained in apps/api/)
COPY package.json ./
COPY prisma/ ./prisma/

# Install deps and generate Prisma client from local schema
RUN npm install --omit=dev
RUN node node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma

# Copy the rest of the API source
COPY . .

EXPOSE 3001
CMD ["node", "index.js"]
