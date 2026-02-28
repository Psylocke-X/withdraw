import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "@/app/page";
import { getInitialWithdrawState, useWithdrawStore } from "@/store/withdraw-store";

type FetchMock = jest.MockedFunction<typeof fetch>;

function createJsonResponse(body: unknown, status = 200): Response {
  return {
    json: jest.fn().mockResolvedValue(body),
    ok: status >= 200 && status < 300,
    status,
  } as unknown as Response;
}

function resetStore() {
  useWithdrawStore.setState({
    ...getInitialWithdrawState(),
    hydrate: useWithdrawStore.getState().hydrate,
    retry: useWithdrawStore.getState().retry,
    setAmount: useWithdrawStore.getState().setAmount,
    setConfirm: useWithdrawStore.getState().setConfirm,
    setDestination: useWithdrawStore.getState().setDestination,
    submit: useWithdrawStore.getState().submit,
  });
}

async function fillValidForm() {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/amount/i), "150");
  await user.type(screen.getByLabelText(/destination/i), "0xabc123");
  await user.click(screen.getByLabelText(/i confirm/i));

  return user;
}

describe("Withdraw page", () => {
  beforeEach(() => {
    resetStore();
    window.localStorage.clear();
    global.fetch = jest.fn() as FetchMock;
    Object.defineProperty(global, "crypto", {
      configurable: true,
      value: {
        randomUUID: jest.fn().mockReturnValue("idem-123"),
      },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("submits successfully and shows created withdrawal status", async () => {
    const fetchMock = global.fetch as FetchMock;
    fetchMock
      .mockResolvedValueOnce(createJsonResponse({ id: "withdrawal-1" }, 201))
      .mockResolvedValueOnce(
        createJsonResponse({
          amount: 150,
          createdAt: "2026-02-28T12:00:00.000Z",
          destination: "0xabc123",
          id: "withdrawal-1",
          idempotencyKey: "idem-123",
          status: "processing",
        }),
      );

    render(<Page />);
    const user = await fillValidForm();
    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/current state:/i)).toHaveTextContent("success");
    });

    expect(screen.getByText("withdrawal-1")).toBeInTheDocument();
    expect(screen.getByText(/status: processing/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/v1/withdrawals",
      expect.objectContaining({
        body: JSON.stringify({
          amount: 150,
          destination: "0xabc123",
          idempotency_key: "idem-123",
        }),
        method: "POST",
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/v1/withdrawals/withdrawal-1");
  });

  it("shows a readable API error for 409 responses", async () => {
    const fetchMock = global.fetch as FetchMock;
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          message:
            "Withdrawal request conflicts with the current destination policy. Please use a different destination.",
        },
        409,
      ),
    );

    render(<Page />);
    const user = await fillValidForm();
    await user.clear(screen.getByLabelText(/destination/i));
    await user.type(screen.getByLabelText(/destination/i), "conflict-wallet");
    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(
      await screen.findByText(/withdrawal request conflicts with the current destination policy/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/current state:/i)).toHaveTextContent("error");
  });

  it("prevents double submit while request is in flight", async () => {
    const fetchMock = global.fetch as FetchMock;
    let resolvePost: ((response: Response) => void) | null = null;

    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolvePost = resolve;
        }),
    );
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        amount: 150,
        createdAt: "2026-02-28T12:00:00.000Z",
        destination: "0xabc123",
        id: "withdrawal-2",
        idempotencyKey: "idem-123",
        status: "processing",
      }),
    );

    render(<Page />);
    const user = await fillValidForm();
    const submitButton = screen.getByRole("button", { name: /submit/i });

    await user.click(submitButton);
    await user.click(submitButton);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(submitButton).toBeDisabled();

    resolvePost?.(createJsonResponse({ id: "withdrawal-2" }, 201));

    await waitFor(() => {
      expect(screen.getByText(/current state:/i)).toHaveTextContent("success");
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
