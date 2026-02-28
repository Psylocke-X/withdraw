import { NextResponse } from "next/server";
import { createWithdrawal } from "@/lib/mock-withdraw-db";
import { CreateWithdrawalRequest, CreateWithdrawalResponse } from "@/lib/withdraw-types";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<CreateWithdrawalRequest>;

  if (
    typeof body.amount !== "number" ||
    body.amount <= 0 ||
    typeof body.destination !== "string" ||
    body.destination.trim().length === 0 ||
    typeof body.idempotency_key !== "string" ||
    body.idempotency_key.trim().length === 0
  ) {
    return NextResponse.json({ message: "Invalid withdrawal payload." }, { status: 400 });
  }

  const result = createWithdrawal({
    amount: body.amount,
    destination: body.destination.trim(),
    idempotencyKey: body.idempotency_key,
  });

  if ("conflict" in result) {
    return NextResponse.json(
      {
        message:
          "Withdrawal request conflicts with the current destination policy. Please use a different destination.",
      },
      { status: 409 },
    );
  }

  const response: CreateWithdrawalResponse = { id: result.id };

  return NextResponse.json(response, { status: 201 });
}
