export type WithdrawStatus = "idle" | "loading" | "success" | "error";

export type Withdrawal = {
  amount: number;
  createdAt: string;
  destination: string;
  id: string;
  idempotencyKey: string;
  status: "processing";
};

export type CreateWithdrawalRequest = {
  amount: number;
  destination: string;
  idempotency_key: string;
};

export type CreateWithdrawalResponse = {
  id: string;
};
