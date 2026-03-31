#!/bin/bash

# Copy model files from transaction-modeller
cp -f ../transaction-modeller/notebooks/models/transaction_categories.json ./models/
cp -f ../transaction-modeller/notebooks/models/transaction_classifier.onnx ./models/

echo "Models copied successfully!"