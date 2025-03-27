import * as fs from 'fs';
import * as ort from 'onnxruntime-node';
import { pipeline } from '@xenova/transformers';

// Load classifier ONNX model
let transaction_classifier: ort.InferenceSession;
(async () => {
  transaction_classifier = await ort.InferenceSession.create(
    'models/transaction_classifier.onnx'
  );
})();

// Load category mappings
const categories: string[] = JSON.parse(
  fs.readFileSync('models/transaction_categories.json', 'utf8')
);

// Load Sentence Transformer model
let embedder: any;
(async () => {
  embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
})();

export const categorizeStatementData = async (data) => {
  const requiredColumns = ['Payee', 'Memo', 'Tran Type'];
  if (!requiredColumns.every((col) => col in data[0])) {
    throw new Error('Missing required columns in data.');
  }

  const transactionContexts = data.map(
    (row) =>
      `${row.Payee.trim()} ${row.Memo?.trim() || ''} ${
        row['Tran Type']?.trim() || ''
      }`
  );

  const embeddings = await embedder(transactionContexts, {
    pooling: 'mean',
    normalize: true,
  });

  // Convert embeddings to tensor for ONNX
  const inputTensor = new ort.Tensor(
    embeddings.type,
    embeddings.data,
    embeddings.dims
  );

  // Run classification
  const result = await transaction_classifier.run({
    float_input: inputTensor,
  });

  const {
    label: { cpuData: labelData },
    probabilities: {
      cpuData: probabilitiesData,
      dims: [_numTransactions, numCategories],
    },
  } = result;

  data.forEach((row, i) => {
    const category = labelData[i];
    const probabilities = probabilitiesData.slice(
      i * numCategories,
      (i + 1) * numCategories - 1
    );
    row['Predicted Category'] = category || 'Uncategorized';
    row['Probability'] = Math.max(...probabilities);
  });

  return data;
};
