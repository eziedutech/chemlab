import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EZI ChemLab",
  description:
    "A 3D chemistry and physics lab where an AI agent acts as the lab instructor, powered by WebMCP.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
