# `js-bank-statement-categorizer`

This service is to categorize the bank statement transactions by trained model.

## Supported banks

| Bank     | Statement format | Date format  |
|----------|-----------------|--------------|
| ASB      | CSV             | `YYYY/MM/DD` |
| ANZ      | CSV             | `DD/MM/YYYY` |
| Kiwibank | CSV             | `YYYY-MM-DD` |

Pass the bank via the `bank` query parameter when calling `POST /upload` (e.g. `?bank=kiwibank`). Each bank requires its own trained ONNX model in `models/` (e.g. `kiwibank_transaction_classifier.onnx`).

## Update model

You need to regenerate a model by `transaction-modeller`, then run script `get-models.sh` to copy the trained model in here.

## Commands

1, Build base image at root

```sh
docker build -f Dockerfile -t base .
```

2, Build categorizer image

```sh
docker build -t js-bank-statement-categorizer .
```
