
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, PlayCircle, Clock, Sparkles, ShieldCheck, TrendingUp, ChevronRight, CheckCircle2, MessageSquare } from 'lucide-react';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SMARTLINK_URL = "https://www.profitablecpmratenetwork.com/yjnuc61v00?key=ac650d2bab02304bb887aca8076f1973";
const SOCIAL_BAR_SCRIPT = "https://pl28954367.profitablecpmratenetwork.com/6d/ad/6f/6dad6f94ed63930519f283f5feb4c15d.js";
const DAILY_LIMIT = 25;

export default function EarnPage() {
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isRewardLoading, setIsRewardLoading] = useState(false);
  const [rewardTimer, setRewardTimer] = useState(0);
  const [faucetTimer, setFaucetTimer] = useState('00:00');
  const [canClaimFaucet, setCanClaimFaucet] = useState(false);

  // حالة الكابتشا
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaProblem, setCaptchaProblem] = useState<{q: string, a: number} | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingType, setPendingType] = useState('');

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  // نظام إعلانات Social Bar المتجدد كل دقيقة
  useEffect(() => {
    const loadSocialBar = () => {
      const existingScript = document.getElementById('social-bar-dynamic');
      if (existingScript) existingScript.remove();

      const script = document.createElement('script');
      script.id = 'social-bar-dynamic';
      script.src = SOCIAL_BAR_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    };

    loadSocialBar();
    const adInterval = setInterval(loadSocialBar, 60000); // تجديد كل دقيقة

    return () => {
      clearInterval(adInterval);
      const script = document.getElementById('social-bar-dynamic');
      if (script) script.remove();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!profile) return;
      const now = Date.now();
      const lastClaim = profile.lastFaucetAt ? new Date(profile.lastFaucetAt).getTime() : 0;
      const diff = (lastClaim + 3600000) - now;

      if (diff <= 0) {
        setFaucetTimer('جاهز الآن');
        setCanClaimFaucet(true);
      } else {
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setFaucetTimer(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
        setCanClaimFaucet(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [profile]);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaProblem({ q: `${n1} + ${n2}`, a: n1 + n2 });
    setUserAnswer('');
    setShowCaptcha(true);
  };

  const handleSmartlinkReward = () => {
    if (isRewardLoading) return;
    if ((profile?.dailyEarned || 0) >= DAILY_LIMIT) {
      toast({ variant: "destructive", description: "لقد وصلت للحد اليومي للأرباح (25 عملة)." });
      return;
    }

    window.open(SMARTLINK_URL, '_blank');
    setIsRewardLoading(true);
    setRewardTimer(7); 

    const timer = setInterval(() => {
      setRewardTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPendingAmount(0.5);
          setPendingType("مكافأة الرابط الذكي");
          generateCaptcha();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleWatchAd = () => {
    if ((profile?.dailyEarned || 0) >= DAILY_LIMIT) {
      toast({ variant: "destructive", description: "لقد وصلت للحد اليومي للأرباح." });
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://pl28954370.profitablecpmratenetwork.com/07/71/59/0771598f8f7ac7b55732a0256a9d6147.js';
    script.async = true;
    document.body.appendChild(script);

    toast({ description: "جاري تحميل الإعلان... ابقَ 7 ثوانٍ للحصول على الجائزة." });
    
    setIsRewardLoading(true);
    setRewardTimer(7);

    const timer = setInterval(() => {
      setRewardTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPendingAmount(0.3);
          setPendingType("مكافأة مشاهدة إعلان");
          generateCaptcha();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleFaucetClaim = () => {
    if (!canClaimFaucet) return;
    setPendingAmount(0.2);
    setPendingType("مكافأة الصنبور الساعي");
    generateCaptcha();
  };

  const verifyAndComplete = () => {
    if (parseInt(userAnswer) === captchaProblem?.a) {
      completeReward(pendingAmount, pendingType);
      setShowCaptcha(false);
      if (pendingType === "مكافأة الصنبور الساعي") {
        updateDocumentNonBlocking(doc(firestore!, 'users', user!.uid), {
          lastFaucetAt: new Date().toISOString()
        });
      }
    } else {
      toast({ variant: "destructive", title: "إجابة خاطئة", description: "يرجى المحاولة مرة أخرى." });
      generateCaptcha();
    }
  };

  const completeReward = (amount: number, type: string) => {
    if (!user || !firestore) return;
    
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      coins: increment(amount),
      dailyEarned: increment(amount)
    });

    toast({
      title: "تمت إضافة الأرباح! ✨",
      description: `لقد حصلت على ${amount} عملة مقابل ${type}.`,
    });
    setIsRewardLoading(false);
  };

  if (isProfileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <Navbar />
      <main className="container mx-auto max-w-xl pt-12 pb-20 px-4">
        <header className="flex items-center justify-between mb-8 bg-primary/20 p-6 rounded-2xl border border-primary/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold uppercase tracking-tighter">مركز أرباح تيمقاد</h1>
              <p className="text-[10px] text-primary-foreground/60">تفاعل واربح عملات TRX</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-bold text-muted-foreground uppercase mb-1">رصيدك الحالي</span>
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/5">
              <span className="text-sm font-bold text-accent">{(profile?.coins || 0).toFixed(2)}</span>
              <TimgadCoin size={16} />
            </div>
          </div>
        </header>

        <AnimatePresence>
          {showCaptcha && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6 p-6 bg-accent/10 border-2 border-accent rounded-2xl text-center space-y-4 shadow-2xl shadow-accent/10"
            >
              <h3 className="text-sm font-bold text-accent flex items-center justify-center gap-2">
                <ShieldCheck size={18} />
                أثبت أنك إنسان (كابتشا)
              </h3>
              <div className="flex flex-col items-center gap-4">
                <p className="text-2xl font-mono font-bold tracking-widest">{captchaProblem?.q} = ؟</p>
                <div className="flex gap-2 w-full max-w-[200px]">
                  <Input 
                    type="number" 
                    placeholder="الناتج" 
                    className="bg-black/40 border-accent/30 text-center text-lg font-bold"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verifyAndComplete()}
                  />
                  <Button onClick={verifyAndComplete} className="bg-accent hover:bg-accent/90 text-white">تحقق</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {/* تنبيه خاص بإعلانات الرسائل المتجددة */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 animate-pulse">
            <MessageSquare size={18} className="text-blue-400 shrink-0" />
            <p className="text-[10px] text-blue-300 font-medium">تظهر إعلانات الرسائل الربحية هنا كل دقيقة لدعم المنصة.</p>
          </div>

          <Card className="bg-slate-900/50 border-white/5 overflow-hidden group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <Gift size={24} />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold">المكافأة الذكية</h3>
                  <p className="text-[10px] text-muted-foreground">افتح الرابط (7 ثوانٍ) وحل الكابتشا لربح 0.50 عملة</p>
                </div>
              </div>
              <Button 
                onClick={handleSmartlinkReward} 
                disabled={isRewardLoading}
                className={cn("h-10 rounded-xl px-6 font-bold text-xs gap-2", isRewardLoading ? "bg-slate-800" : "bg-green-600 hover:bg-green-700")}
              >
                {isRewardLoading && rewardTimer > 0 ? (
                  <><Clock size={14} className="animate-spin" /> {rewardTimer} ثوانٍ</>
                ) : isRewardLoading && showCaptcha ? "انتظار الحل" : "احصل الآن"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-white/5 overflow-hidden group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <PlayCircle size={24} />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold">شاهد إعلان واربح</h3>
                  <p className="text-[10px] text-muted-foreground">مشاهدة Popunder واحصل على 0.30 عملة</p>
                </div>
              </div>
              <Button 
                onClick={handleWatchAd} 
                disabled={isRewardLoading}
                className="h-10 rounded-xl px-6 font-bold text-xs bg-blue-600 hover:bg-blue-700"
              >
                {isRewardLoading && rewardTimer > 0 ? `${rewardTimer} ث` : "شاهد"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-white/5 overflow-hidden group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  <Clock size={24} />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold">الصنبور الساعي</h3>
                  <p className="text-[10px] text-muted-foreground">مكافأة مجانية كل ساعة (0.20 عملة)</p>
                </div>
              </div>
              <Button 
                onClick={handleFaucetClaim} 
                disabled={!canClaimFaucet || isRewardLoading}
                className={cn("h-10 rounded-xl px-6 font-bold text-xs min-w-[80px]", canClaimFaucet ? "bg-amber-600 hover:bg-amber-700" : "bg-slate-800 text-muted-foreground")}
              >
                {faucetTimer}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">إحصائيات اليوم</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-primary">{(profile?.dailyEarned || 0).toFixed(2)} / {DAILY_LIMIT}</span>
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${Math.min(((profile?.dailyEarned || 0) / DAILY_LIMIT) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3">
            <ShieldCheck size={18} className="text-primary mt-0.5" />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              نظام الأرباح في تيمقاد يعتمد على التفاعل الحقيقي. تأكد من البقاء في الصفحة وحل الكابتشا بشكل صحيح لضمان استلام مكافأتك فوراً. إعلانات الرسائل تتجدد كل دقيقة لزيادة فرص دعمك للمنصة.
            </p>
          </div>
        </div>

        <footer className="mt-16 text-center">
          <p className="text-[8px] text-muted-foreground uppercase tracking-[0.2em] mb-4">Institutional Revenue Division</p>
          <Button variant="ghost" size="sm" className="text-[9px] text-primary font-bold gap-2" onClick={() => router.push('/wallet')}>
            انتقل للمحفظة للسحب
            <ChevronRight size={14} />
          </Button>
        </footer>
      </main>
    </div>
  );
}
