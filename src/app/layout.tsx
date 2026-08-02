import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Moors",
  description: "A basic forum",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
