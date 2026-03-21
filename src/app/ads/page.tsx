
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { LayoutGrid, Sparkles, ChevronRight, Rocket } from 'lucide-react';
import TimgadLogo from '@/components/ui/Logo';
import { motion } from 'framer-motion';

export default function AdsPagePlaceholder() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-xl pt-20 pb-20 px-4 text-center">
        <header className="flex items-center gap-3 mb-12">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
            <ChevronRight size={20} />
          </Button>
          <div className="flex flex-col text-right">
            <h1 className="text-sm font-bold text-primary">سوق القصص والأرباح</h1>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">المرحلة القادمة من تيمقاد</span>
          </div>
        </header>

        <div className="space-y-8 flex flex-col items-center justify-center py-20">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center relative"
          >
            <LayoutGrid size={48} className="text-primary/20" />
            <div className="absolute -top-2 -right-2 bg-accent text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg animate-bounce">
              جديد قريباً
            </div>
          </motion.div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-primary font-headline tracking-tighter">سوق تيمقاد الإعلاني</h2>
            <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed mx-auto">
              نحن نعمل على تجهيز أول سوق إعلاني عربي يدمج بروتوكولات TRX بشكل كامل. استعد لتجربة ربحية لا مثيل لها.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-xs pt-6">
            <div className="p-4 bg-secondary/30 border border-primary/5 rounded-2xl space-y-2">
              <Sparkles size={20} className="text-accent mx-auto" />
              <p className="text-[10px] font-bold text-primary">شاهد واربح</p>
            </div>
            <div className="p-4 bg-secondary/30 border border-primary/5 rounded-2xl space-y-2">
              <Rocket size={20} className="text-primary mx-auto" />
              <p className="text-[10px] font-bold text-primary">أعلن بذكاء</p>
            </div>
          </div>

          <Button 
            className="rounded-full px-10 font-bold h-11 bg-primary text-white"
            onClick={() => router.push('/')}
          >
            العودة للرئيسية
          </Button>
        </div>

        <div className="mt-20 opacity-20">
          <TimgadLogo size={40} className="mx-auto" />
        </div>
      </main>
    </div>
  );
}
