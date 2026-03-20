
"use client"

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, BadgeCheck, Coins, Trophy, Wallet, ShieldCheck, ArrowDownToLine, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
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

const PACKAGES = [
  { id: "pkg_1", amount: 100, price: "1 TRX", label: "حقيبة البداية" },
  { id: "pkg_2", amount: 500, price: "5 TRX", label: "صندوق النشاط" },
  { id: "pkg_3", amount: 1000, price: "10 TRX", label: "خزانة التميز" },
  { id: "pkg_4", amount: 5000, price: "50 TRX", label: "كنز الريادة" }
];

const VERIFICATION_COST = 500;
const CONVERSION_RATE = 100; 
const MIN_WITHDRAW_TRX = 20; 
const CONVERSION_FEE_PERCENT = 3;
const WALLET_ADDRESS = "TNWaZ3FbTkpca8ytBaUVz8s7Aa39ofGXz2";

export default function WalletPage() {
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [fastPayAddress, setFastPayAddress] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isPurchasingVerification, setIsPurchasingVerification] = useState(false);

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isInfiniteAdmin = user?.email === ADMIN_EMAIL;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  const calculatedTRX = useMemo(() => {
    const amount = parseInt(withdrawAmount) || 0;
    const trx = amount / CONVERSION_RATE;
    const fee = (trx * CONVERSION_FEE_PERCENT) / 100;
    return {
      raw: trx,
      fee: fee,
      final: Math.max(0, trx - fee)
    };
  }, [withdrawAmount]);

  const handlePackageSelect = (pkg: any) => {
    // توجيه مباشر للدفع أو صفحة الدعم
    const priceAmount = pkg.price.split(' ')[0];
    window.location.href = `tron:${WALLET_ADDRESS}?amount=${priceAmount}`;
    toast({ description: "جاري فتح المحفظة للدفع المباشر..." });
    // للتأكد، نفتح صفحة الدعم في خلفية العمل إذا لم تدعم البيئة روابط البروتوكول
    setTimeout(() => {
      router.push(`/support?package=${encodeURIComponent(pkg.label)}&amount=${pkg.amount}&price=${encodeURIComponent(pkg.price)}`);
    }, 2000);
  };

  const handlePurchaseVerification = async () => {
    if (!user || !firestore || !profile) return;
    
    if (profile.verificationType === 'blue' || profile.verificationType === 'gold') {
      toast({ description: "حسابك موثق بالفعل." });
      return;
    }

    if ((profile.coins || 0) < VERIFICATION_COST) {
      toast({ 
        variant: "destructive", 
        title: "رصيد غير كافٍ", 
        description: `تحتاج إلى ${VERIFICATION_COST} عملة للحصول على التوثيق.` 
      });
      return;
    }

    setIsPurchasingVerification(true);
    try {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        coins: increment(-VERIFICATION_COST),
        verificationType: 'blue'
      });

      addDocumentNonBlocking(collection(firestore, 'platform_revenue'), {
        type: 'verification_purchase',
        amount: VERIFICATION_COST,
        fromUserId: user.uid,
        createdAt: serverTimestamp()
      });

      addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'notifications'), {
        type: 'system',
        message: "🎉 مبروك! تم توثيق حسابك بنجاح. يمكنك الآن الاستفادة من ميزات المبدعين الموثقين وتحقيق الدخل عند وصولك لـ 500 متابع.",
        createdAt: serverTimestamp(),
        read: false
      });

      toast({ 
        title: "مبروك التوثيق! 🛡️", 
        description: "أصبح حسابك الآن موثقاً بالشارة الزرقاء في تيمقاد." 
      });
    } catch (error) {
      toast({ variant: "destructive", description: "فشل إتمام العملية." });
    } finally {
      setIsPurchasingVerification(false);
    }
  };

  const handleWithdrawRequest = async () => {
    const amount = parseInt(withdrawAmount);
    const minCoins = MIN_WITHDRAW_TRX * CONVERSION_RATE;

    if (!amount || amount < minCoins) {
      toast({ variant: "destructive", description: `الحد الأدنى للسحب هو ${minCoins} عملة (${MIN_WITHDRAW_TRX} TRX).` });
      return;
    }
    if (amount > (profile?.coins || 0)) {
      toast({ variant: "destructive", description: "رصيدك غير كافٍ." });
      return;
    }
    if (!fastPayAddress.trim()) {
      toast({ variant: "destructive", description: "يرجى إدخال عنوان محفظة TRX." });
      return;
    }

    setIsWithdrawing(true);
    try {
      await addDocumentNonBlocking(collection(firestore!, 'withdrawal_requests'), {
        userId: user!.uid,
        username: profile?.username || 'مستخدم تيمقاد',
        email: user!.email,
        amount: amount,
        trxAmount: calculatedTRX.raw,
        feeTRX: calculatedTRX.fee,
        finalTRX: calculatedTRX.final,
        address: fastPayAddress.trim(),
        status: 'pending',
        createdAt: serverTimestamp()
      });

      toast({
        title: "تم استلام طلبك! ⏳",
        description: `سيتم مراجعة الطلب وتحويل ${calculatedTRX.final.toFixed(2)} TRX قريباً.`,
      });
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      setFastPayAddress('');
    } catch (error) {
      toast({ variant: "destructive", description: "فشل إرسال طلب السحب." });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2D1606] text-[#F3E5AB]">
      <Navbar />

      <main className="container mx-auto max-w-xl pt-10 pb-20 px-4 md:px-0 relative z-10">
        <div className="bg-[#451A03]/80 backdrop-blur-md sticky top-8 z-30 py-4 border-b border-[#B45309]/30 flex items-center justify-between mb-10 shadow-2xl text-right px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full text-[#FBBF24] hover:bg-[#78350F]">
              <ChevronRight size={20} />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-[#FBBF24] uppercase tracking-tighter">خزانة تيمقاد الملكية</h1>
              <span className="text-[8px] text-[#FBBF24]/60 uppercase tracking-[0.2em] font-medium">إدارة الأصول الرقمية</span>
            </div>
          </div>
          
          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-8 rounded-full border-[#FBBF24]/30 text-[#FBBF24] hover:bg-[#B45309] text-[10px] font-bold gap-2">
                <ArrowDownToLine size={14} />
                سحب (Min: 20 TRX)
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#2D1606] text-[#F3E5AB] border-[#B45309]">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-[#FBBF24]">سحب الأرباح إلى TRX</DialogTitle>
                <DialogDescription className="text-[10px] text-[#F3E5AB]/60">100 عملة = 1 TRX | رسوم تحويل 3%</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold uppercase text-[#FBBF24]/60">كمية العملات (Min: 2000)</label>
                  <Input 
                    type="number" 
                    placeholder="2000" 
                    className="bg-[#451A03] border-[#B45309] text-[#FBBF24] h-10 text-xs text-right"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold uppercase text-[#FBBF24]/60">عنوان محفظة TRX</label>
                  <Input 
                    placeholder="عنوان المحفظة..." 
                    className="bg-[#451A03] border-[#B45309] text-[#FBBF24] h-10 text-xs text-right"
                    value={fastPayAddress}
                    onChange={(e) => setFastPayAddress(e.target.value)}
                  />
                </div>

                {parseInt(withdrawAmount) >= 2000 && (
                  <div className="bg-primary/10 p-3 border border-primary/20 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-[#FBBF24]">{calculatedTRX.raw.toFixed(2)} TRX</span>
                      <span className="text-[#F3E5AB]/60">القيمة:</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-red-400">-{calculatedTRX.fee.toFixed(2)} TRX</span>
                      <span className="text-[#F3E5AB]/60">الرسوم (3%):</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex justify-between items-center text-xs font-bold">
                      <span className="text-green-400">{calculatedTRX.final.toFixed(2)} TRX</span>
                      <span className="text-[#FBBF24]">الصافي المستلم:</span>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  className="w-full bg-[#B45309] hover:bg-[#D97706] text-white font-bold h-10 rounded-full text-xs"
                  onClick={handleWithdrawRequest}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? <Loader2 className="animate-spin" /> : "تأكيد السحب"}
                </Button>
              </DialogFooter>
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
              <CardContent className="p-4 pt-0 text-right">
                <p className="text-3xl font-bold text-[#FBBF24]">{isInfiniteAdmin ? '∞' : (profile?.coins || 0).toFixed(1)}</p>
              </CardContent>
            </Card>

            <Card className="bg-[#451A03] border-[#B45309]/40 shadow-xl rounded-none border-r-4 border-r-blue-500">
              <CardHeader className="p-4 flex flex-row-reverse items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-blue-400">مرتبة الحساب</CardTitle>
                <Trophy size={14} className="text-blue-400" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-right">
                <div className="flex items-center justify-end gap-2">
                  <VerifiedBadge type={profile?.verificationType || 'none'} size={20} />
                  <p className="text-xl font-bold text-[#F3E5AB]">
                    {profile?.verificationType === 'gold' ? 'نخبة تيمقاد' : profile?.verificationType === 'blue' ? 'عضو موثق' : 'مستكشف'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {(!profile?.verificationType || profile?.verificationType === 'none') && (
            <Card className="w-full bg-blue-500/10 border border-blue-500/30 rounded-none overflow-hidden group">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4 text-right">
                  <div className="h-14 w-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shrink-0">
                    <BadgeCheck size={32} className="text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-md font-bold text-blue-400">وثق حسابك الآن</h3>
                    <p className="text-[10px] text-[#F3E5AB]/60 leading-relaxed">
                      احصل على الشارة الزرقاء بـ 500 عملة لتفعيل الربح من منشوراتك (يتطلب 500 متابع).
                    </p>
                  </div>
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-8 rounded-full shadow-xl shrink-0 gap-2"
                  onClick={handlePurchaseVerification}
                  disabled={isPurchasingVerification || (profile?.coins || 0) < VERIFICATION_COST}
                >
                  {isPurchasingVerification ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
                  شراء التوثيق (500 عملة)
                </Button>
              </CardContent>
            </Card>
          )}

          <section className="w-full text-right space-y-6 pt-6">
            <div className="flex items-center justify-end gap-3 text-[#FBBF24] border-r-4 border-[#FBBF24] pr-3">
              <Wallet size={18} />
              <h3 className="font-bold text-md uppercase tracking-tighter">باقات الشحن السريع</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PACKAGES.map((pkg) => (
                <Card key={pkg.id} className="bg-[#451A03] border-[#B45309]/30 rounded-none overflow-hidden hover:border-[#FBBF24] transition-colors group">
                  <CardContent className="p-6 flex flex-col items-center gap-4">
                    <div className="relative">
                      <TimgadCoin size={48} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-[#FBBF24]">{pkg.amount} عملة</p>
                      <p className="text-[10px] text-[#FBBF24]/60 mt-1">السعر: {pkg.price} (TRX)</p>
                    </div>
                    <Button className="w-full rounded-none font-bold h-9 bg-primary text-white text-[10px] hover:bg-primary/90" onClick={() => handlePackageSelect(pkg)}>اطلب وشحن الآن</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-2 py-10 opacity-40">
            <ShieldCheck size={14} />
            <span className="text-[8px] font-bold uppercase tracking-widest">Powered by Timgad Royal Treasury Protocols</span>
          </div>
        </div>
      </main>
    </div>
  );
}
