import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BRANIE",
  description: "BRANIE — website in opbouw.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
