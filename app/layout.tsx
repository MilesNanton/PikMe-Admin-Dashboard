import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./login-reference.css";
import "./dashboard-reference.css";
import "./report-preview.css";
import "./compact-header.css";

const pixelatedElegance = localFont({
  src: "../public/fonts/pixelated-elegance.woff",
  display: "swap",
  weight: "400",
  variable: "--font-pixelated",
});

export const metadata: Metadata = {
  title: "PikMe · Admin",
  description: "PikMe trust and safety administration dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const fonts = {
    "--font-body": 'Inter, "Segoe UI", Arial, sans-serif',
    "--font-display": '"Arial Black", Inter, "Segoe UI", sans-serif',
  } as React.CSSProperties;
  return <html lang="en"><body className={pixelatedElegance.variable} style={fonts}>{children}</body></html>;
}
