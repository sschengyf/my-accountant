import * as fs from 'fs';
import * as path from 'path';
import * as ort from 'onnxruntime-node';
import { pipeline } from '@xenova/transformers';
import { ASBTransaction, ASBTransactionCategorized } from './types';

// Load classifier ONNX model
let transaction_classifier: ort.InferenceSession;
(async () => {
  transaction_classifier = await ort.InferenceSession.create(
    path.join(__dirname, '../', 'models', 'transaction_classifier.onnx'),
  );
})();

// Load category mappings
const categories: string[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../', 'models', 'transaction_categories.json'), 'utf8'),
);

// Load Sentence Transformer model as a promise
const embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

export async function categorizeStatementData(
  data: ASBTransaction[] = [],
): Promise<ASBTransactionCategorized[]> {
  const requiredColumns = ['Payee', 'Memo', 'Tran Type'];
  if (!requiredColumns.every((col) => col in data[0])) {
    throw new Error('Missing required columns in data.');
  }

  const transactionContexts = data.map(
    (row) => `${row.Payee.trim()} ${row.Memo?.trim() || ''} ${row['Tran Type']?.trim() || ''}`,
  );

  const embedder = await embedderPromise;
  const embeddings = await embedder(transactionContexts, {
    pooling: 'mean',
    normalize: true,
  });

  // Convert embeddings to tensor for ONNX
  const inputTensor = new ort.Tensor(embeddings.type, embeddings.data, embeddings.dims);

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

  const categorizedData = data.map((row, i) => {
    const category = labelData[i];
    const probabilities = probabilitiesData.slice(i * numCategories, (i + 1) * numCategories - 1);

    return {
      ...row,
      'Predicted Category': category || 'Uncategorized',
      Probability: Math.max(...probabilities),
    };
  });

  return categorizedData;
}
