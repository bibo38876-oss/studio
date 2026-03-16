
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Info, Sparkles, TrendingUp, Wallet, ShieldCheck, Star, Scale, Gavel, AlertCircle, Package, BadgeCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userRef);

  const handlePackageClick = () => {
    toast({
      title: "قريباً في تيمقاد",
      description: "نظام شحن الباقات قيد التطوير والتدقيق القانوني حالياً.",
    });
  };

  const handleBuyVerification = async () => {
    if (!firestore || !user || !profile) return;
    
    if ((profile.coins || 0) < 500) {
      toast({
        variant: "destructive",
        title: "رصيد غير كافٍ",
        description: "تحتاج إلى 500 عملة تيمقاد لتوثيق حسابك. يمكنك الحصول عليها من الداعمين أو شراء باقة.",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 3);

      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        coins: increment(-500),
        verificationType: 'blue',
        verificationExpiresAt: expiryDate.toISOString()
      });

      toast({
        title: "تم التوثيق بنجاح!",
        description: "مبروك! حصلت على الشارة الزرقاء لمدة 3 أشهر وامتيازات إضافية.",
      });
    } catch (error) {
      toast({ variant: "destructive", description: "فشل إتمام العملية." });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-xl pt-10 pb-20 px-4 md:px-0">
        {/* Header */}
        <div className="bg-background sticky top-8 z-30 py-4 border-b flex items-center gap-4 mb-10">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
            <ChevronRight size={20} />
          </Button>
          <div className="flex flex-col text-right">
            <h1 className="text-sm font-bold text-primary">محفظة تيمقاد الرقمية</h1>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">نظام المكافآت والتحفيز الرقمي</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-10 text-center">
          {/* Large Coin Section */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <TimgadCoin size={200} className="relative z-10 drop-shadow-2xl" />
          </motion.div>

          <div className="space-y-3 px-6">
            <h2 className="text-2xl font-bold text-primary">عملة تيمقاد: وسام التفاعل الرقمي</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              نظام "عملة تيمقاد" هو آلية تقنية مبتكرة صُممت حصرياً لمكافأة جودة المحتوى وتعزيز روح المجتمع داخل المنصة.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <Card className="border-none shadow-none rounded-none bg-primary/5 border-r-4 border-primary">
              <CardHeader className="p-4 flex flex-row-reverse items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary">رصيد النقاط الحالي</CardTitle>
                <Wallet size={14} className="text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-right">
                <p className="text-3xl font-bold text-primary">{profile?.coins || 0}</p>
                <p className="text-[8px] text-muted-foreground mt-1 italic">نقاط افتراضية غير قابلة للصرف المالي.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-none rounded-none bg-accent/5 border-r-4 border-accent">
              <CardHeader className="p-4 flex flex-row-reverse items-center justify-between space-y-0">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-accent">المساهمة المجتمعية</CardTitle>
                <TrendingUp size={14} className="text-accent" />
              </CardHeader>
              <CardContent className="p-4 pt-0 text-right">
                <p className="text-3xl font-bold text-accent">
                  {profile?.verificationType === 'gold' ? 'ELITE' : profile?.verificationType === 'blue' ? 'VERIFIED' : 'STANDARD'}
                </p>
                <p className="text-[8px] text-muted-foreground mt-1 italic">تفاعلك اليومي يرفع من رتبتك داخل المنصة.</p>
              </CardContent>
            </Card>
          </div>

          {/* Verification Section */}
          <section className="w-full text-right space-y-6 pt-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-primary pr-3">
              <BadgeCheck size={18} />
              <h3 className="font-bold text-md uppercase tracking-tighter">توثيق الحساب بالشارة الزرقاء</h3>
            </div>
            
            <Card className="border-none shadow-sm rounded-none bg-primary/5 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-full shadow-sm">
                    <BadgeCheck size={48} className="text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-primary">اشتراك التوثيق (3 أشهر)</h4>
                    <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">احصل على الشارة الزرقاء، أولوية في الظهور، وإمكانية رفع صور أكثر ومساحة كتابة أكبر.</p>
                  </div>
                  <div className="flex items-center gap-2 py-4">
                    <span className="text-2xl font-bold text-primary">500</span>
                    <TimgadCoin size={24} />
                  </div>
                  <Button 
                    className="w-full rounded-full font-bold h-11 gap-2"
                    onClick={handleBuyVerification}
                    disabled={isVerifying || profile?.verificationType === 'blue' || profile?.verificationType === 'gold'}
                  >
                    {isVerifying ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                    {profile?.verificationType === 'none' ? 'وثق حسابي الآن' : 'أنت موثق بالفعل'}
                  </Button>
                  <p className="text-[8px] text-muted-foreground italic">سيتم خصم المبلغ من رصيدك الحالي فوراً.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Coin Packages Section */}
          <section className="w-full text-right space-y-6 pt-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-primary pr-3">
              <Package size={18} />
              <h3 className="font-bold text-md uppercase tracking-tighter">باقات نقاط تيمقاد</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { amount: "100", price: "1$", label: "باقة البداية", color: "bg-blue-500/10 text-blue-600" },
                { amount: "500", price: "4$", label: "باقة النشاط", color: "bg-green-500/10 text-green-600" },
                { amount: "1000", price: "7$", label: "باقة التميز", color: "bg-purple-500/10 text-purple-600" },
                { amount: "5000", price: "30$", label: "باقة الريادة", color: "bg-amber-500/10 text-amber-600" }
              ].map((pkg, i) => (
                <motion.div key={i} whileHover={{ y: -5 }} whileTap={{ scale: 0.95 }}>
                  <Card 
                    className="border-none shadow-sm rounded-none bg-card hover:bg-secondary/50 transition-all cursor-pointer group border-b-2 border-transparent hover:border-primary overflow-hidden"
                    onClick={handlePackageClick}
                  >
                    <CardContent className="p-6 flex flex-col items-center gap-3 relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pkg.color}`}>
                        <TimgadCoin size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-primary">{pkg.amount} Coin</p>
                        <p className="text-[14px] font-bold text-accent mb-1">{pkg.price}</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{pkg.label}</p>
                      </div>
                      <div className="w-full h-[1px] bg-muted/30 my-1" />
                      <Button variant="ghost" className="h-7 text-[9px] font-bold rounded-full w-full hover:bg-primary hover:text-white transition-colors">
                        طلب الباقة
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Legal Compliance Section */}
          <section className="w-full text-right space-y-6 pt-10">
            <div className="flex items-center gap-3 text-destructive border-r-4 border-destructive pr-3">
              <Scale size={18} />
              <h3 className="font-bold text-md uppercase tracking-tighter">الإيضاح القانوني والامتثال التشريعي</h3>
            </div>
            
            <div className="bg-destructive/5 p-6 space-y-5 border border-destructive/10">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-destructive mt-1 shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-destructive">طبيعة الوحدات الرقمية</h4>
                  <p className="text-[10px] text-foreground/80 leading-relaxed">
                    تُعرف "عملة تيمقاد" (TIMGAD COIN) بأنها **وحدات حسابية افتراضية داخلية (Internal Virtual Points)**. هي ليست عملة نقدية، ولا صكاً مالياً، ولا تمتلك أي قيمة مادية خارج بيئة منصة تيمقاد الرقمية.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Gavel size={16} className="text-destructive mt-1 shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-destructive">الالتزام بالقانون الجزائري (المادة 117)</h4>
                  <p className="text-[10px] text-foreground/80 leading-relaxed italic">
                    "يمنع منعاً باتاً شراء أو بيع أو استخدام أو حيازة العملة الافتراضية بأي وسيلة كانت." 
                    <br />— **قانون المالية لسنة 2018 (القانون رقم 17-11 المؤرخ في 27 ديسمبر 2017)**.
                  </p>
                  <p className="text-[10px] text-foreground/80 leading-relaxed">
                    بموجب هذا التشريع الصارم، توضح إدارة تيمقاد أن هذه الوحدات **لا تندرج تحت فئة "العملات الرقمية" أو "الافتراضية" المحظورة**؛ كونها نقاطاً تحفيزية مغلقة النظام، ولا يمكن بأي حال من الأحوال تحويلها إلى عملات ورقية (دينار جزائري أو غيره)، ولا يمكن سحبها أو تداولها خارج المنصة كأداة دفع.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <ShieldCheck size={16} className="text-primary mt-1 shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-primary">سياسة الاستخدام العادل</h4>
                  <p className="text-[10px] text-foreground/80 leading-relaxed">
                    تخضع كافة عمليات كسب النقاط لرقابة صارمة لضمان عدم استغلال المنصة في أي نشاط مخالف للأنظمة النقدية والمصرفية المعمول بها في الجمهورية الجزائرية الديمقراطية الشعبية. تيمقاد تلتزم بالشفافية الكاملة مع السلطات التنظيمية والمالية.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Info Section */}
          <section className="w-full text-right space-y-6 pt-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-primary pr-3">
              <Info size={18} />
              <h3 className="font-bold text-md uppercase tracking-tighter">كيفية عمل نظام المكافآت</h3>
            </div>
            
            <div className="grid gap-4">
              {[
                { 
                  icon: <Star size={14} />, 
                  title: "المساهمة المعرفية", 
                  desc: "تُمنح النقاط بناءً على جودة المنشورات الأصلية التي تثري المحتوى العربي وتلقى قبولاً من المجتمع." 
                },
                { 
                  icon: <ShieldCheck size={14} />, 
                  title: "امتيازات التوثيق", 
                  desc: "الحسابات الموثقة تمتلك معامل ضرب (Multiplier) يرفع من رصيد نقاطهم كتقدير لمصداقيتهم." 
                },
                { 
                  icon: <Sparkles size={14} />, 
                  title: "دعم المبدعين داخلياً", 
                  desc: "ستتمكن قريباً من إهداء هذه النقاط للمنشورات التي تعجبك كنوع من التصفيق الرقمي داخل التطبيق." 
                }
              ].map((item, i) => (
                <div key={i} className="bg-secondary/30 p-4 flex gap-4 items-start border border-transparent hover:border-primary/10 transition-colors">
                  <div className="h-8 w-8 bg-white shadow-sm flex items-center justify-center shrink-0 text-primary">
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-primary">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <footer className="pt-16 pb-10 opacity-40">
            <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-primary">Timgad Digital Compliance Division</p>
            <p className="text-[8px] text-muted-foreground mt-1">Regulatory & Legal Framework • 2024-2025</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
