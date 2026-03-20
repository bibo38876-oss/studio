
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Zap, Coins, Trophy, BadgeCheck, Scale, History, ShieldCheck, Info, Globe, Heart, Coffee, Star, Gavel, AlertCircle, Megaphone, Wallet, LayoutGrid, Sparkles } from 'lucide-react';
import TimgadLogo from '@/components/ui/Logo';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-2xl pt-8 pb-20 px-4 md:px-0 text-right">
        <div className="bg-background sticky top-8 z-30 py-4 border-b flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-primary hover:bg-primary/5 p-1 rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-primary">الميثاق والدليل الشامل</h1>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">منصة تيمقاد الرقمية | تحديث الاقتصاد 2025</span>
          </div>
        </div>

        <div className="space-y-12">
          {/* 1. اقتصاد تيمقاد المحدث */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-accent pr-3">
              <Coins size={20} className="text-accent" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">اقتصاد تيمقاد والتحويل (TRX)</h2>
            </div>
            
            <div className="bg-secondary/10 p-6 space-y-4 rounded-sm border border-primary/5">
              <div className="flex items-center justify-between border-b border-primary/10 pb-3">
                <span className="text-xs font-bold text-primary">معادلة الصرف الملكية</span>
                <span className="text-sm font-bold text-accent">100 عملة تيمقاد = 1 TRX</span>
              </div>
              <p className="text-[11px] leading-relaxed text-foreground/80">
                يعتمد نظام تيمقاد على عملة ذهبية داخلية مرتبطة تقنياً بعملة <span className="font-bold">TRX (Tron)</span>. يتم الشحن والسحب يدوياً عبر مركز الدعم لضمان أمان خزانة المنصة.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-card border text-center">
                  <p className="text-[9px] text-muted-foreground mb-1 uppercase font-bold">الحد الأدنى للسحب</p>
                  <p className="text-xs font-bold text-primary">20 TRX (2000 عملة)</p>
                </div>
                <div className="p-3 bg-card border text-center">
                  <p className="text-[9px] text-muted-foreground mb-1 uppercase font-bold">رسوم التحويل</p>
                  <p className="text-xs font-bold text-destructive">3% من إجمالي المبلغ</p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. نظام التوثيق وتحقيق الدخل */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-blue-500 pr-3">
              <BadgeCheck size={20} className="text-blue-500" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">التوثيق وتحقيق الدخل</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50/30 p-6 border border-blue-100 rounded-sm">
                <h4 className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-2">
                  <Sparkles size={14} /> شراء التوثيق الذاتي
                </h4>
                <p className="text-[10px] text-blue-900/80 leading-relaxed mb-4">
                  يمكن لأي عضو الحصول على الشارة الزرقاء فوراً مقابل <span className="font-bold text-primary">500 عملة تيمقاد</span> عبر المحفظة. التوثيق هو الخطوة الأولى لتفعيل نظام الأرباح.
                </p>
              </div>

              <div className="bg-blue-50/30 p-6 border border-blue-100 rounded-sm">
                <h4 className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-2">
                  <Star size={14} /> شروط الربح من الإعلانات الإدارية
                </h4>
                <ul className="text-[10px] space-y-3 text-blue-900/80">
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <span>يجب أن يمتلك العضو <span className="font-bold underline">500 متابع</span> حقيقي على الأقل.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <span>يجب أن يكون الحساب <span className="font-bold underline">موثقاً</span> (الشارة الزرقاء أو الذهبية).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <span>عند استيفاء الشروط، يحصل العضو على <span className="font-bold text-primary">250 عملة (50%)</span> فور وضع الإدارة إعلاناً على منشوره.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. سوق القصص والأرباح */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-green-600 pr-3">
              <LayoutGrid size={20} className="text-green-600" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">سوق القصص والأرباح للمستخدمين</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/20 border-r-2 border-green-600 space-y-2">
                <h4 className="text-[10px] font-bold text-green-700 uppercase">اربح من المشاهدة</h4>
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  عند مشاهدتك والنقر على القصص الإعلانية في السوق، تحصل فوراً على <span className="text-green-600 font-bold">0.6 عملة</span> عن كل نقرة حقيقية.
                </p>
              </div>
              <div className="p-4 bg-secondary/20 border-r-2 border-primary space-y-2">
                <h4 className="text-[10px] font-bold text-primary uppercase">أعلن عن مشروعك</h4>
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  مقابل <span className="text-primary font-bold">100 عملة</span>، يمكنك نشر قصة إعلانية تحصل من خلالها على 100 نقرة حقيقية لموقعك أو حسابك.
                </p>
              </div>
            </div>
          </section>

          {/* 4. المساحات الإعلانية الإدارية */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-amber-600 pr-3">
              <Megaphone size={20} className="text-amber-600" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">المساحات الإعلانية المميزة</h2>
            </div>
            
            <div className="overflow-hidden border rounded-none">
              <table className="w-full text-[10px] text-right">
                <thead className="bg-secondary/50 border-b">
                  <tr>
                    <th className="p-4 font-bold border-l">نوع الإعلان</th>
                    <th className="p-4 font-bold border-l">المدة</th>
                    <th className="p-4 font-bold text-amber-600">التكلفة</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-4 border-l font-medium">مستطيل السوق (بين الستوريات)</td>
                    <td className="p-4 border-l">5 أيام</td>
                    <td className="p-4 font-bold">5 TRX</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-l font-medium">إعلان منشور (فوق التعليقات)</td>
                    <td className="p-4 border-l">3 أيام</td>
                    <td className="p-4 font-bold">5 TRX</td>
                  </tr>
                  <tr>
                    <td className="p-4 border-l font-medium">ترويج منشور (For You Boost)</td>
                    <td className="p-4 border-l">--</td>
                    <td className="p-4 italic text-muted-foreground">قريباً</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. سجل تيمقاد للكرم */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-amber-800 pr-3">
              <Coffee size={20} className="text-amber-800" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">سجل الكرم (أبطال تيمقاد)</h2>
            </div>
            
            <div className="bg-amber-50/30 p-6 border border-amber-100 space-y-4">
              <p className="text-[10px] text-amber-900/80 leading-relaxed italic">
                "سجل الكرم" هو لوحة شرف دائمة في ملفك الشخصي تخلد أسماء من دعموا محتواك بفناجين القهوة.
              </p>
              <div className="flex items-start gap-3">
                <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[9px] text-amber-800">تقتطع المنصة عمولة صيانة <span className="font-bold">10%</span> من قيمة كل دعم يتم إرساله للمبدع.</p>
              </div>
            </div>
          </section>

          {/* 6. سياسة المحتوى والأمان */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-red-600 border-r-4 border-red-600 pr-3">
              <ShieldCheck size={20} />
              <h2 className="text-xl font-bold font-headline tracking-tighter">الأمان وحماية المجتمع</h2>
            </div>
            
            <div className="bg-red-50/50 p-6 border border-red-100 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-red-600 mt-1 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-red-700 uppercase">حظر الروابط الخارجية</h4>
                  <p className="text-[10px] text-red-600/80 leading-relaxed">
                    يُمنع منعاً باتاً وضع روابط خارجية (http, www) داخل المنشورات أو التعليقات. تهدف هذه السياسة لمنع الروابط الاحتيالية والحفاظ على جودة المحتوى.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <footer className="pt-20 border-t text-center space-y-8">
            <div className="flex flex-col items-center gap-1">
              <TimgadLogo size={32} className="text-primary/20 mb-2" />
              <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Institutional Compliance Division</span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Designed for the Arab World | 2024-2025</span>
            </div>
            <Button variant="outline" size="sm" className="rounded-full text-[10px] h-9 px-10 border-primary/20 text-primary" onClick={() => router.push('/')}>العودة للرئيسية</Button>
          </footer>
        </div>
      </main>
    </div>
  );
}
