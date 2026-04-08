#!/bin/bash

BANKS=("${@}")

if [ ${#BANKS[@]} -eq 0 ]; then
  echo "Usage: $0 <bank> [bank...] (e.g. asb anz)"
  exit 1
fi

for BANK in "${BANKS[@]}"; do
  cp -f "../transaction-modeller/notebooks/models/${BANK}_transaction_categories.json" ./models/
  cp -f "../transaction-modeller/notebooks/models/${BANK}_transaction_classifier.onnx" ./models/
  echo "Models copied for bank: $BANK"
done