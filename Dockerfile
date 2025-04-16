FROM node:20-slim AS base

WORKDIR /app

# Copy root config files
COPY package.json yarn.lock ./
COPY tsconfig.base.json ./

# Install root dependencies
RUN yarn install --frozen-lockfile

# Copy all packages (including their tsconfig.json files)
COPY packages/ ./packages/