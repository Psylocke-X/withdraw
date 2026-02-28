import { NextResponse } from "next/server";
import { getWithdrawal } from "@/lib/mock-withdraw-db";

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  const withdrawal = getWithdrawal(context.params.id);

  if (!withdrawal) {
    return NextResponse.json({ message: "Withdrawal not found." }, { status: 404 });
  }

  return NextResponse.json(withdrawal);
}
