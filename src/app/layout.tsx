import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import { Providers } from "@/components/providers";
import PerformanceMonitor from "@/components/ui/PerformanceMonitor";
import "@/lib/error-suppression"; // Suppress noisy API and hydration errors in development
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoMEMIS - Teaching and Learning Materials Management",
  description:
    "Government of Sierra Leone - Teaching and Learning Materials Management Information System",
  keywords: [
    "LoMEMIS",
    "TLM",
    "Education",
    "Sierra Leone",
    "Inventory Management",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <AuthProvider>
            <div className="min-h-screen">{children}</div>
            {process.env.NODE_ENV === "development" && (
              <PerformanceMonitor enabled={true} showBadge={false} />
            )}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
