# Dockerfile for a Next.js application

# Builder stage
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm build

# Final stage
FROM node:20-slim AS runner

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# Install production dependencies
RUN npm install -g pnpm && pnpm install --prod

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["next", "build"]
    