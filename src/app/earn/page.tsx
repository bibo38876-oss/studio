
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, PlayCircle, Clock, Sparkles, ShieldCheck, TrendingUp, Coins, ChevronRight } from 'lucide-react';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SMARTLINK_URL = "https://www.profitablecpmratenetwork.com/yjnuc61v00?key=ac650d2bab02304bb887aca8076f1973";
const DAILY_LIMIT = 25;

export default function EarnPage() {
  const { firestore, user } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isRewardLoading, setIsRewardLoading] = useState(false);
  const [rewardTimer, setRewardTimer] = useState(0);
  const [faucetTimer, setFaucetTimer] = useState('00:00');
  const [canClaimFaucet, setCanClaimFaucet] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  // تحديث عداد الصنبور (Faucet)
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

  const handleSmartlinkReward = () => {
    if (isRewardLoading) return;
    if ((profile?.dailyEarned || 0) >= DAILY_LIMIT) {
      toast({ variant: "destructive", description: "لقد وصلت للحد اليومي للأرباح (25 عملة)." });
      return;
    }

    window.open(SMARTLINK_URL, '_blank');
    setIsRewardLoading(true);
    setRewardTimer(10);

    const timer = setInterval(() => {
      setRewardTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          completeReward(0.5, "مكافأة الرابط الذكي");
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
    
    // تفعيل Popunder البرمجي
    const script = document.createElement('script');
    script.src = 'https://pl28954370.profitablecpmratenetwork.com/07/71/59/0771598f8f7ac7b55732a0256a9d6147.js';
    script.async = true;
    document.body.appendChild(script);

    toast({ description: "جاري تحميل الإعلان... ابقَ في الصفحة للحصول على الجائزة." });
    
    setTimeout(() => {
      completeReward(0.3, "مكافأة مشاهدة إعلان");
    }, 5000);
  };

  const handleFaucetClaim = () => {
    if (!canClaimFaucet) return;
    completeReward(0.2, "مكافأة الصنبور الساعي");
    updateDocumentNonBlocking(doc(firestore!, 'users', user!.uid), {
      lastFaucetAt: new Date().toISOString()
    });
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

        <div className="space-y-4">
          <Card className="bg-slate-900/50 border-white/5 overflow-hidden group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <Gift size={24} />
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold">المكافأة الذكية</h3>
                  <p className="text-[10px] text-muted-foreground">افتح الرابط واحصل على 0.50 عملة</p>
                </div>
              </div>
              <Button 
                onClick={handleSmartlinkReward} 
                disabled={isRewardLoading}
                className={cn("h-10 rounded-xl px-6 font-bold text-xs gap-2", isRewardLoading ? "bg-slate-800" : "bg-green-600 hover:bg-green-700")}
              >
                {isRewardLoading ? (
                  <><Clock size={14} className="animate-spin" /> {rewardTimer} ثانية</>
                ) : "احصل الآن"}
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
                  <p className="text-[10px] text-muted-foreground">شاهد إعلان Popunder واحصل على 0.30 عملة</p>
                </div>
              </div>
              <Button onClick={handleWatchAd} className="h-10 rounded-xl px-6 font-bold text-xs bg-blue-600 hover:bg-blue-700">شاهد</Button>
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
                disabled={!canClaimFaucet}
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
              نظام الأرباح في تيمقاد يعتمد على تفاعلك الحقيقي. نحن نقدر دعمك للمنصة عبر مشاهدة الإعلانات، ونقوم بتحويل جزء من هذه العوائد إليك مباشرة كعملات تيمقاد ذهبية.
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
