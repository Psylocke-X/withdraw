import { create } from "zustand";
import {
  CreateWithdrawalRequest,
  CreateWithdrawalResponse,
  Withdrawal,
  WithdrawStatus,
} from "@/lib/withdraw-types";

const LAST_WITHDRAWAL_KEY = "withdraw:last-withdrawal";
const LAST_WITHDRAWAL_TTL_MS = 5 * 60 * 1000;

type DraftPayload = CreateWithdrawalRequest;

type PersistedWithdrawal = {
  savedAt: number;
  withdrawal: Withdrawal;
};

type WithdrawState = {
  amount: string;
  canRetry: boolean;
  confirm: boolean;
  destination: string;
  errorMessage: string | null;
  hydrated: boolean;
  lastSubmittedDraft: DraftPayload | null;
  lastWithdrawal: Withdrawal | null;
  status: WithdrawStatus;
  hydrate: () => void;
  retry: () => Promise<void>;
  setAmount: (amount: string) => void;
  setConfirm: (confirm: boolean) => void;
  setDestination: (destination: string) => void;
  submit: () => Promise<void>;
};

export const getInitialWithdrawState = (): Omit<
  WithdrawState,
  "hydrate" | "retry" | "setAmount" | "setConfirm" | "setDestination" | "submit"
> => ({
  amount: "",
  canRetry: false,
  confirm: false,
  destination: "",
  errorMessage: null,
  hydrated: false,
  lastSubmittedDraft: null,
  lastWithdrawal: null,
  status: "idle",
});

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

async function loadWithdrawal(id: string): Promise<Withdrawal> {
  const response = await fetch(`/v1/withdrawals/${id}`);

  if (!response.ok) {
    throw new Error("Unable to load withdrawal status.");
  }

  return (await response.json()) as Withdrawal;
}

async function submitDraft(draft: DraftPayload): Promise<Withdrawal> {
  const response = await fetch("/v1/withdrawals", {
    body: JSON.stringify(draft),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (response.status === 409) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? "Withdrawal request conflict.");
  }

  if (!response.ok) {
    throw new Error("Unexpected API error. Please try again.");
  }

  const body = (await response.json()) as CreateWithdrawalResponse;

  return loadWithdrawal(body.id);
}

function persistLastWithdrawal(withdrawal: Withdrawal) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const payload: PersistedWithdrawal = {
    savedAt: Date.now(),
    withdrawal,
  };

  storage.setItem(LAST_WITHDRAWAL_KEY, JSON.stringify(payload));
}

function readPersistedWithdrawal(): Withdrawal | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(LAST_WITHDRAWAL_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const payload = JSON.parse(rawValue) as PersistedWithdrawal;
    if (Date.now() - payload.savedAt > LAST_WITHDRAWAL_TTL_MS) {
      storage.removeItem(LAST_WITHDRAWAL_KEY);
      return null;
    }

    return payload.withdrawal;
  } catch {
    storage.removeItem(LAST_WITHDRAWAL_KEY);
    return null;
  }
}

function createDraft(state: Pick<WithdrawState, "amount" | "destination">): DraftPayload {
  return {
    amount: Number(state.amount),
    destination: state.destination.trim(),
    idempotency_key: crypto.randomUUID(),
  };
}

export const useWithdrawStore = create<WithdrawState>((set, get) => ({
  ...getInitialWithdrawState(),
  hydrate: () => {
    if (get().hydrated) {
      return;
    }

    set({
      hydrated: true,
      lastWithdrawal: readPersistedWithdrawal(),
    });
  },
  retry: async () => {
    const draft = get().lastSubmittedDraft;

    if (!draft || get().status === "loading") {
      return;
    }

    await runSubmission(draft, set);
  },
  setAmount: (amount) => {
    set({ amount });
  },
  setConfirm: (confirm) => {
    set({ confirm });
  },
  setDestination: (destination) => {
    set({ destination });
  },
  submit: async () => {
    const state = get();

    if (state.status === "loading") {
      return;
    }

    const draft = createDraft(state);
    set({ lastSubmittedDraft: draft });

    await runSubmission(draft, set);
  },
}));

async function runSubmission(
  draft: DraftPayload,
  set: (partial: Partial<WithdrawState>) => void,
) {
  set({
    canRetry: false,
    errorMessage: null,
    status: "loading",
  });

  try {
    const withdrawal = await submitDraft(draft);

    persistLastWithdrawal(withdrawal);
    set({
      canRetry: false,
      errorMessage: null,
      lastWithdrawal: withdrawal,
      status: "success",
    });
  } catch (error) {
    const message =
      error instanceof TypeError
        ? "Network error. Please retry without changing your form data."
        : error instanceof Error
          ? error.message
          : "Unexpected error.";

    set({
      canRetry: error instanceof TypeError,
      errorMessage: message,
      status: "error",
    });
  }
}
