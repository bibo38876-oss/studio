
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, Plus, Loader2, Trophy, History, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, increment, setDoc, serverTimestamp, collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

export default function VaultPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [isContributing, setIsContributing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');

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

  // قائمة الفائزين في الدورة الحالية (إذا انكسرت) أو السابقة
  const winnersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vault_history'), orderBy('brokenAt', 'desc'), limit(1));
  }, [firestore]);
  const { data: historyData } = useCollection(winnersQuery);
  const lastJarHistory = historyData?.[0];

  // حساب الوقت المتبقي
  useEffect(() => {
    if (!jarData?.expiresAt) return;

    const interval = setInterval(() => {
      const expiry = new Date(jarData.expiresAt).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('انتهى الوقت!');
        handleBreakJar();
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}:${minutes}:${seconds}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jarData?.expiresAt]);

  // منطق كسر الجرة واختيار الفائزين (يتم استدعاؤه عند انتهاء الوقت)
  const handleBreakJar = async () => {
    if (!firestore || jarData?.status !== 'active') return;

    try {
      // جلب جميع المشاركين
      const participantsSnap = await getDocs(collection(firestore, 'vault', 'current_jar', 'participants'));
      const participants = participantsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (participants.length === 0) {
        // إذا لم يشارك أحد، فقط أعد الضبط
        resetJar();
        return;
      }

      // اختيار 3 فائزين عشوائياً (أو أقل إذا كان المشاركون أقل)
      const shuffled = [...participants].sort(() => 0.5 - Math.random());
      const winners = shuffled.slice(0, 3);

      // تسجيل النتيجة في التاريخ
      const historyId = `jar_${Date.now()}`;
      await setDoc(doc(firestore, 'vault_history', historyId), {
        totalCoins: jarData.totalCoins || 0,
        winners: winners,
        brokenAt: new Date().toISOString()
      });

      // تحديث حالة الجرة الحالية
      updateDocumentNonBlocking(doc(firestore, 'vault', 'current_jar'), {
        status: 'broken',
        lastWinners: winners
      });

      // تنبيه
      toast({ title: "انكسرت الجرة!", description: "تم الإعلان عن الفائزين المحظوظين." });
      
      // إعادة ضبط تلقائية بعد ساعة مثلاً
      setTimeout(() => resetJar(), 3600000); 
    } catch (e) {
      console.error("Error breaking jar:", e);
    }
  };

  const resetJar = async () => {
    if (!firestore) return;
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    await setDoc(doc(firestore, 'vault', 'current_jar'), {
      totalCoins: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: expiry.toISOString()
    });
    
    // ملاحظة: مسح المشاركين يحتاج مسح يدوي في Firebase أو تجاهلهم بالاعتماد على التواريخ
    // للتبسيط في MVP سنعتمد على الحقول
  };

  const handleContribute = async () => {
    if (!firestore || !user || !profile || !jarData) return;

    if (jarData.status !== 'active') {
      toast({ variant: "destructive", description: "الجرة منكسرة حالياً، انتظر الدورة القادمة." });
      return;
    }

    if (hasParticipated) {
      toast({ variant: "destructive", description: "لقد وضعت عملتك بالفعل في هذه الجرة." });
      return;
    }

    if ((profile.coins || 0) < 1) {
      toast({ variant: "destructive", title: "لا توجد عملات", description: "تحتاج لعملة واحدة للمشاركة." });
      return;
    }

    setIsContributing(true);
    try {
      // خصم عملة
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        coins: increment(-1)
      });

      // إضافة مشاركة
      await setDoc(doc(firestore, 'vault', 'current_jar', 'participants', user.uid), {
        userId: user.uid,
        username: profile.username,
        avatar: profile.profilePictureUrl,
        verificationType: profile.verificationType || 'none',
        joinedAt: serverTimestamp()
      });

      // تحديث العداد
      updateDocumentNonBlocking(doc(firestore, 'vault', 'current_jar'), {
        totalCoins: increment(1)
      });

      toast({ title: "شكراً لمشاركتك!", description: "دخلت الآن في قائمة المرشحين للكنز." });
    } catch (error) {
      toast({ variant: "destructive", description: "فشل الاتصال بالخزنة." });
    } finally {
      setIsContributing(false);
    }
  };

  const isBroken = jarData?.status === 'broken';

  return (
    <div className="min-h-screen bg-[#1A0F04] text-[#F3E5AB] flex flex-col items-center relative overflow-hidden">
      <Navbar />
      
      {/* المؤثرات البصرية */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D1606]/0 via-[#FBBF24]/5 to-[#2D1606]/0 pointer-events-none" />

      <div className="fixed top-12 left-4 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full text-[#FBBF24]/50 hover:text-[#FBBF24] hover:bg-white/5 transition-all">
          <ChevronRight size={28} />
        </Button>
      </div>

      <main className="relative z-10 flex flex-col items-center gap-8 select-none py-20 w-full max-w-2xl px-4">
        
        {/* حالة الجرة */}
        <motion.div className="relative">
          <AnimatePresence>
            {isContributing && (
              <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }} className="absolute inset-0 flex items-center justify-center z-50">
                <TimgadCoin size={48} />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={isBroken ? { rotate: [0, -10, 10, 0], scale: [1, 1.1, 0.9] } : { y: [-5, 5, -5] }}
            transition={{ repeat: isBroken ? 0 : Infinity, duration: 4 }}
            className={`text-[180px] md:text-[240px] drop-shadow-[0_10px_40px_rgba(0,0,0,0.9)] filter transition-all ${isBroken ? 'grayscale brightness-50' : 'brightness-90 saturate-50'}`}
          >
            {isBroken ? '💥' : '🏺'}
          </motion.div>
          
          {isBroken && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Trophy size={80} className="text-accent drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]" />
            </motion.div>
          )}
        </motion.div>

        {/* العدادات والمعلومات */}
        <div className="flex flex-col items-center gap-6 text-center w-full">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.5em] text-[#FBBF24]/40">
                {isBroken ? "الكنز الموزع" : "إجمالي العملات في الجرة"}
              </h2>
              <div className="flex items-center gap-4 justify-center">
                <TimgadCoin size={32} className="opacity-50" />
                <motion.div key={jarData?.totalCoins} initial={{ scale: 1.5 }} animate={{ scale: 1 }} className="text-6xl md:text-8xl font-mono font-bold tracking-tighter text-[#FBBF24] drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                  {isJarLoading ? "..." : (jarData?.totalCoins || 0).toLocaleString()}
                </motion.div>
                <TimgadCoin size={32} className="opacity-50" />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-black/20 px-4 py-1 rounded-full border border-[#FBBF24]/10">
              <Clock size={12} className="text-[#FBBF24]/60" />
              <span className="text-xs font-mono text-[#FBBF24]">{isBroken ? "انتهت الدورة" : `تنكسر خلال: ${timeLeft}`}</span>
            </div>
          </div>

          {/* زر المشاركة أو عرض الفائزين */}
          {!isBroken ? (
            <div className="flex flex-col items-center gap-4">
              <Button 
                className={`rounded-full px-10 h-14 font-bold text-sm gap-2 shadow-2xl border transition-all active:scale-95 ${hasParticipated ? 'bg-secondary/20 text-[#FBBF24]/40 border-transparent' : 'bg-[#B45309] text-white hover:bg-[#D97706] border-[#FBBF24]/20'}`}
                onClick={handleContribute}
                disabled={isContributing || !!hasParticipated}
              >
                {isContributing ? <Loader2 className="animate-spin" /> : hasParticipated ? <Sparkles size={18} /> : <Plus size={18} />}
                {hasParticipated ? "أنت مشارك في السحب" : "وضع عملة في الجرة"}
              </Button>
              <p className="text-[10px] text-[#F3E5AB]/30 italic">عملة واحدة فقط لكل دورة.</p>
            </div>
          ) : (
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="flex items-center justify-center gap-3 text-accent border-y border-accent/10 py-2">
                <Trophy size={16} />
                <h3 className="text-xs font-bold uppercase tracking-widest">المحظوظون في هذه الدورة</h3>
                <Trophy size={16} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(jarData?.lastWinners || []).map((winner: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.2 }}
                    key={winner.id} 
                    className="bg-[#2D1606] p-4 border border-[#FBBF24]/20 rounded-none flex flex-col items-center gap-2"
                  >
                    <div className="relative">
                      <Avatar className="h-14 w-14 border-2 border-[#FBBF24]/30">
                        <AvatarImage src={winner.avatar} />
                        <AvatarFallback>{winner.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1">
                        <VerifiedBadge type={winner.verificationType} size={14} />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#FBBF24]">{winner.username}</span>
                    <span className="text-[8px] text-[#F3E5AB]/40 uppercase">بطل الدورة</span>
                  </motion.div>
                ))}
              </div>

              {(!jarData?.lastWinners || jarData.lastWinners.length === 0) && (
                <p className="text-[10px] text-muted-foreground italic">لم يشارك أحد في هذه الدورة.</p>
              )}
            </div>
          )}
        </div>

        {/* سجل البطولات السابقة */}
        {lastJarHistory && !isBroken && (
          <div className="mt-12 w-full border-t border-[#FBBF24]/5 pt-8 space-y-4">
            <div className="flex items-center gap-2 text-[#FBBF24]/30 px-2">
              <History size={14} />
              <h4 className="text-[9px] font-bold uppercase tracking-widest">آخر الأبطال الموثقين</h4>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {(lastJarHistory.winners || []).map((w: any) => (
                <div key={w.id} className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                  <Avatar className="h-6 w-6 border border-[#FBBF24]/20">
                    <AvatarImage src={w.avatar} />
                    <AvatarFallback className="text-[8px]">{w.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-[9px] font-bold">{w.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-8 flex flex-col items-center gap-2 opacity-10">
        <div className="h-[1px] w-24 bg-[#FBBF24]" />
        <p className="text-[7px] font-bold uppercase tracking-[0.4em]">Ancient Vault Collective v2.0</p>
      </div>
    </div>
  );
}
