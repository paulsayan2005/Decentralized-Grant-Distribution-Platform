export interface Grant {
  id: number;
  creator: string;
  recipient: string;
  target: string; // in XLM string representation
  balance: string; // in XLM string representation
  deadline: number; // Unix timestamp in seconds
  released: boolean;
  approved: boolean;
  description: string;
}
