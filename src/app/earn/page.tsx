
"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Gift, PlayCircle, Clock, ShieldCheck, TrendingUp, ChevronRight, MessageSquare } from 'lucide-react';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SMARTLINK = "https://www.profitablecpmratenetwork.com/yjnuc61v00?key=ac650d2bab02304bb887aca8076f1973";
const SOCIAL_BAR = "https://pl28954367.profitablecpmratenetwork.com/6d/ad/6f/6dad6f94ed63930519f283f5feb4c15d.js";
const DAILY_LIMIT = 25;

export default function EarnPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isRewardLoading, setIsRewardLoading] = useState(false);
  const [rewardTimer, setRewardTimer] = useState(0);
  const [faucetTimer, setFaucetTimer] = useState('00:00');
  const [canClaim, setCanClaim] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captcha, setCaptcha] = useState({ q: '', a: 0 });
  const [answer, setAnswer] = useState('');
  const [pending, setPending] = useState({ amt: 0, type: '' });

  const userRef = useMemoFirebase(() => (firestore && user?.uid) ? doc(firestore, 'users', user.uid) : null, [firestore, user?.uid]);
  const { data: profile, isLoading } = useDoc(userRef);

  useEffect(() => {
    const loadAd = () => {
      document.getElementById('sb-script')?.remove();
      const s = document.createElement('script');
      s.id = 'sb-script'; s.src = SOCIAL_BAR; s.async = true;
      document.body.appendChild(s);
    };
    loadAd();
    const inv = setInterval(loadAd, 60000);
    return () => { clearInterval(inv); document.getElementById('sb-script')?.remove(); };
  }, []);

  useEffect(() => {
    const inv = setInterval(() => {
      if (!profile) return;
      const diff = (new Date(profile.lastFaucetAt || 0).getTime() + 3600000) - Date.now();
      if (diff <= 0) { setFaucetTimer('جاهز'); setCanClaim(true); }
      else {
        const m = Math.floor(diff / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setFaucetTimer(`${m}:${s < 10 ? '0' : ''}${s}`);
        setCanClaim(false);
      }
    }, 1000);
    return () => clearInterval(inv);
  }, [profile]);

  const startTask = (amt: number, type: string, isPop = false) => {
    if ((profile?.dailyEarned || 0) >= DAILY_LIMIT) return toast({ variant: "destructive", description: "وصلت للحد اليومي." });
    if (isPop) {
      const s = document.createElement('script');
      s.src = 'https://pl28954370.profitablecpmratenetwork.com/07/71/59/0771598f8f7ac7b55732a0256a9d6147.js';
      s.async = true; document.body.appendChild(s);
    } else window.open(SMARTLINK, '_blank');

    setIsRewardLoading(true); setRewardTimer(7);
    const inv = setInterval(() => {
      setRewardTimer(p => {
        if (p <= 1) {
          clearInterval(inv);
          const n1 = Math.floor(Math.random() * 9) + 1, n2 = Math.floor(Math.random() * 9) + 1;
          setCaptcha({ q: `${n1} + ${n2}`, a: n1 + n2 });
          setPending({ amt, type }); setShowCaptcha(true);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  const verify = () => {
    if (parseInt(answer) === captcha.a) {
      if (firestore && user) {
        const data: any = { coins: increment(pending.amt), dailyEarned: increment(pending.amt) };
        if (pending.type.includes('الصنبور')) data.lastFaucetAt = new Date().toISOString();
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid), data);
        toast({ title: "تمت إضافة الأرباح! ✨", description: `حصلت على ${pending.amt} عملة.` });
      }
      setShowCaptcha(false); setIsRewardLoading(false); setAnswer('');
    } else {
      toast({ variant: "destructive", description: "إجابة خاطئة." });
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <Navbar />
      <main className="container mx-auto max-w-xl pt-12 pb-20 px-4">
        <header className="flex items-center justify-between mb-8 bg-primary/20 p-6 rounded-2xl border border-primary/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-xl shadow-lg"><TrendingUp size={24} /></div>
            <div><h1 className="text-xl font-bold uppercase">مركز الأرباح</h1><p className="text-[10px] opacity-60">تفاعل واربح TRX</p></div>
          </div>
          <div className="text-right">
            <span className="text-[8px] text-muted-foreground uppercase">رصيدك</span>
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/5">
              <span className="text-sm font-bold text-accent">{(profile?.coins || 0).toFixed(2)}</span>
              <TimgadCoin size={16} />
            </div>
          </div>
        </header>

        <AnimatePresence>
          {showCaptcha && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6 p-6 bg-accent/10 border-2 border-accent rounded-2xl text-center space-y-4">
              <h3 className="text-sm font-bold text-accent flex items-center justify-center gap-2"><ShieldCheck size={18} /> أثبت أنك إنسان</h3>
              <p className="text-2xl font-mono font-bold">{captcha.q} = ؟</p>
              <div className="flex gap-2 max-w-[200px] mx-auto">
                <Input type="number" className="bg-black/40 text-center font-bold" value={answer} onChange={e => setAnswer(e.target.value)} />
                <Button onClick={verify} className="bg-accent">تحقق</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3"><MessageSquare size={18} className="text-blue-400" /><p className="text-[10px] text-blue-300">تظهر إعلانات الرسائل هنا كل دقيقة لدعم المنصة.</p></div>
          
          <TaskCard title="المكافأة الذكية" desc="افتح الرابط (7 ث) وحل الكابتشا" amt={0.5} icon={<Gift size={24} />} loading={isRewardLoading} timer={rewardTimer} onClick={() => startTask(0.5, "المكافأة الذكية")} />
          <TaskCard title="شاهد إعلان واربح" desc="مشاهدة Popunder واحصل على 0.3" amt={0.3} icon={<PlayCircle size={24} />} loading={isRewardLoading} timer={rewardTimer} color="bg-blue-600" onClick={() => startTask(0.3, "مشاهدة إعلان", true)} />
          <TaskCard title="الصنبور الساعي" desc="مكافأة مجانية كل ساعة" amt={0.2} icon={<Clock size={24} />} loading={isRewardLoading} disabled={!canClaim} text={faucetTimer} color="bg-amber-600" onClick={() => { setPending({ amt: 0.2, type: "الصنبور الساعي" }); const n1=Math.floor(Math.random()*9)+1, n2=Math.floor(Math.random()*9)+1; setCaptcha({q:`${n1} + ${n2}`, a:n1+n2}); setShowCaptcha(true); }} />
        </div>

        <div className="mt-10 space-y-4">
          <div className="flex justify-between px-2"><span className="text-[10px] font-bold opacity-50">إحصائيات اليوم</span><span className="text-[10px] font-bold text-primary">{(profile?.dailyEarned || 0).toFixed(2)} / {DAILY_LIMIT}</span></div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${Math.min(((profile?.dailyEarned || 0) / DAILY_LIMIT) * 100, 100)}%` }} /></div>
        </div>
      </main>
    </div>
  );
}

function TaskCard({ title, desc, icon, onClick, loading, timer, disabled, text, color = "bg-green-600" }: any) {
  return (
    <Card className="bg-slate-900/50 border-white/5 overflow-hidden">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-primary">{icon}</div>
          <div className="text-right"><h3 className="text-sm font-bold">{title}</h3><p className="text-[10px] text-muted-foreground">{desc}</p></div>
        </div>
        <Button onClick={onClick} disabled={loading || disabled} className={cn("h-10 px-6 font-bold text-xs rounded-xl", color, (loading || disabled) && "opacity-50")}>
          {loading && timer > 0 ? `${timer} ث` : text || "احصل"}
        </Button>
      </CardContent>
    </Card>
  );
}
