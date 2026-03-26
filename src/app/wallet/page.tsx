
"use client"

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, BadgeCheck, Coins, Trophy, Wallet, ShieldCheck, ArrowDownToLine, Loader2, CheckCircle2, AlertCircle, Sparkles, ExternalLink, Gift, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirebase, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, serverTimestamp, increment } from 'firebase/firestore';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';

const PACKAGES = [
  { id: "pkg_1", amount: 100, price: "1 DGB", label: "حقيبة البداية" },
  { id: "pkg_2", amount: 500, price: "5 DGB", label: "صندوق النشاط" },
  { id: "pkg_3", amount: 1000, price: "10 DGB", label: "خزانة التميز" },
  { id: "pkg_4", amount: 5000, price: "50 DGB", label: "كنز الريادة" }
];

const VERIFICATION_COST = 500;
const CONVERSION_RATE = 100; 
const MIN_WITHDRAW_DGB = 5; 
const CONVERSION_FEE_PERCENT = 3;
const WALLET_ADDRESS = "dgb1q7wzxlvnuv8py8vxpy8vxpy8vxpy8vxpy8vxp"; // عنوان محفظة DGB تجريبي
const SMARTLINK_REWARD = "https://www.profitablecpmratenetwork.com/yjnuc61v00?key=ac650d2bab02304bb887aca8076f1973";

