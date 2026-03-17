
"use client"

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, Clock, Shield, Plus, ArrowUpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

export default function VaultPage() {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showCoins, setShowCoins] = useState(false);

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
      <main className="relative z-10 flex flex-col items-center gap-8 py-20 w-full max-w-2xl px-4">
        <motion.div animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 4 }} className="text-[200px] drop-shadow-2xl">🏺</motion.div>
        <div className="text-center space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest opacity-40">إجمالي العملات في الجرة</h2>
          <div className="text-7xl font-mono font-bold text-[#FBBF24]">{isJarLoading ? "..." : (jarData?.totalCoins || 0).toLocaleString()}</div>
          <div className="flex items-center gap-2 bg-black/40 px-6 py-2 rounded-full border border-[#FBBF24]/10 mx-auto w-fit">
            <Clock size={14} className="text-[#FBBF24]" />
            <span className="text-sm font-mono font-bold">{timeLeft}</span>
          </div>
        </div>
        <Button className="w-full max-w-sm rounded-full h-16 bg-[#B45309] text-white font-bold" onClick={() => toast({ title: "قريباً جداً!", description: "ميزة المشاركة في الجرة ستفتح قريباً." })}>المشاركة بـ 3 عملات تيمقاد</Button>
      </main>
    </div>
  );
}
