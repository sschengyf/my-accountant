# Bank Statement Labeller

A processor to label the bank statement based on my existing ledger.

## Usage

```bash
yarn install
yarn label-bank-statement <BANK_NAME> <STATEMENT_FILE> <LEDGER_FILE> -o <OUTPUT_FILE>
```

## Supported banks

- `ASB`
- `ANZ`
- `KIWIBANK`

## Example

```bash
yarn label-bank-statement ASB statement.csv ledger.csv -o asb-statement-labelled.csv
yarn label-bank-statement ANZ statement.csv ledger.csv -o anz-statement-labelled.csv
yarn label-bank-statement KIWIBANK statement.csv ledger.csv -o kiwibank-statement-labelled.csv
```

## File format

The ledger file is a Money Wiz CSV export. Rows are matched against the bank statement by **date and amount** (exact match on both).

| Bank     | Statement date format | Ledger date format |
|----------|-----------------------|--------------------|
| ASB      | `YYYY/MM/DD`          | `YYYY/MM/DD`       |
| ANZ      | `DD/MM/YYYY`          | `YYYY/MM/DD`       |
| KIWIBANK | `YYYY-MM-DD`          | `YYYY/MM/DD`       |

Transactions that have no matching ledger entry will have an empty `Category` column in the output and must be labelled manually.
