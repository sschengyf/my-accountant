FROM base AS builder

WORKDIR /app/packages/js-slack-bot
RUN yarn workspace js-slack-bot install

ENV NODE_ENV=production
RUN yarn workspace js-slack-bot build

FROM node:20-alpine AS production
WORKDIR /app

ARG PORT=3002

EXPOSE ${PORT}

# Add any required ENV variables
ENV NODE_ENV=production PORT=${PORT}

# Copy only production necessary files
COPY --from=builder /app/packages/js-slack-bot/package.json .
COPY --from=builder /app/packages/js-slack-bot/dist/ ./dist/
COPY --from=builder /app/node_modules/ ./node_modules/

CMD ["node", "dist/index.js"]
