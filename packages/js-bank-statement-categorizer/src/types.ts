export type ASBTransaction = {
  Date: string; // YYYY/MM/DD format
  'Unique Id': string;
  'Tran Type': string;
  Payee: string;
  Memo: string;
  Amount: string; // Keeping as string to match input format
};

// Normalized transaction type used across all banks
export type Transaction = {
  Date: string;
  'Tran Type': string;
  Payee: string;
  Memo: string;
  Amount: string;
};

export type TransactionCategorized = Transaction & {
  'Predicted Category': string;
  Probability: number;
};

export type ASBTransactionCategorized = ASBTransaction & {
  'Predicted Category': string;
  Probability: number; // Confidence score as a float
};
