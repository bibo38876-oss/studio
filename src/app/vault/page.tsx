
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, Plus, Loader2, Trophy, History, Clock, AlertCircle, TrendingUp, Shield, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, increment, setDoc, serverTimestamp, collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
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
  const [nextResetIn, setNextResetIn] = useState<string>('');

  // بيانات المستخدم الحالي
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(userRef);

  // بيانات الجرة الحالية
  const jarRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'vault', 'current_jar');
  }, [firestore]);
  const { data: jarData, isLoading: isJarLoading } = useDoc(jarRef);

  // هل شارك المستخدم الحالي؟
  const participationRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'vault', 'current_jar', 'participants', user.uid);
  }, [firestore, user?.uid]);
  const { data: hasParticipated } = useDoc(participationRef);

  // تاريخ البطولات
  const winnersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vault_history'), orderBy('brokenAt', 'desc'), limit(5));
  }, [firestore]);
  const { data: historyData } = useCollection(winnersQuery);
  const lastJarHistory = historyData?.[0];

  // حساب الوقت بتوقيت الجزائر (UTC+1)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // تحويل الوقت الحالي لـ UTC ثم إضافة ساعة واحدة ليكون توقيت الجزائر
      const dzNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3600000));
      
      const breakTime = new Date(dzNow);
      breakTime.setHours(20, 0, 0, 0);

      const resetTime = new Date(dzNow);
      resetTime.setHours(20, 5, 0, 0);

      if (dzNow < breakTime) {
        // وقت الجرة نشطة
        const diff = breakTime.getTime() - dzNow.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}:${m}:${s}`);
        
        if (jarData?.status === 'broken' && dzNow.getHours() < 20) {
          // إذا كانت الحالة منكسرة والوقت لم يحن بعد (قبل الـ 8 ليلاً)
          // هذا يعني أننا في دورة جديدة لكن لم يتم تفعيلها
        }
      } else if (dzNow >= breakTime && dzNow < resetTime) {
        // وقت الانكسار والاحتفال
        setTimeLeft('انكسرت الجرة!');
        if (jarData?.status === 'active') {
          handleBreakJar();
        }
      } else {
        // بعد الساعة 20:05 - وقت البدء من جديد
        if (jarData?.status === 'broken') {
          handleResetJar();
        }
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

      // خوارزمية "أورا تيمقاد": الترتيب حسب (المتابعين * 2 + الإعجابات + حظ عشوائي)
      const scoredParticipants = participants.map((p: any) => ({
        ...p,
        auraScore: ((p.followerCount || 0) * 2) + (p.likesCount || 0) + (Math.random() * 50)
      })).sort((a, b) => b.auraScore - a.auraScore);

      const top10 = scoredParticipants.slice(0, 10);
      const totalInJar = jarData.totalCoins || 0;
      
      // توزيع الجوائز
      const winnersWithPrizes = top10.map((winner, index) => {
        let prize = 0;
        if (index === 0) prize = Math.floor(totalInJar * 0.20); // المركز الأول 20%
        else if (index === 1) prize = Math.floor(totalInJar * 0.15); // الثاني 15%
        else if (index === 2) prize = Math.floor(totalInJar * 0.10); // الثالث 10%
        else prize = Math.floor((totalInJar * 0.25) / 7); // الباقي 25% مقسمة على 7

        // إضافة العملات للفائز فعلياً
        updateDocumentNonBlocking(doc(firestore, 'users', winner.userId), {
          coins: increment(prize)
        });

        return { ...winner, prize };
      });

      // تسجيل في التاريخ
      const historyId = `jar_${new Date().toISOString().split('T')[0]}`;
      await setDoc(doc(firestore, 'vault_history', historyId), {
        totalCoins: totalInJar,
        winners: winnersWithPrizes,
        brokenAt: new Date().toISOString(),
        platformFee: Math.floor(totalInJar * 0.30)
      });

      updateDocumentNonBlocking(doc(firestore, 'vault', 'current_jar'), {
        status: 'broken',
        lastWinners: winnersWithPrizes
      });

      toast({ title: "🏺 كنز تيمقاد!", description: "انكسرت الجرة وتوزعت الكنوز على الأبطال." });
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetJar = async () => {
    if (!firestore) return;
    await setDoc(doc(firestore, 'vault', 'current_jar'), {
      totalCoins: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    // ملاحظة: في النسخة الإنتاجية يتم مسح المشاركين عبر Cloud Function
  };

  const handleContribute = async () => {
    if (!firestore || !user || !profile || !jarData) return;
    if (jarData.status !== 'active') {
      toast({ variant: "destructive", description: "الجرة منكسرة حالياً، ننتظر الدورة القادمة الساعة 20:05." });
      return;
    }
    if (hasParticipated) {
      toast({ variant: "destructive", description: "لقد وضعت عملاتك بالفعل في هذه الجرة." });
      return;
    }
    if ((profile.coins || 0) < 3) {
      toast({ variant: "destructive", title: "الخزانة لا تكفي", description: "تحتاج لـ 3 عملات للمشاركة في هذه الدورة." });
      return;
    }

    setIsContributing(true);
    try {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { coins: increment(-3) });
      await setDoc(doc(firestore, 'vault', 'current_jar', 'participants', user.uid), {
        userId: user.uid,
        username: profile.username,
        avatar: profile.profilePictureUrl,
        verificationType: profile.verificationType || 'none',
        followerCount: profile.followerIds?.length || 0,
        joinedAt: serverTimestamp()
      });
      updateDocumentNonBlocking(doc(firestore, 'vault', 'current_jar'), { totalCoins: increment(3) });
      toast({ title: "مساهمة مباركة!", description: "عملاتك الثلاث أصبحت الآن جزءاً من كنز تيمقاد." });
    } catch (error) {
      toast({ variant: "destructive", description: "فشل الوصول للخزنة." });
    } finally {
      setIsContributing(false);
    }
  };

  const isBroken = jarData?.status === 'broken';

  return (
    <div className="min-h-screen bg-[#1A0F04] text-[#F3E5AB] flex flex-col items-center relative overflow-hidden font-body">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
      
      <main className="relative z-10 flex flex-col items-center gap-8 select-none py-20 w-full max-w-2xl px-4">
        
        {/* حالة الجرة */}
        <div className="relative group">
          <AnimatePresence>
            {isContributing && (
              <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="absolute inset-0 flex items-center justify-center z-50">
                <div className="flex gap-1">
                  <TimgadCoin size={48} />
                  <TimgadCoin size={48} />
                  <TimgadCoin size={48} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={isBroken ? { rotate: [0, -2, 2, 0], scale: [1, 1.05, 1] } : { y: [-10, 10, -10] }}
            transition={{ repeat: Infinity, duration: 5 }}
            className={`text-[200px] md:text-[280px] drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)] transition-all duration-1000 ${isBroken ? 'grayscale brightness-50 opacity-40' : 'brightness-110 saturate-[0.8]'}`}
          >
            {isBroken ? '🏺' : '🏺'}
          </motion.div>
          
          {isBroken && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <Trophy size={100} className="text-[#FBBF24] drop-shadow-[0_0_30px_rgba(251,191,36,0.6)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] bg-black/40 px-3 py-1 mt-4 rounded-full border border-[#FBBF24]/20">كنز اليوم وُزّع</span>
            </motion.div>
          )}
        </div>

        {/* العدادات والمعلومات */}
        <div className="flex flex-col items-center gap-6 text-center w-full">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#FBBF24]/40">إجمالي العملات في الجرة</h2>
              <div className="flex items-center gap-6 justify-center">
                <TimgadCoin size={40} className="opacity-30" />
                <motion.div key={jarData?.totalCoins} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="text-7xl md:text-9xl font-mono font-bold tracking-tighter text-[#FBBF24] drop-shadow-[0_0_25px_rgba(251,191,36,0.3)]">
                  {isJarLoading ? "..." : (jarData?.totalCoins || 0).toLocaleString()}
                </motion.div>
                <TimgadCoin size={40} className="opacity-30" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 bg-black/40 px-6 py-2 rounded-full border border-[#FBBF24]/10 shadow-inner">
                <Clock size={14} className="text-[#FBBF24] animate-pulse" />
                <span className="text-sm font-mono font-bold text-[#FBBF24] tracking-widest">{timeLeft}</span>
              </div>
              <p className="text-[9px] text-[#F3E5AB]/40 uppercase tracking-tighter italic">تنكسر يومياً الساعة 20:00 بتوقيت الجزائر</p>
            </div>
          </div>

          {!isBroken ? (
            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
              <Button 
                className={`w-full rounded-full h-16 font-bold text-md gap-3 shadow-[0_0_40px_rgba(180,83,9,0.3)] border transition-all active:scale-95 ${hasParticipated ? 'bg-black/20 text-[#FBBF24]/40 border-transparent cursor-default' : 'bg-[#B45309] text-white hover:bg-[#D97706] border-[#FBBF24]/20 hover:shadow-[0_0_50px_rgba(180,83,9,0.5)]'}`}
                onClick={handleContribute}
                disabled={isContributing || !!hasParticipated}
              >
                {isContributing ? <Loader2 className="animate-spin" /> : hasParticipated ? <Shield size={20} /> : <Plus size={20} />}
                {hasParticipated ? "أنت مشارك في السحب" : "المشاركة بـ 3 عملات تيمقاد"}
              </Button>

              <Card className="bg-black/20 border-[#B45309]/20 w-full rounded-none">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#FBBF24] mb-1">
                    <TrendingUp size={14} />
                    <h3 className="text-[10px] font-bold uppercase tracking-wider">كيف تفوز بـ "أورا تيمقاد"؟</h3>
                  </div>
                  <p className="text-[9px] text-[#F3E5AB]/60 text-right leading-relaxed">
                    يتم ترتيب المشاركين العشرة الأوائل بناءً على قوة تأثيرهم الرقمي (عدد المتابعين + التفاعل اليومي). تحتاج لـ 3 عملات للمشاركة في هذه الدورة.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#B45309]/10">
                    <div className="text-right">
                      <span className="text-[8px] text-[#FBBF24] block font-bold">30% للمنصة</span>
                      <span className="text-[7px] text-[#F3E5AB]/40 italic">تطوير وصيانة</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-[#FBBF24] block font-bold">70% للأبطال</span>
                      <span className="text-[7px] text-[#F3E5AB]/40 italic">توزع على الـ 10 الأوائل</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="flex flex-col items-center gap-2 text-accent border-y border-accent/10 py-4">
                <Trophy size={20} className="mb-1" />
                <h3 className="text-sm font-bold uppercase tracking-[0.2em]">مجلس أبطال تيمقاد</h3>
                <p className="text-[8px] text-muted-foreground">أعلى 10 مستخدمين من حيث الـ "أورا" لهذه الدورة</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(jarData?.lastWinners || []).map((winner: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: i * 0.1 }}
                    key={winner.userId} 
                    className={`p-3 border flex items-center justify-between transition-all ${i < 3 ? 'bg-[#2D1606] border-[#FBBF24]/40 shadow-lg' : 'bg-black/20 border-[#B45309]/10 opacity-80'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-orange-600 text-white' : 'bg-black/60 text-white'}`}>
                          {i + 1}
                        </span>
                        <Avatar className="h-10 w-10 border border-[#FBBF24]/20">
                          <AvatarImage src={winner.avatar} />
                          <AvatarFallback>{winner.username?.[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex flex-col text-right">
                        <div className="flex items-center gap-1 leading-tight">
                          <VerifiedBadge type={winner.verificationType} size={12} />
                          <span className="text-[11px] font-bold text-[#FBBF24]">{winner.username}</span>
                        </div>
                        <span className="text-[8px] text-[#F3E5AB]/40 uppercase tracking-tighter">بطل أورا تيمقاد</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-accent">+{winner.prize}</span>
                        <TimgadCoin size={16} />
                      </div>
                      <span className="text-[7px] text-[#FBBF24]/30 font-mono uppercase">
                        {i === 0 ? '20%' : i === 1 ? '15%' : i === 2 ? '10%' : '3.5%'} حصة
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-primary/5 p-4 border border-primary/10 flex items-start gap-3">
                <Info size={16} className="text-primary shrink-0" />
                <p className="text-[9px] text-muted-foreground leading-relaxed text-right">
                  تبدأ الدورة التالية الساعة <span className="text-primary font-bold">20:05 بتوقيت الجزائر</span>. تأكد من المشاركة مبكراً لضمان مكانك في قائمة المتنافسين على جرة الغد.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* سجل البطولات السابقة */}
        {!isBroken && lastJarHistory && (
          <div className="mt-12 w-full border-t border-[#FBBF24]/5 pt-8 space-y-6">
            <div className="flex items-center justify-between px-2">
              <span className="text-[8px] text-[#FBBF24]/20 uppercase tracking-[0.3em] font-bold italic">سجلات الخلود</span>
              <div className="flex items-center gap-2 text-[#FBBF24]/30">
                <History size={14} />
                <h4 className="text-[9px] font-bold uppercase tracking-widest">آخر الأبطال الموثقين</h4>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {(lastJarHistory.winners || []).slice(0, 5).map((w: any) => (
                <div key={w.userId} className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-all cursor-default scale-90">
                  <Avatar className="h-7 w-7 border border-[#FBBF24]/20 grayscale hover:grayscale-0 transition-all">
                    <AvatarImage src={w.avatar} />
                    <AvatarFallback className="text-[8px]">{w.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-bold text-[#F3E5AB]">{w.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-8 flex flex-col items-center gap-2 opacity-10">
        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#FBBF24] to-transparent" />
        <p className="text-[7px] font-bold uppercase tracking-[0.5em]">Ancient Timgad Vault System v3.0</p>
      </div>
    </div>
  );
}
