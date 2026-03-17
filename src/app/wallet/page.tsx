
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Sparkles, ShieldCheck, Package, BadgeCheck, Loader2, Coins, Trophy, Scale, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment } from 'firebase/firestore';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PACKAGES = [
  { id: "pkg_1", amount: 100, price: "1.00", label: "حقيبة البداية", color: "bg-blue-500/20 text-blue-300" },
  { id: "pkg_2", amount: 500, price: "4.00", label: "صندوق النشاط", color: "bg-green-500/20 text-green-300" },
  { id: "pkg_3", amount: 1000, price: "7.00", label: "خزانة التميز", color: "bg-purple-500/20 text-purple-300" },
  { id: "pkg_4", amount: 5000, price: "30.00", label: "كنز الريادة", color: "bg-amber-500/20 text-[#FBBF24]" }
];

// PayPal Client ID المحدث
const PAYPAL_CLIENT_ID = "AcfcwkWDQP9gcJEUejcgGHhyChqJlyFYhMOb8N7qK6zH3QGEqSw-4Tb2xppGkefnhKyixemkJKKctnmV";

export default function WalletPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isInfiniteAdmin = user?.email === ADMIN_EMAIL;

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  const handleBuyVerification = async () => {
    if (!firestore || !user || !profile) return;
    
    if (!isInfiniteAdmin && (profile.coins || 0) < 500) {
      toast({
        variant: "destructive",
        title: "الكنز لا يكفي",
        description: "تحتاج إلى 500 عملة لتوثيق حسابك. يمكنك شحن رصيدك عبر PayPal الآن.",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 3);

      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        coins: isInfiniteAdmin ? increment(0) : increment(-500),
        verificationType: 'blue',
        verificationExpiresAt: expiryDate.toISOString()
      });

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

  const handlePaymentSuccess = (amount: number) => {
    if (!firestore || !user) return;
    
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
      coins: increment(amount)
    });

    toast({
      title: "تم استلام الكنز! 🏺",
      description: `تمت إضافة ${amount} عملة ذهبية إلى خزانتك بنجاح.`,
    });
    setSelectedPackage(null);
  };

  return (
    <PayPalScriptProvider options={{ "clientId": PAYPAL_CLIENT_ID, currency: "USD" }}>
      <div className="min-h-screen bg-[#2D1606] text-[#F3E5AB]">
        <Navbar />

        <div className="fixed inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />

        <main className="container mx-auto max-w-xl pt-10 pb-20 px-4 md:px-0 relative z-10">
          <div className="bg-[#451A03]/80 backdrop-blur-md sticky top-8 z-30 py-4 border-b border-[#B45309]/30 flex items-center gap-4 mb-10 shadow-2xl">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full text-[#FBBF24] hover:bg-[#78350F]">
              <ChevronRight size={20} />
            </Button>
            <div className="flex flex-col text-right">
              <h1 className="text-sm font-bold text-[#FBBF24] uppercase tracking-tighter">خزانة تيمقاد الملكية {isInfiniteAdmin && '∞'}</h1>
              <span className="text-[8px] text-[#FBBF24]/60 uppercase tracking-[0.2em] font-medium">Auto-Payment Gateway Active</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-10 text-center">
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
                "هنا تُحفظ كنوزك. اشحن رصيدك الآن عبر PayPal لتصل إلى قمة الأورا وتوثق حسابك."
              </p>
            </div>

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
                      <p className="text-[10px] text-[#F3E5AB]/60 max-w-xs mx-auto">صلاحية لمدة 90 يوماً تشمل أولوية الظهور وعلامة التوثيق في كافة أنحاء تيمقاد.</p>
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
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="w-full text-right space-y-6 pt-6">
              <div className="flex items-center gap-3 text-[#FBBF24] border-r-4 border-[#FBBF24] pr-3">
                <Package size={18} />
                <h3 className="font-bold text-md uppercase tracking-tighter">باقات الكنوز (PayPal الآلي)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PACKAGES.map((pkg) => (
                  <Card 
                    key={pkg.id} 
                    className={`bg-[#451A03] border-[#B45309]/30 transition-all rounded-none overflow-hidden ${selectedPackage?.id === pkg.id ? 'ring-2 ring-[#FBBF24]' : ''}`}
                  >
                    <CardContent className="p-6 flex flex-col items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${pkg.color}`}>
                        <TimgadCoin size={28} />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-[#FBBF24]">{pkg.amount} ذهبية</p>
                        <p className="text-xs font-bold text-white/80">{pkg.label}</p>
                        <p className="text-[10px] text-[#FBBF24] mt-1 font-bold">السعر: {pkg.price} USD</p>
                      </div>

                      {selectedPackage?.id === pkg.id ? (
                        <div className="w-full animate-in fade-in zoom-in-95 duration-300">
                          <PayPalButtons 
                            style={{ layout: "horizontal", height: 35 }}
                            createOrder={(data, actions) => {
                              return actions.order.create({
                                intent: "CAPTURE",
                                purchase_units: [{
                                  amount: { currency_code: "USD", value: pkg.price },
                                  description: `Timgad Coins: ${pkg.label}`
                                }]
                              });
                            }}
                            onApprove={async (data, actions) => {
                              const details = await actions.order?.capture();
                              if (details) handlePaymentSuccess(pkg.amount);
                            }}
                            onError={(err) => {
                              toast({ variant: "destructive", description: "حدث خطأ أثناء معالجة الدفع." });
                            }}
                          />
                          <Button variant="ghost" className="w-full text-[8px] text-white/40 h-6 mt-2" onClick={() => setSelectedPackage(null)}>إلغاء</Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full rounded-none font-bold h-9 bg-primary text-white hover:bg-primary/90 text-[10px]"
                          onClick={() => setSelectedPackage(pkg)}
                        >
                          شراء عبر PayPal
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="w-full text-right space-y-6 pt-10">
              <div className="flex items-center gap-3 text-red-400 border-r-4 border-red-400 pr-3">
                <Scale size={18} />
                <h3 className="font-bold text-md uppercase tracking-tighter">الميثاق القانوني</h3>
              </div>
              <div className="bg-[#2D1606] p-6 space-y-4 border border-red-900/30">
                <div className="flex items-start gap-3">
                  <AlertCircle size={16} className="text-red-400 mt-1 shrink-0" />
                  <p className="text-[10px] text-[#F3E5AB]/60 leading-relaxed">
                    تُعد "عملة تيمقاد" وحدات مكافأة داخلية. الدفع عبر PayPal هو وسيلة لدعم تطوير المنصة والحصول على ميزات "الأورا" والتوثيق. لا يمكن تحويل العملات لنقد حقيقي.
                  </p>
                </div>
              </div>
            </section>

            <footer className="pt-16 pb-10 opacity-30 text-center">
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#FBBF24]">Timgad Institutional Compliance</p>
            </footer>
          </div>
        </main>
      </div>
    </PayPalScriptProvider>
  );
}
