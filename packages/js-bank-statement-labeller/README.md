# Bank Statement Labeller

A processor to label the bank statement based on my existing ledger.

## Usage

```bash
yarn install
yarn label-bank-statement <BANK_NAME> <STATEMENT_FILE> <LEDGER_FILE> -o <OUTPUT_FILE>
```

## Example

```bash
yarn label-bank-statement asb statement.csv ledger.csv -o asb-statement-labelled.csv
```

## File format

Both the bank statement and ledger files must use `YYYY/MM/DD` for the `Date` column. The ledger file also includes a `Time` column in `H:MM AM/PM` format. Rows are matched by exact string equality on `Date` and `Amount`, so the date format must be consistent across both files.
