# Transaction Modeller

Trains a per-bank ML classifier on labelled transaction data and exports it to ONNX for use by `js-bank-statement-categorizer`.

## Supported banks

- `asb`
- `anz`
- `kiwibank`

## Workflow

1. Place a labelled CSV in `notebooks/data/<bank>-labelled-YYYY-MM.csv` with columns: `Category`, `Payee`, `Memo`, `Tran Type`
2. Run the notebook and enter the bank name when prompted (e.g. `kiwibank`)
3. Copy the output models to the categorizer:
   ```sh
   cp notebooks/models/<bank>_transaction_classifier.onnx ../js-bank-statement-categorizer/models/
   cp notebooks/models/<bank>_transaction_categories.json ../js-bank-statement-categorizer/models/
   ```

## Commands

### Build docker image

```sh
docker build -t transaction-modeller .
```

### Run docker container with prior image

```sh
docker run -p 8989:8888 --rm -v $(pwd)/notebooks:/home/jovyan/work transaction-modeller
```
