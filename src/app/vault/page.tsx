
"use client"

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function VaultPage() {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [timeLeft, setTimeLeft] = useState<string>('');

  const jarRef = useMemoFirebase(() => firestore ? doc(firestore, 'vault', 'current_jar') : null, [firestore]);
  const { data: jarData, isLoading: isJarLoading } = useDoc(jarRef);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const dzNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3600000));
      const breakTime = new Date(dzNow);
      breakTime.setHours(20, 0, 0, 0);
      const diff = breakTime.getTime() - dzNow.getTime();
      if (diff > 0) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}:${m}:${s}`);
      } else setTimeLeft('انكسرت الجرة!');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#1A0F04] text-[#F3E5AB] flex flex-col items-center relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(180,83,9,0.15),transparent_70%)]" />
      
      <main className="relative z-10 flex flex-col items-center gap-8 py-20 w-full max-w-2xl px-4 text-center">
        <motion.div animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 4 }} className="text-[180px] drop-shadow-[0_0_30px_rgba(180,83,9,0.5)]">🏺</motion.div>
        
        <div className="space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">إجمالي الكنز الحالي</h2>
          <div className="text-7xl font-mono font-bold text-[#FBBF24] tabular-nums drop-shadow-sm">
            {isJarLoading ? "..." : (jarData?.totalCoins || 0).toLocaleString()}
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 bg-black/40 px-6 py-2 rounded-full border border-[#FBBF24]/10 w-fit backdrop-blur-sm">
              <Clock size={14} className="text-[#FBBF24]" />
              <span className="text-sm font-mono font-bold text-[#FBBF24]">{timeLeft}</span>
            </div>
            <p className="text-[10px] font-bold text-[#FBBF24]/40 uppercase tracking-widest">الوقت المتبقي لكسر الجرة</p>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-4 pt-6">
          <Button 
            className="w-full rounded-full h-16 bg-[#B45309] text-white font-bold text-md shadow-xl hover:bg-[#D97706] active:scale-95 transition-all" 
            onClick={() => toast({ title: "قريباً جداً! 🏺", description: "ميزة المشاركة في الجرة الملكية ستفتح خلال الأيام القادمة." })}
          >
            المشاركة بـ 3 عملات تيمقاد
          </Button>
          
          <div className="flex items-center justify-center gap-2 opacity-30">
            <Shield size={12} />
            <span className="text-[8px] font-bold uppercase tracking-widest">نظام حماية الكنوز مؤمن</span>
          </div>
        </div>
      </main>
    </div>
  );
}
