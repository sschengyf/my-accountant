import express, { Request, Response, RequestHandler } from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as ort from 'onnxruntime-node';
import faiss from 'faiss-node';
import cors from 'cors';
import { pipeline } from '@xenova/transformers';

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 8000;

// Load classifier ONNX model
let transaction_classifier: ort.InferenceSession;
(async () => {
  transaction_classifier = await ort.InferenceSession.create(
    'models/transaction_classifier.onnx'
  );
})();

// Load FAISS index
const index = faiss.Index.read('models/transaction_faiss.index');

// Load category mappings
const categories: string[] = JSON.parse(
  fs.readFileSync('models/transaction_categories.json', 'utf8')
);

// Load Sentence Transformer model
let embedder: any;
(async () => {
  embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
})();

app.use(cors());
app.use(express.json());

app.post('/upload', upload.single('file'), (async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    const filePath = path.join('uploads', req.file.filename);
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
      range: 5,
      header: 5,
      raw: false,
    });

    fs.unlinkSync(filePath); // Remove uploaded file after processing

    const requiredColumns = ['Payee', 'Memo', 'Tran Type'];
    if (!requiredColumns.every((col) => col in data[0])) {
      return res
        .status(400)
        .json({ error: 'Missing required columns in uploaded file.' });
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
        dims: [numTransactions, numCategories],
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

    res.json(data);
    return;
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Internal server error.' });
    return;
  }
}) as RequestHandler);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
