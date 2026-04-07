import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
import { Metadata } from 'next';
import { Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { ErrorBoundary } from '@/components/error-boundary';
import SupabaseProvider from '@/components/providers/supabase-provider';
const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ACE-Infinity',
  description: 'Connect with your ACE Engineering College alumni network',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  robots: {
    index: true,
    follow: true,
  },
};

// Security headers removed - causing TypeScript issues

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={outfit.className}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SupabaseProvider>
              <NextTopLoader color="#2563eb" showSpinner={false} />
              {children}
              <Toaster richColors position="top-center" />
            </SupabaseProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}