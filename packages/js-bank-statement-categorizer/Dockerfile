FROM base AS builder

WORKDIR /app/packages/js-bank-statement-categorizer
RUN yarn workspace js-bank-statement-categorizer install

ENV NODE_ENV=production
RUN yarn workspace js-bank-statement-categorizer build

# Pre-download the sentence transformer model into /app/.cache
WORKDIR /app
RUN node packages/js-bank-statement-categorizer/scripts/download-model.js

FROM node:20-slim AS production
WORKDIR /app

ARG PORT=3001

EXPOSE ${PORT}

# Add any required ENV variables
ENV NODE_ENV=production PORT=${PORT} TRANSFORMERS_CACHE=/app/.cache

# Copy only production necessary files
COPY --from=builder /app/packages/js-bank-statement-categorizer/package.json .
COPY --from=builder /app/packages/js-bank-statement-categorizer/dist/ ./dist/
COPY --from=builder /app/packages/js-bank-statement-categorizer/models/ ./models/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/.cache/ ./.cache/

CMD ["node", "dist/index.js"]
