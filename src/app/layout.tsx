import type {Metadata} from 'next';
import './globals.css';
import BottomNav from '@/components/layout/BottomNav';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'تواصل | Tawasul',
  description: 'منصة تواصل اجتماعي عربية متطورة ومبسطة.',
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
      <body className="font-body antialiased bg-background text-foreground pb-14 md:pb-0">
        <FirebaseClientProvider>
          {children}
          <BottomNav />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
