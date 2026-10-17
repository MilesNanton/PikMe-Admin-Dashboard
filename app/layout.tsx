import type { Metadata } from "next";
import "./globals.css";
import "./login-reference.css";
import "./dashboard-reference.css";
import "./compact-header.css";

export const metadata: Metadata = {
  title: "PikMe · Admin",
  description: "PikMe trust and safety administration dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const fonts = {
    "--font-body": 'Inter, "Segoe UI", Arial, sans-serif',
    "--font-display": '"Arial Black", Inter, "Segoe UI", sans-serif',
  } as React.CSSProperties;
  return <html lang="en"><body style={fonts}>{children}</body></html>;
}
