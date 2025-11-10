FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
WORKDIR /app/packages/server
RUN bun install

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/server ./

# Expose port
EXPOSE 3000

# Start the server
CMD ["bun", "run", "src/index.ts"]