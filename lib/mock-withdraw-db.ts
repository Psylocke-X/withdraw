import { Withdrawal } from "@/lib/withdraw-types";

type MockWithdrawDb = {
  idempotencyIndex: Map<string, string>;
  withdrawals: Map<string, Withdrawal>;
};

const globalStore = globalThis as typeof globalThis & {
  __withdrawMockDb__?: MockWithdrawDb;
};

const db =
  globalStore.__withdrawMockDb__ ??
  (globalStore.__withdrawMockDb__ = {
    idempotencyIndex: new Map<string, string>(),
    withdrawals: new Map<string, Withdrawal>(),
  });

export function createWithdrawal(input: {
  amount: number;
  destination: string;
  idempotencyKey: string;
}): { conflict: true } | { id: string } {
  if (input.destination.toLowerCase().includes("conflict")) {
    return { conflict: true };
  }

  const existingId = db.idempotencyIndex.get(input.idempotencyKey);

  if (existingId) {
    return { id: existingId };
  }

  const id = crypto.randomUUID();
  const withdrawal: Withdrawal = {
    amount: input.amount,
    createdAt: new Date().toISOString(),
    destination: input.destination,
    id,
    idempotencyKey: input.idempotencyKey,
    status: "processing",
  };

  db.withdrawals.set(id, withdrawal);
  db.idempotencyIndex.set(input.idempotencyKey, id);

  return { id };
}

export function getWithdrawal(id: string): Withdrawal | null {
  return db.withdrawals.get(id) ?? null;
}
