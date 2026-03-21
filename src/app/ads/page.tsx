
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdsPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-xs font-bold text-primary animate-pulse">جاري التحميل...</p>
    </div>
  );
}
