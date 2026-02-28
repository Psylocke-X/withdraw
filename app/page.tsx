"use client";

import { FormEvent, useEffect } from "react";
import { useWithdrawStore } from "@/store/withdraw-store";

export default function Page() {
  const {
    amount,
    canRetry,
    confirm,
    destination,
    errorMessage,
    hydrate,
    lastWithdrawal,
    status,
    retry,
    setAmount,
    setConfirm,
    setDestination,
    submit,
  } = useWithdrawStore();

  const parsedAmount = Number(amount);
  const amountError =
    amount.length === 0 ? "Enter the amount to withdraw." : parsedAmount > 0 ? null : "Amount must be greater than 0.";
  const destinationError =
    destination.trim().length > 0 ? null : "Enter a destination wallet or bank account.";
  const confirmError = confirm ? null : "You must confirm the withdrawal request.";
  const isValid = !amountError && !destinationError && !confirmError;
  const isLoading = status === "loading";
  const statusTone =
    status === "success" ? "status-success" : status === "error" ? "status-error" : status === "loading" ? "status-loading" : "";

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid || isLoading) {
      return;
    }

    await submit();
  };

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="hero-row">
          <div>
            <p className="eyebrow">Payout Operations</p>
            <h1>Withdraw</h1>
            <p className="lede">
              Submit a single USDT payout request with idempotent protection, visible
              state transitions and recovery after transient failures.
            </p>
          </div>
          <div className="hero-badge">
            <span className="hero-badge-label">Settlement asset</span>
            <strong>USDT</strong>
          </div>
        </div>

        <div className="content-grid">
          <form className="withdraw-form" onSubmit={handleSubmit}>
            <div className="field-group">
              <label>
                Amount
                <div className="input-shell">
                  <input
                    aria-describedby="amount-help"
                    min="0"
                    name="amount"
                    step="0.01"
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                  <span className="input-suffix">USDT</span>
                </div>
              </label>
              <p className={`field-help ${amountError ? "field-error" : ""}`} id="amount-help">
                {amountError ?? "Decimals are allowed. Requests are processed immediately."}
              </p>
            </div>

            <div className="field-group">
              <label>
                Destination
                <input
                  aria-describedby="destination-help"
                  name="destination"
                  placeholder="wallet or bank destination"
                  type="text"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                />
              </label>
              <p className={`field-help ${destinationError ? "field-error" : ""}`} id="destination-help">
                {destinationError ?? "Use a stable wallet address or bank destination identifier."}
              </p>
            </div>

            <label className="checkbox">
              <input
                checked={confirm}
                name="confirm"
                type="checkbox"
                onChange={(event) => setConfirm(event.target.checked)}
              />
              <span>
                I confirm this withdrawal request
                <small>{confirmError ?? "This action creates a payout request immediately."}</small>
              </span>
            </label>

            <div className="actions-row">
              <button disabled={!isValid || isLoading} type="submit">
                {isLoading ? "Submitting..." : "Submit"}
              </button>

              {canRetry ? (
                <button className="secondary-button" onClick={() => retry()} type="button">
                  Retry last request
                </button>
              ) : null}
            </div>
          </form>

          <aside className="summary-card">
            <div className="summary-head">
              <h2>Request summary</h2>
              <span className={`status-pill ${statusTone}`}>{status}</span>
            </div>
            <dl className="summary-list">
              <div>
                <dt>Amount</dt>
                <dd>{parsedAmount > 0 ? `${parsedAmount} USDT` : "Not set"}</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>{destination.trim() || "Not set"}</dd>
              </div>
              <div>
                <dt>Submission</dt>
                <dd>{confirm ? "Confirmed by operator" : "Waiting for confirmation"}</dd>
              </div>
              <div>
                <dt>Recovery</dt>
                <dd>{canRetry ? "Retry available" : "No retry required"}</dd>
              </div>
            </dl>

            <div aria-live="polite" className="status-card" data-status={status}>
              Current state: <strong>{status}</strong>
            </div>

            <div className="ops-note">
              <strong>Operational note</strong>
              <p>
                Duplicate clicks are ignored while the request is in flight. The latest
                successful withdrawal is restored for 5 minutes after reload.
              </p>
            </div>
          </aside>
        </div>

        {errorMessage ? (
          <div aria-live="polite" className="feedback-card error-card" role="alert">
            {errorMessage}
          </div>
        ) : null}

        {lastWithdrawal ? (
          <section className="feedback-card success-card">
            <h2>Last withdrawal</h2>
            <p>
              Request <strong>{lastWithdrawal.id}</strong>
            </p>
            <p>Status: {lastWithdrawal.status}</p>
            <p>Amount: {lastWithdrawal.amount} USDT</p>
            <p>Destination: {lastWithdrawal.destination}</p>
            <p>Created at: {new Date(lastWithdrawal.createdAt).toLocaleString()}</p>
          </section>
        ) : null}
      </section>
    </main>
  );
}
