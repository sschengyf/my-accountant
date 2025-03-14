#!/bin/bash

# Copy model files from transaction-modeller
cp -f ../transaction-modeller/notebooks/models/transaction_classifier.onnx ./models/
cp -f ../transaction-modeller/notebooks/models/transaction_faiss.index ./models/
cp -f ../transaction-modeller/notebooks/models/transaction_categories.json ./models/

echo "Models copied successfully!"