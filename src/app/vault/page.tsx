
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function VaultPage() {
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isReady, setIsReady] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    if (!profile?.lastLoginAt) {
      setIsReady(true);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const lastLogin = new Date(profile.lastLoginAt).getTime();
      const nextRewardTime = lastLogin + (24 * 60 * 60 * 1000);
      const distance = nextRewardTime - now;

      if (distance < 0) {
        setIsReady(true);
        setTimeLeft("00:00:00");
        clearInterval(timer);
      } else {
        setIsReady(false);
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        setTimeLeft(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [profile?.lastLoginAt]);

  return (
    <div className="min-h-screen bg-[#1A0F04] text-[#F3E5AB] flex flex-col items-center justify-center relative overflow-hidden">
      <Navbar />
      
      {/* Wood texture background overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
      
      {/* Subtle Ancient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D1606]/0 via-[#FBBF24]/5 to-[#2D1606]/0 pointer-events-none" />

      {/* Header - Minimalist Navigation */}
      <div className="fixed top-12 left-4 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="h-10 w-10 rounded-full text-[#FBBF24]/50 hover:text-[#FBBF24] hover:bg-white/5 transition-all"
        >
          <ChevronRight size={28} />
        </Button>
      </div>

      <main className="relative z-10 flex flex-col items-center gap-12 select-none">
        {/* The Ancient Jar 🏺 */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          {/* Jar Aura */}
          <AnimatePresence>
            {isReady && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#FBBF24]/20 rounded-full blur-[80px] animate-pulse"
              />
            )}
          </AnimatePresence>

          <motion.div
            animate={isReady ? { 
              y: [-5, 5, -5],
              rotate: [-1, 1, -1]
            } : {}}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="text-[160px] md:text-[220px] drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] filter brightness-90 saturate-50 hover:brightness-110 transition-all cursor-default"
          >
            🏺
          </motion.div>

          {/* Floating Particles for Ready State */}
          {isReady && (
            <motion.div 
              animate={{ y: [-20, -40], opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 text-[#FBBF24]"
            >
              <Sparkles size={32} />
            </motion.div>
          )}
        </motion.div>

        {/* The Countdown Counter */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="space-y-1">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#FBBF24]/40 mb-2">
              Next Ancient Reward
            </h2>
            <motion.div 
              className={`text-5xl md:text-7xl font-mono font-bold tracking-tighter ${isReady ? 'text-[#FBBF24] drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]' : 'text-[#F3E5AB]/20'}`}
            >
              {timeLeft || "00:00:00"}
            </motion.div>
          </div>

          <p className="text-[9px] font-medium text-[#F3E5AB]/30 max-w-[200px] leading-relaxed italic">
            {isReady 
              ? "لقد امتلأت الجرة بكنوز تيمقاد، ادخل غداً لتفريغها." 
              : "الجرة تمتص طاقة العطاء ببطء.. انتظر اكتمالها."}
          </p>
        </div>
      </main>

      {/* Decorative Floor Shadow */}
      <div className="fixed bottom-0 w-full h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      
      {/* Footer Info */}
      <div className="fixed bottom-8 flex flex-col items-center gap-2 opacity-10">
        <div className="h-[1px] w-24 bg-[#FBBF24]" />
        <p className="text-[7px] font-bold uppercase tracking-[0.4em]">Vault Guardian Alpha</p>
      </div>
    </div>
  );
}
