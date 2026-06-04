import type { Metadata } from "next";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Nexus",
    template: "%s | Nexus",
  },
  description:
    "Sistem Informasi dan Monitoring Internal Ormawa Eksekutif PKU IPB.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}

          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}