export default function WalletPage() {
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [fastPayAddress, setFastPayAddress] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isPurchasingVerification, setIsPurchasingVerification] = useState(false);

  const [isRewardLoading, setIsRewardLoading] = useState(false);
  const [rewardTimer, setRewardRewardTimer] = useState(0);

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isInfiniteAdmin = user?.email === ADMIN_EMAIL;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  const calculatedDGB = useMemo(() => {
    const amount = parseFloat(withdrawAmount) || 0;
    const dgb = amount / CONVERSION_RATE;
    const fee = (dgb * CONVERSION_FEE_PERCENT) / 100;
    return {
      raw: dgb,
      fee: fee,
      final: Math.max(0, dgb - fee)
    };
  }, [withdrawAmount]);

  const handlePackageSelect = (pkg: any) => {
    const priceAmount = pkg.price.split(' ')[0];
    window.location.href = `digibyte:${WALLET_ADDRESS}?amount=${priceAmount}`;
    toast({ description: "جاري فتح المحفظة للدفع المباشر..." });
    setTimeout(() => {
      router.push(`/support?package=${encodeURIComponent(pkg.label)}&amount=${pkg.amount}&price=${encodeURIComponent(pkg.price)}`);
    }, 2000);
  };

  const handleGetReward = () => {
    if (isRewardLoading) return;
    window.open(SMARTLINK_REWARD, '_blank');
    setIsRewardLoading(true);
    setRewardRewardTimer(10);
    const timer = setInterval(() => {
      setRewardRewardTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          completeReward();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const completeReward = async () => {
    if (!user || !firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      coins: increment(0.5)
    });
    toast({
      title: "تم استلام المكافأة! 🎁",
      description: "لقد حصلت على 0.5 عملة تيمقاد لدعمك للمنصة.",
    });
    setIsRewardLoading(false);
  };

  const handleWithdrawRequest = async () => {
    const amount = parseFloat(withdrawAmount);
    const minCoins = MIN_WITHDRAW_DGB * CONVERSION_RATE;
    if (!amount || amount < minCoins) {
      toast({ variant: "destructive", description: `الحد الأدنى هو ${minCoins} عملة.` });
      return;
    }
    if (amount > (profile?.coins || 0)) {
      toast({ variant: "destructive", description: "رصيدك غير كافٍ." });
      return;
    }
    if (!fastPayAddress.trim()) {
      toast({ variant: "destructive", description: "يرجى إدخل عنوان محفظة DGB." });
      return;
    }
    setIsWithdrawing(true);
    try {
      await addDocumentNonBlocking(collection(firestore!, 'withdrawal_requests'), {
        userId: user!.uid, username: profile?.username, email: user!.email, amount, finalDGB: calculatedDGB.final, address: fastPayAddress.trim(), status: 'pending', createdAt: serverTimestamp()
      });
      toast({ title: "تم استلام طلبك! ⏳", description: "سيتم التحويل قريباً." });
      setIsWithdrawOpen(false); setWithdrawAmount(''); setFastPayAddress('');
    } catch (e) { toast({ variant: "destructive", description: "فشل الطلب." }); }
    finally { setIsWithdrawing(false); }
  };

  return (
    <div className="min-h-screen bg-[#2D1606] text-[#F3E5AB]">
      <Navbar />
      <main className="container mx-auto max-w-[500px] pt-10 pb-20 px-4 relative z-10">
        <div className="bg-[#451A03]/80 backdrop-blur-md sticky top-8 z-30 py-4 border-b border-[#B45309]/30 flex items-center justify-between mb-10 shadow-2xl px-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="h-8 w-8 rounded-full text-[#FBBF24] hover:bg-[#78350F] flex items-center justify-center"><ChevronRight size={20} /></button>
            <div className="flex flex-col text-right">
              <h1 className="text-sm font-bold text-[#FBBF24] uppercase tracking-tighter">خزانة تيمقاد الملكية</h1>
              <span className="text-[8px] text-[#FBBF24]/60 uppercase tracking-[0.2em]">إدارة الأصول الرقمية</span>
            </div>
          </div>
          
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-8 rounded-full border-[#FBBF24]/30 text-[#FBBF24] hover:bg-[#B45309] text-[10px] font-bold gap-2">
                <ArrowDownToLine size={14} />
                سحب (Min: 5 DGB)
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#2D1606] text-[#F3E5AB] border-[#B45309] rounded-none max-w-[95vw] sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-[#FBBF24]">سحب الأرباح إلى DGB</DialogTitle>
                <DialogDescription className="text-[10px] text-[#F3E5AB]/60">100 عملة = 1 DGB | رسوم تحويل 3%</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-primary/10 border border-primary/20 p-3 rounded-sm space-y-1">
                  <p className="text-[9px] text-[#FBBF24]/80 font-bold text-right flex items-center justify-end gap-1">
                    <ShieldCheck size={12} className="text-green-400" /> نموذج سحب تيمقاد السريع
                  </p>
                  <p className="text-[8px] text-[#F3E5AB]/40 text-right">يتم معالجة الطلبات يدوياً لضمان الأمان المالي.</p>
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold uppercase text-[#FBBF24]/60">كمية العملات (الحد الأدنى: 500)</label>
                  <Input 
                    type="number" 
                    placeholder="500" 
                    className="bg-[#451A03] border-[#B45309] text-[#FBBF24] h-10 text-xs text-right focus:ring-accent" 
                    value={withdrawAmount} 
                    onChange={(e) => setWithdrawAmount(e.target.value)} 
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold uppercase text-[#FBBF24]/60">عنوان محفظة DGB المعتمد</label>
                  <Input 
                    placeholder="dgb..." 
                    className="bg-[#451A03] border-[#B45309] text-[#FBBF24] h-10 text-xs text-right focus:ring-accent" 
                    value={fastPayAddress} 
                    onChange={(e) => setFastPayAddress(e.target.value)} 
                  />
                </div>

                {parseFloat(withdrawAmount) >= 500 && (
                  <div className="bg-primary/10 p-3 border border-primary/20 space-y-2 rounded-sm">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span>{calculatedDGB.raw.toFixed(2)} DGB</span>
                      <span className="text-[#F3E5AB]/60">القيمة الإجمالية:</span>
                    </div>
                    <div className="border-t border-white/5 pt-2 flex justify-between text-xs font-bold">
                      <span className="text-green-400">{calculatedDGB.final.toFixed(2)} DGB</span>
                      <span className="text-[#FBBF24]">الصافي المستلم (بعد الرسوم):</span>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full bg-[#B45309] hover:bg-[#D97706] text-white font-bold h-11 rounded-full text-xs shadow-xl active:scale-95 transition-all" 
                  onClick={handleWithdrawRequest} 
                  disabled={isWithdrawing || !withdrawAmount || !fastPayAddress}
                >
                  {isWithdrawing ? <Loader2 className="animate-spin h-4 w-4" /> : "إرسال طلب السحب الآن"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col items-center gap-10 text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative">
            <div className="absolute inset-0 bg-[#FBBF24]/20 rounded-full blur-3xl animate-pulse" />
            <div className="relative z-10 p-4 bg-[#451A03] rounded-full border-4 border-[#B45309] shadow-[0_0_50px_rgba(180,83,9,0.5)]">
              <TimgadCoin size={180} />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <Card className="bg-[#451A03] border-[#B45309]/40 shadow-xl rounded-none border-r-4 border-r-[#FBBF24]">
              <CardHeader className="p-4 flex flex-row-reverse items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#FBBF24]">الرصيد الحالي</CardTitle>
                <Coins size={14} className="text-[#FBBF24]" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-right"><p className="text-3xl font-bold text-[#FBBF24]">{isInfiniteAdmin ? '∞' : (profile?.coins || 0).toFixed(2)}</p></CardContent>
            </Card>
            
            <Card className="bg-[#451A03] border-[#B45309]/40 shadow-xl rounded-none border-r-4 border-r-green-500 relative overflow-hidden group">
              <CardHeader className="p-4 flex flex-row-reverse items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-green-400">مكافأة الإعلانات</CardTitle>
                <Gift size={14} className="text-green-400" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-right space-y-2">
                <p className="text-[10px] text-white/60">احصل على 0.5 عملة فوراً</p>
                <Button 
                  className={cn(
                    "w-full h-8 rounded-full text-[10px] font-bold transition-all",
                    isRewardLoading ? "bg-secondary text-primary" : "bg-green-600 hover:bg-green-700 text-white"
                  )}
                  onClick={handleGetReward}
                  disabled={isRewardLoading}
                >
                  {isRewardLoading ? (
                    <span className="flex items-center gap-2">
                      <Clock size={12} className="animate-spin" />
                      انتظر {rewardTimer} ثانية
                    </span>
                  ) : (
                    "احصل على المكافأة الآن"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <section className="w-full text-right space-y-6 pt-6">
            <div className="flex items-center justify-end gap-3 text-[#FBBF24] border-r-4 border-[#FBBF24] pr-3"><Wallet size={18} /><h3 className="font-bold text-md uppercase tracking-tighter">باقات الشحن السريع</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PACKAGES.map((pkg) => (
                <Card key={pkg.id} className="bg-[#451A03] border-[#B45309]/30 rounded-none overflow-hidden hover:border-[#FBBF24] transition-colors group">
                  <CardContent className="p-6 flex flex-col items-center gap-4">
                    <TimgadCoin size={48} className="group-hover:scale-110 transition-transform" />
                    <div className="text-center"><p className="text-xl font-bold text-[#FBBF24]">{pkg.amount} عملة</p><p className="text-[10px] text-[#FBBF24]/60 mt-1">السعر: {pkg.price}</p></div>
                    <Button className="w-full rounded-none font-bold h-9 bg-primary text-white text-[10px] hover:bg-primary/90" onClick={() => handlePackageSelect(pkg)}>اطلب وشحن الآن</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
