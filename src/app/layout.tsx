
import type {Metadata} from 'next';
import './globals.css';
import BottomNav from '@/components/layout/BottomNav';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'تواصل | Tawasul',
  description: 'منصة تواصل اجتماعي عربية متطورة ومبسطة.',
  openGraph: {
    title: 'تواصل | Tawasul',
    description: 'منصة تواصل اجتماعي عربية متطورة ومبسطة للمجتمع التقني.',
    url: 'https://tawasul-app.web.app',
    siteName: 'تواصل',
    images: [
      {
        url: 'https://picsum.photos/seed/tawasul-share/1200/630',
        width: 1200,
        height: 630,
        alt: 'Tawasul Social Platform',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'تواصل | Tawasul',
    description: 'منصة تواصل اجتماعي عربية متطورة ومبسطة.',
    images: ['https://picsum.photos/seed/tawasul-share/1200/630'],
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
          {children}
          <BottomNav />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
