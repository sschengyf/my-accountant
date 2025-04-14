# my-monorepo/packages/js-bank-statement-categorizer/Dockerfile
FROM base AS builder

WORKDIR /app/packages/js-bank-statement-categorizer
RUN yarn workspace js-bank-statement-categorizer install

ENV NODE_ENV=production
RUN yarn workspace js-bank-statement-categorizer build

FROM node:20-slim AS production
WORKDIR /app

# Add any required ENV variables
ENV NODE_ENV=production PORT=3000

# Copy only production necessary files
COPY --from=builder /app/packages/js-bank-statement-categorizer/package.json .
COPY --from=builder /app/packages/js-bank-statement-categorizer/dist/ ./dist/
COPY --from=builder /app/node_modules/ ./node_modules/

CMD ["node", "dist/index.js"]
