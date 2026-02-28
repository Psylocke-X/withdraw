import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Withdraw Test Assignment",
  description: "Next.js 14 + Zustand + Jest starter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
