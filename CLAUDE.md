# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Install dependencies
```sh
yarn install
```

### Develop (hot reload with nodemon + ts-node)
```sh
# Categorizer service (port 3001)
yarn workspace js-bank-statement-categorizer dev

# Slack bot (port 3002)
yarn workspace js-slack-bot dev
```

### Build TypeScript packages
```sh
yarn workspace js-bank-statement-categorizer build
yarn workspace js-slack-bot build
```

### Run labeller CLI
```sh
yarn workspace js-bank-statement-labeller label-bank-statement ASB <statement.csv> <ledger.csv> -o <output.xlsx>
```

### Build Docker images
```sh
# Base image (must be built first)
yarn build:image:base

# Service images
yarn build:image:js-bank-statement-categorizer
yarn build:image:js-slack-bot
```

### Transaction modeller (Jupyter, Docker only)
```sh
cd packages/transaction-modeller
docker build -t transaction-modeller .
docker run -p 8989:8888 --rm -v $(pwd)/notebooks:/home/jovyan/work transaction-modeller
# Access at http://localhost:8989
```

## Architecture

This is a Lerna monorepo with Yarn workspaces. Lerna only manages the `packages/js-*` packages (not `transaction-modeller`). Node modules are hoisted to the root.

### Pipeline overview

```
ASB bank statement (Excel)
  → [optional] js-bank-statement-labeller  — copies categories from existing ledger by date+amount match
  → js-bank-statement-categorizer          — ML inference → Money Wiz CSV
  → js-slack-bot                           — Slack UI: receives upload, calls categorizer, posts CSV back
```

### js-bank-statement-categorizer

Express API on port 3001. Key design points:

- `POST /upload` accepts a multipart Excel file (ASB format), skips rows until after the "Ledger Balance" header row, then calls `categorizeStatementData` → `generateMoneyWizCSV` → returns CSV.
- `categorizer.ts`: Loads the ONNX model and category mappings at module init time (top-level async IIFE). The sentence embedder (`Xenova/all-MiniLM-L6-v2`) is initialized as a module-level promise and `await`ed inside the export function — this avoids re-initializing on every request.
- `money-wiz-file-generator.ts`: Maps ASB fields to Money Wiz CSV columns. Hardcodes `Account: 'ASB Functor Limited'`, `Currency: 'NZD'`, `Time: '9:00 AM'`. Prepends `sep=,` as the first row for Excel compatibility.
- Trained models live in `packages/js-bank-statement-categorizer/models/` (`transaction_classifier.onnx` + `transaction_categories.json`). These are checked in and referenced relative to `__dirname`.

### js-slack-bot

Slack Bolt app on port 3002. Requires ngrok for local Slack webhook delivery.

- `file_shared` event: downloads file from Slack, saves to `files/`, POSTs to categorizer, uploads resulting CSV back to the same channel, then deletes the temp file.
- Skips files uploaded by the bot itself (prevents loops).
- GCP auth: when `DEPLOYMENT_ENV=gcp`, fetches a Google Cloud identity token for IAM-authenticated calls to Cloud Run (`google-auth-library`).

Required env vars (copy from `.env.example`):
```
SLACK_BOT_TOKEN
SLACK_SIGNING_SECRET
CATEGORIZER_API_URL
DEPLOYMENT_ENV   # "local" or "gcp"
```

### js-bank-statement-labeller

CLI only (no server). Reads ASB bank statement Excel (skipping first 6 rows) and a ledger Excel, matches rows by `Date` + `Amount`, copies the `Category` column into the bank statement rows, writes a new Excel file.

### transaction-modeller

Python Jupyter environment (Docker only). Trains a scikit-learn classifier on labeled transaction data using `sentence-transformers` embeddings, exports to ONNX via `skl2onnx`. The exported model and category JSON are then copied to `js-bank-statement-categorizer/models/` to update production inference.

- Main notebook: `notebooks/ml-train-models.ipynb`. Set `bank = 'asb'` or `bank = 'anz'` in the config cell, then run all cells. Outputs `models/{bank}_transaction_classifier.onnx` + `models/{bank}_transaction_categories.json`.

### TypeScript config

All packages extend `tsconfig.base.json` (CommonJS, ES2017 target, strict but `noImplicitAny: false`). Each package compiles to its own `dist/` directory.
