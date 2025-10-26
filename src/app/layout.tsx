import type { Metadata } from 'next';
import './globals.css';
import MainLayout from '@/components/layout/main-layout';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'CodeAssist',
  description: 'Intelligent online coding & test platform with AI-based feedback.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,400;0;700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-background text-foreground antialiased">
        <FirebaseClientProvider>
          <MainLayout>{children}</MainLayout>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
