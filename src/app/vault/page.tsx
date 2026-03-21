
"use client"

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Shield, Trophy, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function VaultPage() {
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [timeLeft, setTimeLeft] = useState<string>('جاري الحساب...');
  const [isJoining, setIsJoining] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [adVisited, setAdVisited] = useState(false);

  const VERIFICATION_LINK = "https://www.profitablecpmratenetwork.com/yjnuc61v00?key=ac650d2bab02304bb887aca8076f1973";

  const jarRef = useMemoFirebase(() => firestore ? doc(firestore, 'vault', 'current_jar') : null, [firestore]);
  const { data: jarData, isLoading: isJarLoading } = useDoc(jarRef);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(userRef);

  const participationRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'vault', 'current_jar', 'participants', user.uid);
  }, [firestore, user?.uid]);
  const { data: participation } = useDoc(participationRef);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      const now = new Date();
      // توقيت الجزائر (GMT+1)
      const dzNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3600000));
      const breakTime = new Date(dzNow);
      breakTime.setHours(20, 0, 0, 0);
      
      const diff = breakTime.getTime() - dzNow.getTime();
      if (diff > 0) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${h}:${m}:${s}`);
      } else {
        setTimeLeft('انكسرت الجرة!');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVisitAd = () => {
    window.open(VERIFICATION_LINK, '_blank');
    setAdVisited(true);
    toast({ description: "تم التحقق من دعمك! يمكنك الآن المشاركة في الجرة." });
  };

  const handleJoinJar = async () => {
    if (!user || user.isAnonymous) {
      toast({ description: "يرجى تسجيل الدخول للمشاركة." });
      return;
    }
    if (participation) {
      toast({ description: "أنت مشارك بالفعل في جرة اليوم!" });
      return;
    }
    if ((profile?.coins || 0) < 3) {
      toast({ variant: "destructive", description: "رصيدك غير كافٍ للمشاركة (تحتاج 3 عملات)." });
      return;
    }

    setIsJoining(true);
    try {
      updateDocumentNonBlocking(doc(firestore!, 'users', user.uid), {
        coins: increment(-3)
      });

      updateDocumentNonBlocking(doc(firestore!, 'vault', 'current_jar'), {
        totalCoins: increment(3)
      });

      setDocumentNonBlocking(participationRef!, {
        userId: user.uid,
        username: profile?.username || 'مستكشف تيمقاد',
        avatar: profile?.profilePictureUrl || '',
        joinedAt: serverTimestamp()
      }, { merge: true });

      toast({ 
        title: "تم الانضمام! 🏺", 
        description: "لقد شاركت في جرة تيمقاد الملكية لليوم. بالتوفيق!" 
      });
    } catch (error) {
      toast({ variant: "destructive", description: "حدث خطأ أثناء المشاركة." });
    } finally {
      setIsJoining(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#1A0F04] text-[#F3E5AB] flex flex-col items-center relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(180,83,9,0.15),transparent_70%)]" />
      
      <main className="relative z-10 flex flex-col items-center gap-8 py-20 w-full max-w-2xl px-4 text-center">
        <motion.div animate={{ y: [-10, 10, -10] }} transition={{ repeat: Infinity, duration: 4 }} className="text-[180px] drop-shadow-[0_0_30px_rgba(180,83,9,0.5)] select-none">🏺</motion.div>
        
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
          {!adVisited && !participation ? (
            <div className="bg-black/40 p-6 rounded-2xl border border-[#B45309]/30 backdrop-blur-md space-y-4">
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#FBBF24]">خطوة دعم تيمقاد</h3>
                <p className="text-[10px] text-[#F3E5AB]/70 leading-relaxed">
                  للمشاركة في سحب الجرة الملكية، يرجى زيارة الرابط التالي أولاً لدعم استمرارية الجوائز.
                </p>
              </div>
              <Button 
                className="w-full bg-[#B45309] hover:bg-[#D97706] text-white font-bold h-12 rounded-full text-xs gap-2 shadow-xl"
                onClick={handleVisitAd}
              >
                <Sparkles size={16} />
                تفعيل المشاركة عبر الإعلان
              </Button>
            </div>
          ) : (
            <Button 
              className={cn(
                "w-full rounded-full h-16 text-white font-bold text-md shadow-xl active:scale-95 transition-all gap-2 animate-in fade-in zoom-in duration-500",
                participation ? "bg-green-700 cursor-default" : "bg-[#B45309] hover:bg-[#D97706]"
              )}
              onClick={handleJoinJar}
              disabled={isJoining || !!participation}
            >
              {isJoining ? (
                <Loader2 className="animate-spin" />
              ) : participation ? (
                <>
                  <Trophy size={20} />
                  أنت داخل السحب
                </>
              ) : (
                "المشاركة بـ 3 عملات تيمقاد"
              )}
            </Button>
          )}
          
          <div className="flex items-center justify-center gap-2 opacity-30">
            <Shield size={12} />
            <span className="text-[8px] font-bold uppercase tracking-widest">نظام حماية الكنوز مؤمن</span>
          </div>
        </div>
      </main>
    </div>
  );
}
