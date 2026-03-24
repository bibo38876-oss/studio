
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, increment, collection, query, where, limit, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, PlayCircle, Clock, ShieldCheck, TrendingUp, ChevronRight, MessageSquare, Sparkles, ArrowDownToLine, Wallet, ExternalLink, Globe } from 'lucide-react';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SMARTLINK = "https://www.profitablecpmratenetwork.com/yjnuc61v00?key=ac650d2bab02304bb887aca8076f1973";
const SOCIAL_BAR = "https://pl28954367.profitablecpmratenetwork.com/6d/ad/6f/6dad6f94ed63930519f283f5feb4c15d.js";
const DAILY_LIMIT = 25;

export default function EarnPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isRewardLoading, setIsRewardLoading] = useState(false);
  const [rewardTimer, setRewardTimer] = useState(0);
  const [faucetTimer, setFaucetTimer] = useState('00:00');
  const [canClaim, setCanClaim] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captcha, setCaptcha] = useState({ q: '', a: 0 });
  const [answer, setAnswer] = useState('');
  const [pendingReward, setPendingReward] = useState({ amt: 0, type: '', link: '' });

  const userRef = useMemoFirebase(() => (firestore && user?.uid) ? doc(firestore, 'users', user.uid) : null, [firestore, user?.uid]);
  const { data: profile, isLoading } = useDoc(userRef);

  const adPostsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), where('isAdPost', '==', true), where('remainingAdBudget', '>', 0), orderBy('createdAt', 'desc'), limit(10));
  }, [firestore]);
  const { data: adPosts } = useCollection(adPostsQuery);

  useEffect(() => {
    const loadSocialBar = () => {
      const existing = document.getElementById('social-bar-script');
      if (existing) existing.remove();
      const script = document.createElement('script');
      script.id = 'social-bar-script';
      script.src = SOCIAL_BAR;
      script.async = true;
      document.body.appendChild(script);
    };
    loadSocialBar();
    const interval = setInterval(loadSocialBar, 60000);
    return () => {
      clearInterval(interval);
      document.getElementById('social-bar-script')?.remove();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!profile) return;
      const lastFaucet = profile.lastFaucetAt ? new Date(profile.lastFaucetAt).getTime() : 0;
      const diff = (lastFaucet + 3600000) - Date.now();
      if (diff <= 0) { setFaucetTimer('جاهز'); setCanClaim(true); } 
      else {
        const m = Math.floor(diff / 60000), s = Math.floor((diff % 60000) / 1000);
        setFaucetTimer(`${m}:${s < 10 ? '0' : ''}${s}`); setCanClaim(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [profile]);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1, n2 = Math.floor(Math.random() * 9) + 1;
    setCaptcha({ q: `${n1} + ${n2}`, a: n1 + n2 });
    setAnswer('');
    setShowCaptcha(true);
  };

  const startTask = (amt: number, type: string, link: string) => {
    if ((profile?.dailyEarned || 0) >= DAILY_LIMIT) return toast({ variant: "destructive", description: "وصلت للحد اليومي (25 عملة)." });
    window.open(link, '_blank');
    setIsRewardLoading(true);
    setRewardTimer(7);
    const timerInterval = setInterval(() => {
      setRewardTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          setPendingReward({ amt, type, link });
          generateCaptcha();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyCaptcha = () => {
    if (parseInt(answer) === captcha.a) {
      if (firestore && user) {
        const updateData: any = { adEarnings: increment(pendingReward.amt), dailyEarned: increment(pendingReward.amt) };
        if (pendingReward.type === 'الصنبور الساعي') updateData.lastFaucetAt = new Date().toISOString();
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid), updateData);
        toast({ title: "تمت إضافة الأرباح! ✨", description: `لقد حصلت على ${pendingReward.amt} عملة.` });
      }
      setShowCaptcha(false);
      setIsRewardLoading(false);
    } else {
      toast({ variant: "destructive", description: "إجابة خاطئة." });
    }
  };

  const handleTransferEarnings = async () => {
    const amount = profile?.adEarnings || 0;
    if (amount <= 0) return;
    if (firestore && user) {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { coins: increment(amount), adEarnings: 0 });
      toast({ title: "تم التحويل بنجاح! 💰" });
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <Navbar />
      <main className="container mx-auto max-w-xl pt-12 pb-24 px-4">
        <header className="flex items-center justify-between mb-8 bg-primary/20 p-6 rounded-2xl border border-primary/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/20"><TrendingUp size={24} /></div>
            <div><h1 className="text-xl font-bold uppercase tracking-tight">مركز أرباح تيمقاد</h1><p className="text-[10px] opacity-60 font-medium">تفاعل مع المحتوى المميز واربح عملات</p></div>
          </div>
          <div className="text-right">
            <span className="text-[8px] text-muted-foreground uppercase font-bold">حصالة الأرباح</span>
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/5">
              <span className="text-sm font-bold text-accent">{(profile?.adEarnings || 0).toFixed(2)}</span><TimgadCoin size={16} />
            </div>
          </div>
        </header>

        <Card className="mb-8 border-none bg-gradient-to-r from-accent/20 to-primary/20 overflow-hidden shadow-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-accent uppercase">المحفظة الرئيسية</h3>
              <div className="flex items-center gap-2"><span className="text-lg font-bold">{(profile?.coins || 0).toFixed(2)}</span><TimgadCoin size={18} /></div>
            </div>
            <Button onClick={handleTransferEarnings} disabled={isTransferring || (profile?.adEarnings || 0) <= 0} className="bg-accent hover:bg-accent/90 text-white font-bold rounded-full h-10 px-6 gap-2 shadow-lg shadow-accent/20 transition-all active:scale-95">
              {isTransferring ? <Loader2 className="animate-spin h-4 w-4" /> : <ArrowDownToLine size={16} />} تحويل للمحفظة
            </Button>
          </CardContent>
        </Card>

        <AnimatePresence>
          {showCaptcha && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-6 p-6 bg-accent/10 border-2 border-accent/30 rounded-2xl text-center space-y-4 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-center gap-2 text-accent"><ShieldCheck size={20} /><h3 className="text-sm font-bold">أثبت أنك إنسان</h3></div>
              <p className="text-3xl font-mono font-bold text-white tracking-widest">{captcha.q} = ؟</p>
              <div className="flex gap-2 max-w-[220px] mx-auto">
                <Input type="number" className="bg-black/40 border-accent/20 text-center font-bold text-lg h-11" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="الحل..." />
                <Button onClick={handleVerifyCaptcha} className="bg-accent hover:bg-accent/90 text-white font-bold h-11 px-6">تحقق</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-end gap-2 text-accent border-r-4 border-accent pr-3">
              <Globe size={18} /><h2 className="text-sm font-bold uppercase tracking-tighter">سوق الروابط الممولة</h2>
            </div>
            <div className="grid gap-3">
              {adPosts && adPosts.length > 0 ? adPosts.map((ad: any) => (
                <Card key={ad.id} className="bg-slate-900/50 border-white/5 hover:border-accent/30 transition-all cursor-pointer" onClick={() => startTask(0.7, 'زيارة ممولة', ad.adLink)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-accent/10 rounded-full flex items-center justify-center text-accent"><ExternalLink size={18} /></div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white line-clamp-1">{ad.content}</p>
                        <p className="text-[8px] text-muted-foreground">بواسطة: {ad.authorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                      <span className="text-[10px] font-bold text-accent">+0.7</span><TimgadCoin size={12} />
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <p className="text-[10px] text-center text-muted-foreground py-4">لا توجد روابط ممولة حالياً.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-end gap-2 text-primary border-r-4 border-primary pr-3">
              <Sparkles size={18} /><h2 className="text-sm font-bold uppercase tracking-tighter">المهام السريعة</h2>
            </div>
            <div className="space-y-3">
              <RewardCard title="المكافأة الذكية" desc="افتح الرابط وانتظر 7 ثوانٍ" amt={0.5} icon={<Sparkles size={24} />} loading={isRewardLoading} timer={rewardTimer} onClick={() => startTask(0.5, "المكافأة الذكية", SMARTLINK)} />
              <RewardCard title="الصنبور الساعي" desc="مكافأة مجانية كل ساعة" amt={0.2} icon={<Clock size={24} />} loading={isRewardLoading} disabled={!canClaim} text={faucetTimer} color="bg-amber-600" onClick={() => { setPendingReward({ amt: 0.2, type: "الصنبور الساعي", link: '#' }); generateCaptcha(); }} />
            </div>
          </section>
        </div>

        <div className="mt-12 space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5 text-center">
          <div className="flex justify-between items-center px-1"><span className="text-[10px] font-bold text-muted-foreground uppercase">تقدمك اليومي</span><span className="text-[10px] font-bold text-primary">{(profile?.dailyEarned || 0).toFixed(2)} / {DAILY_LIMIT} عملة</span></div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000" style={{ width: `${Math.min(((profile?.dailyEarned || 0) / DAILY_LIMIT) * 100, 100)}%` }} /></div>
          <p className="text-[8px] text-muted-foreground italic">يتم إعادة ضبط الحد اليومي عند منتصف الليل بتوقيت الجزائر.</p>
        </div>
      </main>
    </div>
  );
}

function RewardCard({ title, desc, icon, onClick, loading, timer, disabled, text, color = "bg-green-600" }: any) {
  return (
    <Card className="bg-slate-900/50 border-white/5 overflow-hidden group hover:border-primary/30 transition-all">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">{icon}</div>
          <div className="text-right"><h3 className="text-sm font-bold text-white">{title}</h3><p className="text-[10px] text-muted-foreground font-medium">{desc}</p></div>
        </div>
        <Button onClick={onClick} disabled={loading || disabled} className={cn("h-11 px-6 font-bold text-xs rounded-xl shadow-lg transition-all", color, (loading || disabled) && "opacity-50 grayscale")}>
          {loading && timer > 0 ? <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" />{timer} ث</span> : text || "احصل الآن"}
        </Button>
      </CardContent>
    </Card>
  );
}
