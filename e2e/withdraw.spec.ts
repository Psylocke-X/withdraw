import { expect, test } from "@playwright/test";

test("submits withdraw request and shows created status", async ({ page }) => {
  await page.goto("/");

  const amountInput = page.locator('input[name="amount"]');
  const destinationInput = page.locator('input[name="destination"]');
  const confirmInput = page.locator('input[name="confirm"]');

  await amountInput.fill("150");
  await destinationInput.fill("0xabc123");
  await confirmInput.check({ force: true });

  await expect(amountInput).toHaveValue("150");
  await expect(destinationInput).toHaveValue("0xabc123");
  await expect(confirmInput).toBeChecked();
  await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText("Current state:")).toContainText("success");
  await expect(page.getByRole("heading", { name: "Last withdrawal" })).toBeVisible();
  await expect(page.getByText("Status: processing")).toBeVisible();
  await expect(page.getByText("Amount: 150 USDT")).toBeVisible();
  await expect(page.getByText("Destination: 0xabc123")).toBeVisible();
});
