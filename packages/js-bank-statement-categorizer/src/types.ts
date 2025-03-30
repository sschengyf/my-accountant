export type ASBTransaction = {
  Date: string; // Assuming MM/DD/YY format
  'Unique Id': string;
  'Tran Type': string;
  Payee: string;
  Memo: string;
  Amount: string; // Keeping as string to match input format
};

export type ASBTransactionCategorized = ASBTransaction & {
  'Predicted Category': string;
  Probability: number; // Confidence score as a float
};
