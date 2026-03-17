
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, Loader2, Trophy, Clock, History, TrendingUp, Info, Shield, ArrowUpCircle, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, useCollection, addDocumentNonBlocking } from '@/firebase';
import { doc, increment, setDoc, serverTimestamp, collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

export default function VaultPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [isContributing, setIsContributing] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [showCoins, setShowCoins] = useState(false);

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isInfiniteAdmin = user?.email === ADMIN_EMAIL;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(userRef);

  const jarRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'vault', 'current_jar');
  }, [firestore]);
  const { data: jarData, isLoading: isJarLoading } = useDoc(jarRef);

  const participationRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'vault', 'current_jar', 'participants', user.uid);
  }, [firestore, user?.uid]);
  const { data: hasParticipated } = useDoc(participationRef);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const dzNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3600000));
      
      const breakTime = new Date(dzNow);
      breakTime.setHours(20, 0, 0, 0);

      const resetTime = new Date(dzNow);
      resetTime.setHours(20, 5, 0, 0);

      if (dzNow < breakTime) {
        const diff = breakTime.getTime() - dzNow.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}:${m}:${s}`);
      } else if (dzNow >= breakTime && dzNow < resetTime) {
        setTimeLeft('انكسرت الجرة!');
      } else {
        const tomorrow = new Date(breakTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const diff = tomorrow.getTime() - dzNow.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}:${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [jarData?.status]);

  const handleContribute = async () => {
    if (!firestore || !user || !profile || !jarData) return;
    if (jarData.status !== 'active') return toast({ variant: "destructive", description: "الجرة منكسرة حالياً." });
    if (hasParticipated) return toast({ variant: "destructive", description: "لقد شاركت بالفعل." });
    
    if (!isInfiniteAdmin && (profile.coins || 0) < 3) {
      return toast({ variant: "destructive", title: "الرصيد لا يكفي", description: "تحتاج لـ 3 عملات للمشاركة." });
    }

    setIsContributing(true);
    setShowCoins(true);
    
    setTimeout(async () => {
      try {
        if (!isInfiniteAdmin) {
          updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { coins: increment(-3) });
        }
        
        await setDoc(doc(firestore, 'vault', 'current_jar', 'participants', user.uid), {
          userId: user.uid, username: profile.username, avatar: profile.profilePictureUrl,
          verificationType: profile.verificationType || 'none', followerCount: profile.followerIds?.length || 0, joinedAt: serverTimestamp()
        });
        
        updateDocumentNonBlocking(doc(firestore, 'vault', 'current_jar'), { totalCoins: increment(3) });
        toast({ title: "تمت المشاركة!", description: "عملاتك الآن داخل الجرة الملكية." });
      } catch (error) { 
        toast({ variant: "destructive", description: "حدث خطأ أثناء المشاركة." }); 
      } finally {
        setIsContributing(false);
        setTimeout(() => setShowCoins(false), 1000);
      }
    }, 800);
  };

  const handleBoostPot = async (amount: number) => {
    if (!firestore || !user || !profile || !jarData) return;
    if (!isInfiniteAdmin && (profile.coins || 0) < amount) {
      return toast({ variant: "destructive", description: "رصيدك غير كافٍ لهذا الدعم." });
    }

    setIsBoosting(true);
    setShowCoins(true);

    setTimeout(async () => {
      try {
        if (!isInfiniteAdmin) {
          updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { coins: increment(-amount) });
        }
        updateDocumentNonBlocking(doc(firestore, 'vault', 'current_jar'), { totalCoins: increment(amount) });
        toast({ title: "كرم تيمقادي!", description: `لقد أضفت ${amount} عملة لزيادة قيمة الكنز اليوم.` });
      } catch (e) {
        toast({ variant: "destructive", description: "فشل تعزيز الجرة." });
      } finally {
        setIsBoosting(false);
        setTimeout(() => setShowCoins(false), 1000);
      }
    }, 800);
  };

  const isBroken = jarData?.status === 'broken';

  return (
    <div className="min-h-screen bg-[#1A0F04] text-[#F3E5AB] flex flex-col items-center relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
      
      <main className="relative z-10 flex flex-col items-center gap-8 py-20 w-full max-w-2xl px-4">
        <div className="relative w-full flex justify-center">
          <AnimatePresence>
            {showCoins && (
              <div className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none z-50">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 100, x: (i - 3) * 30, opacity: 0, scale: 0.5 }}
                    animate={{ y: -250, x: 0, opacity: [0, 1, 1, 0], scale: 1 }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                    className="absolute"
                  >
                    <TimgadCoin size={40} />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          <motion.div 
            animate={
              isBroken 
                ? { rotate: [0, -2, 2, 0], scale: [1, 1.02, 1] } 
                : showCoins 
                  ? { scale: [1, 1.1, 1], y: [0, -10, 0] } 
                  : { y: [-10, 10, -10] }
            } 
            transition={{ repeat: Infinity, duration: isBroken ? 5 : 4 }} 
            className={`text-[200px] md:text-[280px] drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all ${isBroken ? 'grayscale brightness-50 opacity-40' : 'brightness-110'}`}
          >
            🏺
          </motion.div>
          {isBroken && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <Trophy size={100} className="text-[#FBBF24] drop-shadow-[0_0_30px_rgba(251,191,36,0.6)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest bg-black/40 px-3 py-1 mt-4 rounded-full border border-[#FBBF24]/20">كنز اليوم وُزّع</span>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col items-center gap-6 text-center w-full">
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#FBBF24]/40">إجمالي العملات في الجرة</h2>
            <motion.div 
              key={jarData?.totalCoins} 
              initial={{ scale: 1.2 }} 
              animate={{ scale: 1 }} 
              className="text-7xl md:text-9xl font-mono font-bold text-[#FBBF24] drop-shadow-[0_0_25px_rgba(251,191,36,0.3)]"
            >
              {isJarLoading ? "..." : (jarData?.totalCoins || 0).toLocaleString()}
            </motion.div>
            <div className="flex items-center gap-2 bg-black/40 px-6 py-2 rounded-full border border-[#FBBF24]/10 mx-auto w-fit">
              <Clock size={14} className="text-[#FBBF24] animate-pulse" />
              <span className="text-sm font-mono font-bold text-[#FBBF24] tracking-widest">{timeLeft}</span>
            </div>
          </div>

          {!isBroken ? (
            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
              <Button 
                className={cn(
                  "w-full rounded-full h-16 font-bold text-md gap-3 transition-all shadow-xl",
                  hasParticipated ? 'bg-black/20 text-[#FBBF24]/40 cursor-default' : 'bg-[#B45309] text-white hover:bg-[#D97706] active:scale-95'
                )} 
                onClick={handleContribute} 
                disabled={isContributing || !!hasParticipated || isBoosting}
              >
                {isContributing ? <Loader2 className="animate-spin" /> : hasParticipated ? <Shield size={20} /> : <Plus size={20} />}
                {hasParticipated ? "أنت مشارك في السحب" : isInfiniteAdmin ? "مشاركة إدارية (مجانية)" : "المشاركة بـ 3 عملات تيمقاد"}
              </Button>

              <div className="flex gap-2 w-full">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 rounded-full h-10 border-[#FBBF24]/30 text-[#FBBF24] hover:bg-[#FBBF24]/10 gap-2 text-xs font-bold">
                      <ArrowUpCircle size={16} />
                      تعزيز الجائزة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#2D1606] border-[#B45309] text-[#F3E5AB]">
                    <DialogHeader>
                      <DialogTitle className="text-center font-bold text-[#FBBF24]">زد قيمة الكنز للمجتمع</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-3 py-6">
                      {[10, 50, 100].map((amt) => (
                        <Button 
                          key={amt} 
                          onClick={() => handleBoostPot(amt)} 
                          disabled={isBoosting}
                          className="flex flex-col h-20 bg-black/40 border border-[#FBBF24]/20 hover:bg-[#B45309] hover:text-white"
                        >
                          <span className="text-lg font-bold">{amt}</span>
                          <span className="text-[8px] uppercase tracking-tighter">عملة</span>
                        </Button>
                      ))}
                    </div>
                    <p className="text-[9px] text-center opacity-60 italic">هذه العملات تضاف للرصيد الكلي للجرة ولا تضمن الفوز، بل تزيد من قيمة الجوائز للجميع.</p>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="bg-black/20 border-[#B45309]/20 w-full rounded-none mt-2">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#FBBF24]"><TrendingUp size={14} /><h3 className="text-[10px] font-bold uppercase">قوانين "الأورا" اليومية</h3></div>
                  <p className="text-[9px] text-[#F3E5AB]/60 text-right leading-relaxed">المشاركون الأعلى تأثيراً في تيمقاد (الأورا) يحصدون الحصص الأكبر من الجرة عند انكسارها الساعة 20:00.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col items-center gap-2 text-accent border-y border-accent/10 py-4"><Trophy size={20} /><h3 className="text-sm font-bold uppercase">مجلس أبطال تيمقاد</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(jarData?.lastWinners || []).map((winner: any, i: number) => (
                  <div key={winner.userId} className={`p-3 border flex items-center justify-between ${i < 3 ? 'bg-[#2D1606] border-[#FBBF24]/40' : 'bg-black/20 border-[#B45309]/10'}`}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-[#FBBF24]/20"><AvatarImage src={winner.avatar} /><AvatarFallback>{winner.username?.[0]}</AvatarFallback></Avatar>
                      <div className="flex flex-col text-right"><span className="text-[11px] font-bold text-[#FBBF24]">{winner.username}</span><span className="text-[8px] text-[#F3E5AB]/40 italic">بطل أورا تيمقاد</span></div>
                    </div>
                    <div className="flex flex-col items-end gap-1"><div className="flex items-center gap-1.5"><span className="text-xs font-bold text-accent">+{winner.prize}</span><TimgadCoin size={16} /></div><span className="text-[7px] text-[#FBBF24]/30">{i === 0 ? '20%' : i === 1 ? '15%' : i === 2 ? '10%' : '3.5%'} حصة</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
