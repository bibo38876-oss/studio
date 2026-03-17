
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Info, Sparkles, TrendingUp, Wallet, ShieldCheck, Star, Scale, Gavel, AlertCircle, Package, BadgeCheck, Loader2, Coins, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { useState } from 'react';

export default function WalletPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [isVerifying, setIsVerifying] = useState(false);

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isInfiniteAdmin = user?.email === ADMIN_EMAIL;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  const handlePackageClick = () => {
    toast({
      title: "قريباً في خزانة تيمقاد",
      description: "نظام شحن الكنوز قيد التدقيق القانوني حالياً.",
    });
  };

  const handleBuyVerification = async () => {
    if (!firestore || !user || !profile) return;
    
    // Bypass check for infinite admin
    if (!isInfiniteAdmin && (profile.coins || 0) < 500) {
      toast({
        variant: "destructive",
        title: "الكنز لا يكفي",
        description: "تحتاج إلى 500 عملة لتوثيق حسابك. اجمع المزيد من المكافآت أو الدعم.",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 3);

      // Bypass deduction for infinite admin
      if (!isInfiniteAdmin) {
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
          coins: increment(-500),
          verificationType: 'blue',
          verificationExpiresAt: expiryDate.toISOString()
        });
      } else {
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
          verificationType: 'blue',
          verificationExpiresAt: expiryDate.toISOString()
        });
      }

      toast({
        title: "تم نيل التوثيق!",
        description: "مبروك! لقد أصبحت من نخبة تيمقاد الموثقين لمدة 3 أشهر.",
      });
    } catch (error) {
      toast({ variant: "destructive", description: "فشل في فتح قفل التوثيق." });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2D1606] text-[#F3E5AB]">
      <Navbar />

      {/* Background patterns for a wooden texture feel */}
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />

      <main className="container mx-auto max-w-xl pt-10 pb-20 px-4 md:px-0 relative z-10">
        {/* Header - Wooden theme */}
        <div className="bg-[#451A03]/80 backdrop-blur-md sticky top-8 z-30 py-4 border-b border-[#B45309]/30 flex items-center gap-4 mb-10 shadow-2xl">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full text-[#FBBF24] hover:bg-[#78350F]">
            <ChevronRight size={20} />
          </Button>
          <div className="flex flex-col text-right">
            <h1 className="text-sm font-bold text-[#FBBF24] uppercase tracking-tighter">خزانة تيمقاد الملكية {isInfiniteAdmin && '∞'}</h1>
            <span className="text-[8px] text-[#FBBF24]/60 uppercase tracking-[0.2em] font-medium">Ancient Rewards & Treasure Vault</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-10 text-center">
          {/* Large Coin Section with glowing effect */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-[#FBBF24]/20 rounded-full blur-3xl animate-pulse" />
            <div className="relative z-10 p-4 bg-[#451A03] rounded-full border-4 border-[#B45309] shadow-[0_0_50px_rgba(180,83,9,0.5)]">
              <TimgadCoin size={180} className="drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
            </div>
          </motion.div>

          <div className="space-y-3 px-6">
            <h2 className="text-2xl font-bold text-[#FBBF24] font-headline tracking-tighter">ثروتك الرقمية في تيمقاد</h2>
            <p className="text-xs text-[#F3E5AB]/70 max-w-sm mx-auto leading-relaxed italic">
              "هنا تُحفظ كنوزك التي جمعتها بجهدك وإبداعك. عملة تيمقاد هي مفتاحك للتميز والريادة في المجتمع."
            </p>
          </div>

          {/* Stats Grid - Wooden Dark Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <Card className="bg-[#451A03] border-[#B45309]/40 shadow-xl rounded-none border-r-4 border-r-[#FBBF24]">
              <CardHeader className="p-4 flex flex-row-reverse items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#FBBF24]">رصيد الخزانة</CardTitle>
                <Coins size={14} className="text-[#FBBF24]" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-right">
                <p className="text-3xl font-bold text-[#FBBF24] drop-shadow-sm">{isInfiniteAdmin ? '∞' : (profile?.coins || 0)}</p>
                <p className="text-[8px] text-[#F3E5AB]/40 mt-1">عملات ذهبية افتراضية</p>
              </CardContent>
            </Card>

            <Card className="bg-[#451A03] border-[#B45309]/40 shadow-xl rounded-none border-r-4 border-r-blue-500">
              <CardHeader className="p-4 flex flex-row-reverse items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-blue-400">رتبة العضوية</CardTitle>
                <Trophy size={14} className="text-blue-400" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-right">
                <p className="text-3xl font-bold text-[#F3E5AB]">
                  {profile?.verificationType === 'gold' ? 'نخبة' : profile?.verificationType === 'blue' ? 'موثق' : 'مستكشف'}
                </p>
                <p className="text-[8px] text-[#F3E5AB]/40 mt-1">مستوى التفاعل المجتمعي</p>
              </CardContent>
            </Card>
          </div>

          {/* Verification Section - Featured Box */}
          <section className="w-full text-right space-y-6 pt-6">
            <div className="flex items-center gap-3 text-[#FBBF24] border-r-4 border-[#FBBF24] pr-3">
              <BadgeCheck size={18} />
              <h3 className="font-bold text-md uppercase tracking-tighter">فتح أقفال التميز (التوثيق)</h3>
            </div>
            
            <Card className="bg-gradient-to-br from-[#78350F] to-[#451A03] border-[#B45309] shadow-2xl rounded-none overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 blur-3xl" />
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col items-center gap-6">
                  <div className="bg-[#2D1606] p-5 rounded-full border-2 border-[#B45309] shadow-inner">
                    <BadgeCheck size={56} className="text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold text-[#FBBF24]">صك التوثيق الأزرق</h4>
                    <p className="text-[10px] text-[#F3E5AB]/60 max-w-xs mx-auto">صلاحية لمدة 90 يوماً تشمل: أولوية الظهور، زيادة عدد الصور، ودعم أكبر لمساحة الكتابة.</p>
                  </div>
                  <div className="flex items-center gap-3 py-2 px-6 bg-[#2D1606]/50 rounded-full border border-[#B45309]/30">
                    <span className="text-2xl font-bold text-[#FBBF24]">{isInfiniteAdmin ? '0' : '500'}</span>
                    <TimgadCoin size={28} />
                  </div>
                  <Button 
                    className="w-full rounded-none font-bold h-12 gap-2 bg-[#FBBF24] text-[#451A03] hover:bg-[#F3E5AB] transition-all text-sm uppercase tracking-wider"
                    onClick={handleBuyVerification}
                    disabled={isVerifying || profile?.verificationType === 'blue' || profile?.verificationType === 'gold'}
                  >
                    {isVerifying ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                    {profile?.verificationType === 'none' ? 'شراء التوثيق الآن' : 'أنت من النخبة الموثقة'}
                  </Button>
                  <p className="text-[8px] text-[#F3E5AB]/40 italic">سيتم سحب العملات من خزانتك فور تأكيد العملية.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Coin Packages Section */}
          <section className="w-full text-right space-y-6 pt-6">
            <div className="flex items-center gap-3 text-[#FBBF24] border-r-4 border-[#FBBF24] pr-3">
              <Package size={18} />
              <h3 className="font-bold text-md uppercase tracking-tighter">باقات الكنوز الذهبية</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { amount: "100", price: "1$", label: "حقيبة البداية", color: "bg-blue-500/20 text-blue-300" },
                { amount: "500", price: "4$", label: "صندوق النشاط", color: "bg-green-500/20 text-green-300" },
                { amount: "1000", price: "7$", label: "خزانة التميز", color: "bg-purple-500/20 text-purple-300" },
                { amount: "5000", price: "30$", label: "كنز الريادة", color: "bg-amber-500/20 text-[#FBBF24]" }
              ].map((pkg, i) => (
                <motion.div key={i} whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }}>
                  <Card 
                    className="bg-[#451A03] border-[#B45309]/30 hover:border-[#FBBF24] transition-all cursor-pointer group rounded-none overflow-hidden"
                    onClick={handlePackageClick}
                  >
                    <CardContent className="p-6 flex flex-col items-center gap-3 relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${pkg.color} border border-current/20`}>
                        <TimgadCoin size={28} />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-[#FBBF24]">{pkg.amount} ذهبية</p>
                        <p className="text-xs font-bold text-white/80 mb-1 opacity-80">{pkg.price}</p>
                        <p className="text-[8px] text-[#F3E5AB]/40 uppercase font-bold tracking-[0.1em]">{pkg.label}</p>
                      </div>
                      <div className="w-full h-[1px] bg-[#B45309]/20 my-1" />
                      <Button variant="ghost" className="h-7 text-[9px] font-bold rounded-none w-full text-[#FBBF24] hover:bg-[#FBBF24] hover:text-[#451A03] transition-colors border border-[#B45309]/30">
                        طلب الكنز
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Legal Compliance Section - Dark Wooden Box */}
          <section className="w-full text-right space-y-6 pt-10">
            <div className="flex items-center gap-3 text-red-400 border-r-4 border-red-400 pr-3">
              <Scale size={18} />
              <h3 className="font-bold text-md uppercase tracking-tighter">الميثاق القانوني والتشريعي</h3>
            </div>
            
            <div className="bg-[#2D1606] p-6 space-y-5 border border-red-900/30 shadow-inner">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-red-400 mt-1 shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-red-400">طبيعة الوحدات الذهبية</h4>
                  <p className="text-[10px] text-[#F3E5AB]/60 leading-relaxed">
                    تُعد "عملة تيمقاد" وحدات مكافأة داخلية مغلقة النظام. ليست عملة مالية ولا يمكن صرفها أو تحويلها لأي عملة نقدية حقيقية خارج المنصة.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Gavel size={16} className="text-red-400 mt-1 shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-red-400">الالتزام بالقانون الجزائري</h4>
                  <p className="text-[10px] text-[#F3E5AB]/60 leading-relaxed italic border-r border-red-900/50 pr-2">
                    تؤكد إدارة تيمقاد التزامها التام بقانون المالية لسنة 2018 المادة 117؛ حيث أن هذه الوحدات هي "نقاط ولاء" (Loyalty Points) ولا تندرج تحت مسمى العملات الرقمية المشفرة المحظورة.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <footer className="pt-16 pb-10 opacity-30 text-center">
            <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#FBBF24]">Timgad Vault Control</p>
            <p className="text-[8px] text-[#F3E5AB] mt-1">Institutional Compliance • 2024-2025</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
