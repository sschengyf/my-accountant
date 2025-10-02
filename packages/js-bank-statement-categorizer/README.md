# `js-bank-statement-categorizer`

This service is to categorize the bank statement transactions by trained model.

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
