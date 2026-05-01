import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VercelSend Server",
  description: "API and admin panel for VercelSend.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
