import type {Metadata, Viewport} from 'next';
import './globals.css';
import BottomNav from '@/components/layout/BottomNav';
import { FirebaseClientProvider } from '@/firebase';
import PWARegistration from '@/components/PWARegistration';

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
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'تيمقاد',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'تيمقاد | Timgad',
    description: 'تواصل، اكتشف، وشارك في منصة تيمقاد للمجتمع التقني العربي.',
    url: 'https://timgad-app.web.app',
    siteName: 'تيمقاد',
    images: [
      {
        url: 'https://picsum.photos/seed/timgad-share/1200/630',
        width: 1200,
        height: 630,
        alt: 'Timgad Social Platform',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'تيمقاد | Timgad',
    description: 'منصة اجتماعية عربية عريقة برؤية تقنية عصرية.',
    images: ['https://picsum.photos/seed/timgad-share/1200/630'],
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
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/timgad-pwa-192/192/192" />
      </head>
      <body className="font-body antialiased bg-background text-foreground pb-12 md:pb-0">
        <FirebaseClientProvider>
          <PWARegistration />
          {children}
          <BottomNav />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
