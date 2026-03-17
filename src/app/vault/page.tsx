
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, Loader2, Trophy, Clock, History, TrendingUp, Info, Shield } from 'lucide-react';
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

export default function VaultPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [isContributing, setIsContributing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // بيانات المستخدم
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(userRef);

  // بيانات الجرة
  const jarRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'vault', 'current_jar');
  }, [firestore]);
  const { data: jarData, isLoading: isJarLoading } = useDoc(jarRef);

  // هل شارك؟
  const participationRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'vault', 'current_jar', 'participants', user.uid);
  }, [firestore, user?.uid]);
  const { data: hasParticipated } = useDoc(participationRef);

  // تاريخ البطولات
  const historyQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vault_history'), orderBy('brokenAt', 'desc'), limit(1));
  }, [firestore]);
  const { data: historyData } = useCollection(historyQuery);
  const lastJarHistory = historyData?.[0];

  // حساب الوقت بتوقيت الجزائر (UTC+1)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // الجزائر UTC+1
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
        if (jarData?.status === 'active') handleBreakJar();
      } else {
        if (jarData?.status === 'broken') handleResetJar();
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

  const handleBreakJar = async () => {
    if (!firestore || jarData?.status !== 'active') return;
    try {
      const participantsSnap = await getDocs(collection(firestore, 'vault', 'current_jar', 'participants'));
      const participants = participantsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (participants.length === 0) {
        updateDocumentNonBlocking(doc(firestore, 'vault', 'current_jar'), { status: 'broken' });
        return;
      }

      // حساب "الأورا" (الهيبة)
      const scoredParticipants = participants.map((p: any) => ({
        ...p,
        auraScore: ((p.followerCount || 0) * 2) + (Math.random() * 50)
      })).sort((a, b) => b.auraScore - a.auraScore);

      const top10 = scoredParticipants.slice(0, 10);
      const totalInJar = jarData.totalCoins || 0;
      
      const winnersWithPrizes = top10.map((winner, index) => {
        let prize = 0;
        if (index === 0) prize = Math.floor(totalInJar * 0.20);
        else if (index === 1) prize = Math.floor(totalInJar * 0.15);
        else if (index === 2) prize = Math.floor(totalInJar * 0.10);
        else prize = Math.floor((totalInJar * 0.25) / 7);

        updateDocumentNonBlocking(doc(firestore, 'users', winner.userId), { coins: increment(prize) });
        addDocumentNonBlocking(collection(firestore, 'users', winner.userId, 'notifications'), {
          type: 'vault_win',
          message: `🏺 لقد انكسرت الجرة وحصلت على حصتك! نلت ${prize} عملة تيمقاد.`,
          prize, createdAt: serverTimestamp(), read: false, fromUsername: 'نظام الخزنة', fromAvatar: ''
        });
        return { ...winner, prize };
      });

      const historyId = `jar_${new Date().toISOString().split('T')[0]}`;
      await setDoc(doc(firestore, 'vault_history', historyId), {
        totalCoins: totalInJar, winners: winnersWithPrizes,
        brokenAt: new Date().toISOString(), platformFee: Math.floor(totalInJar * 0.30)
      });

      updateDocumentNonBlocking(doc(firestore, 'vault', 'current_jar'), { status: 'broken', lastWinners: winnersWithPrizes });
      toast({ title: "🏺 كنز تيمقاد!", description: "انكسرت الجرة وتوزعت الكنوز على الأبطال." });
    } catch (e) { console.error(e); }
  };

  const handleResetJar = async () => {
    if (!firestore) return;
    await setDoc(doc(firestore, 'vault', 'current_jar'), { totalCoins: 0, status: 'active', createdAt: new Date().toISOString() });
  };

  const handleContribute = async () => {
    if (!firestore || !user || !profile || !jarData) return;
    if (jarData.status !== 'active') return toast({ variant: "destructive", description: "الجرة منكسرة، ننتظر الدورة القادمة 20:05." });
    if (hasParticipated) return toast({ variant: "destructive", description: "لقد شاركت بالفعل في هذه الجرة." });
    if ((profile.coins || 0) < 3) return toast({ variant: "destructive", title: "الرصيد لا يكفي", description: "تحتاج لـ 3 عملات للمشاركة." });

    setIsContributing(true);
    try {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { coins: increment(-3) });
      await setDoc(doc(firestore, 'vault', 'current_jar', 'participants', user.uid), {
        userId: user.uid, username: profile.username, avatar: profile.profilePictureUrl,
        verificationType: profile.verificationType || 'none', followerCount: profile.followerIds?.length || 0, joinedAt: serverTimestamp()
      });
      updateDocumentNonBlocking(doc(firestore, 'vault', 'current_jar'), { totalCoins: increment(3) });
      toast({ title: "مساهمة مباركة!", description: "أصبحت جزءاً من كنز تيمقاد اليوم." });
    } catch (error) { toast({ variant: "destructive", description: "فشل الوصول للخزنة." }); }
    finally { setIsContributing(false); }
  };

  const isBroken = jarData?.status === 'broken';

  return (
    <div className="min-h-screen bg-[#1A0F04] text-[#F3E5AB] flex flex-col items-center relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
      
      <main className="relative z-10 flex flex-col items-center gap-8 py-20 w-full max-w-2xl px-4">
        <div className="relative group">
          <AnimatePresence>
            {isContributing && (
              <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="absolute inset-0 flex items-center justify-center z-50">
                <div className="flex gap-1"><TimgadCoin size={48} /><TimgadCoin size={48} /><TimgadCoin size={48} /></div>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div animate={isBroken ? { rotate: [0, -2, 2, 0], scale: [1, 1.05, 1] } : { y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 5 }} className={`text-[200px] md:text-[280px] drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all ${isBroken ? 'grayscale brightness-50 opacity-40' : 'brightness-110'}`}>🏺</motion.div>
          {isBroken && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"><Trophy size={100} className="text-[#FBBF24] drop-shadow-[0_0_30px_rgba(251,191,36,0.6)]" /><span className="text-[10px] font-bold uppercase tracking-widest bg-black/40 px-3 py-1 mt-4 rounded-full border border-[#FBBF24]/20">كنز اليوم وُزّع</span></motion.div>}
        </div>

        <div className="flex flex-col items-center gap-6 text-center w-full">
          <div className="space-y-4">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#FBBF24]/40">إجمالي العملات في الجرة</h2>
            <motion.div key={jarData?.totalCoins} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="text-7xl md:text-9xl font-mono font-bold text-[#FBBF24] drop-shadow-[0_0_25px_rgba(251,191,36,0.3)]">
              {isJarLoading ? "..." : (jarData?.totalCoins || 0).toLocaleString()}
            </motion.div>
            <div className="flex items-center gap-2 bg-black/40 px-6 py-2 rounded-full border border-[#FBBF24]/10">
              <Clock size={14} className="text-[#FBBF24] animate-pulse" />
              <span className="text-sm font-mono font-bold text-[#FBBF24] tracking-widest">{timeLeft}</span>
            </div>
          </div>

          {!isBroken ? (
            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
              <Button className={`w-full rounded-full h-16 font-bold text-md gap-3 transition-all ${hasParticipated ? 'bg-black/20 text-[#FBBF24]/40' : 'bg-[#B45309] text-white hover:bg-[#D97706]'}`} onClick={handleContribute} disabled={isContributing || !!hasParticipated}>
                {isContributing ? <Loader2 className="animate-spin" /> : hasParticipated ? <Shield size={20} /> : <Plus size={20} />}
                {hasParticipated ? "أنت مشارك في السحب" : "المشاركة بـ 3 عملات تيمقاد"}
              </Button>
              <Card className="bg-black/20 border-[#B45309]/20 w-full rounded-none">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#FBBF24]"><TrendingUp size={14} /><h3 className="text-[10px] font-bold uppercase">قوانين الفوز بـ "الأورا"</h3></div>
                  <p className="text-[9px] text-[#F3E5AB]/60 text-right leading-relaxed">يتم ترتيب المشاركين بناءً على الهيبة (الأورا) المشتقة من المتابعين والتفاعل. الحصة الأكبر للأبطال العشرة الأوائل.</p>
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
