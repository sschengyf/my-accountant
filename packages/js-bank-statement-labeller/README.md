# Bank Statement Labeller

A processor to label the bank statement based on my existing ledger.

## Usage

```bash
yarn install
yarn label-bank-statement <BANK_NAME> <STATEMENT_FILE> <LEDGER_FILE> -o <OUTPUT_FILE>
```

## Example

```bash
yarn label-bank-statement asb statement.xlsx ledger.xlsx -o asb-statement-labelled.xlsx
```
