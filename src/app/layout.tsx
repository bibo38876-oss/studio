
import type {Metadata, Viewport} from 'next';
import './globals.css';
import BottomNav from '@/components/layout/BottomNav';
import { FirebaseClientProvider } from '@/firebase';
import PWARegistration from '@/components/PWARegistration';
import InstallPwaOverlay from '@/components/InstallPwaOverlay';
import Script from 'next/script';

export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'تيمقاد | Timgad',
  description: 'منصة اجتماعية عربية عريقة برؤية تقنية عصرية.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'تيمقاد',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground pb-12 md:pb-0">
        <FirebaseClientProvider>
          <PWARegistration />
          <InstallPwaOverlay />
          {children}
          <BottomNav />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
