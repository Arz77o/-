import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "متجري",
  description: "أفضل المنتجات بأفضل الأسعار",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
        {children}
      </body>
    </html>
  );
}
