
"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFirebase, initiateSignOut, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { LogOut, ChevronLeft, ArrowRight, Moon, Sun, ShieldCheck, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import TimgadLogo from '@/components/ui/Logo';
import Link from 'next/link';
import { HighPerformanceAd } from '@/components/ads/AadsUnit';

export default function SettingsPage() {
  const { auth, user, firestore } = useFirebase();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);
  const isAdmin = user?.email === ADMIN_EMAIL || profile?.role === 'admin';

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    if (!auth) return;
    initiateSignOut(auth);
    router.push('/login');
  };

  if (!user || user.isAnonymous) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-primary pt-12 pb-10 px-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10 container max-w-xl mx-auto flex flex-col items-center gap-4">
          <button onClick={() => router.back()} className="absolute right-0 top-0 text-white/80 hover:text-white transition-colors"><ArrowRight size={20} /></button>
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center mb-2">
            <TimgadLogo size={32} variant="white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white font-headline tracking-tighter">تيمقاد | Timgad</h1>
            <p className="text-[10px] text-white/60 mt-1 uppercase tracking-widest font-medium">إعدادات المنصة</p>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-xl -mt-6 px-4 space-y-3 relative z-20">
        <Card className="border-none shadow-sm rounded-none bg-card mb-4 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
              <Label htmlFor="dark-mode" className="flex items-center gap-4 flex-1 cursor-pointer">
                <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary shrink-0">
                  {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-primary">المظهر</span>
                  <span className="text-[9px] text-muted-foreground">{isDarkMode ? 'الوضع الليلي نشط' : 'الوضع النهاري نشط'}</span>
                </div>
              </Label>
              <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Link href="/admin">
            <Card className="border-none shadow-sm rounded-none bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer border-r-4 border-r-accent overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent"><ShieldCheck size={18} /></div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-accent">الإدارة</span>
                    <span className="text-[9px] text-muted-foreground">التحكم في المنصة وتوزيع العوائد</span>
                  </div>
                </div>
                <ChevronLeft size={14} className="text-accent/30" />
              </CardContent>
            </Card>
          </Link>
        )}

        <div className="space-y-2 pt-2">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-1">معلومات المنصة</h2>
          <Link href="/about">
            <Card className="border-none shadow-sm rounded-none bg-card hover:bg-secondary/20 transition-colors cursor-pointer overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary"><Info size={16} /></div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-primary">حول تيمقاد</span>
                    <span className="text-[9px] text-muted-foreground">الميثاق والدليل الاقتصادي</span>
                  </div>
                </div>
                <ChevronLeft size={14} className="text-muted-foreground/30" />
              </CardContent>
            </Card>
          </Link>
        </div>

        <HighPerformanceAd />

        <Card className="border-none shadow-sm rounded-none bg-card mt-8 hover:bg-red-50 transition-colors cursor-pointer border-r-4 border-r-destructive overflow-hidden">
          <CardContent className="p-0">
            <button onClick={handleLogout} className="w-full p-4 flex items-center justify-between text-destructive">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><LogOut size={16} /></div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold">تسجيل الخروج</span>
                  <span className="text-[9px] opacity-70">الخروج من حساب تيمقاد</span>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
