
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Zap, Coins, Trophy, BadgeCheck, Scale, History, ShieldCheck, Info, Globe, Heart, Coffee, Star, Gavel, AlertCircle } from 'lucide-react';
import TimgadLogo from '@/components/ui/Logo';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-2xl pt-8 pb-20 px-4 md:px-0">
        <div className="bg-background sticky top-8 z-30 py-4 border-b flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-primary hover:bg-primary/5 p-1 rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-primary">الميثاق والدليل الشامل</h1>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">منصة تيمقاد الرقمية | إصدار 2025</span>
          </div>
        </div>

        <div className="space-y-12 text-right">
          {/* 1. قسم نحن */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-primary pr-3">
              <Info size={20} />
              <h2 className="text-xl font-bold font-headline tracking-tighter">نحن</h2>
            </div>
            
            <div className="bg-primary/5 p-6 border border-primary/10 space-y-4 rounded-sm">
              <p className="text-xs leading-relaxed text-foreground/80">
                تيمقاد هو منصة اجتماعية جزائرية تهدف إلى توفير فضاء رقمي مفتوح للتعبير ومشاركة الأفكار والمحتوى. تتيح المنصة للمستخدمين نشر الصور والمنشورات والتفاعل مع المجتمع في بيئة حديثة وسهلة الاستخدام.
              </p>
              <p className="text-xs leading-relaxed text-foreground/80">
                رغم أن تيمقاد منصة جزائرية المنشأ، إلا أنها موجهة إلى الفضاء العربي، وهدفها هو جمع المستخدمين من مختلف الدول العربية في فضاء رقمي واحد يشجع على الحوار والتفاعل وتبادل المحتوى.
              </p>
              <p className="text-xs leading-relaxed text-foreground/80">
                نسعى من خلال تيمقاد إلى المساهمة في بناء مجتمع رقمي عربي قوي يعزز حضور المحتوى العربي على الإنترنت ويمنح المستخدمين مساحة حرة للتعبير والتواصل.
              </p>
              <div className="pt-4 border-t border-primary/10 flex items-center justify-between">
                <span className="text-[10px] font-bold text-primary">تم تطوير هذه المنصة بشكل مستقل من طرف مواطن جزائري: Adel Benmaza</span>
                <Globe size={14} className="text-primary/40" />
              </div>
            </div>
          </section>

          {/* 2. اقتصاد تيمقاد */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-accent pr-3">
              <Coins size={20} className="text-accent" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">اقتصاد تيمقاد (العملات)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary/20 border-r-2 border-primary space-y-2">
                <div className="flex items-center gap-2 text-primary"><Star size={14} /><h4 className="text-[10px] font-bold">هدية الانضمام</h4></div>
                <p className="text-[9px] text-muted-foreground">يحصل كل عضو جديد فور التسجيل على <span className="text-primary font-bold">10 عملات</span> ذهبية لبدء رحلته.</p>
              </div>
              <div className="p-4 bg-secondary/20 border-r-2 border-primary space-y-2">
                <div className="flex items-center gap-2 text-primary"><History size={14} /><h4 className="text-[10px] font-bold">مكافأة الوفاء</h4></div>
                <p className="text-[9px] text-muted-foreground">تمنحك المنصة <span className="text-primary font-bold">عملة واحدة</span> تلقائياً كل 24 ساعة عند تسجيل دخولك.</p>
              </div>
              <div className="p-4 bg-secondary/20 border-r-2 border-primary space-y-2">
                <div className="flex items-center gap-2 text-primary"><Coffee size={14} /><h4 className="text-[10px] font-bold">دعم القهوة</h4></div>
                <p className="text-[9px] text-muted-foreground">يمكن للمبدعين استقبال العملات من متابعيهم كتقدير للمحتوى المتميز.</p>
              </div>
            </div>
          </section>

          {/* 3. جرة تيمقاد الملكية */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-yellow-600 pr-3">
              <Trophy size={20} className="text-yellow-600" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">جرة تيمقاد الملكية (المنافسة اليومية)</h2>
            </div>
            
            <div className="bg-[#2D1606] text-[#F3E5AB] p-6 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-30" />
              
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest">آلية العمل والتوقيت</h4>
                <p className="text-[10px] leading-relaxed opacity-80">
                  هي حدث جماعي يومي يتم فيه تجميع العملات في جرة أثرية واحدة.
                  <br />- <span className="text-yellow-500">رسم الدخول:</span> 3 عملات ذهبية للمشاركة في السحب.
                  <br />- <span className="text-yellow-500">التوقيت:</span> تنكسر الجرة يومياً الساعة <span className="font-bold">20:00</span>، وتبدأ دورة جديدة الساعة <span className="font-bold">20:05</span> بتوقيت الجزائر.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-widest">قوانين "الأورا" وتوزيع الكنوز</h4>
                <p className="text-[10px] leading-relaxed opacity-80">
                  لا يعتمد الفوز على الحظ فحسب، بل على "الأورا" (الهيبة الاجتماعية) التي يمتلكها العضو (مزيج من عدد المتابعين والتفاعل).
                </p>
                <ul className="text-[9px] space-y-2 pr-4 list-disc opacity-70">
                  <li>تقتطع المنصة <span className="text-yellow-500 font-bold">30%</span> كرسوم صيانة وتطوير.</li>
                  <li>يتم توزيع الـ <span className="text-yellow-500 font-bold">70%</span> المتبقية على أعلى 10 مشاركين من حيث الأورا.</li>
                  <li>الحصص: المركز الأول <span className="text-yellow-500 font-bold">20%</span>، الثاني <span className="text-yellow-500 font-bold">15%</span>، الثالث <span className="text-yellow-500 font-bold">10%</span>، والبقية (7 مراكز) يتقاسمون <span className="text-yellow-500 font-bold">25%</span> بالتساوي.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. ميثاق العضوية والتوثيق */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-r-4 border-blue-500 pr-3">
              <BadgeCheck size={20} className="text-blue-500" />
              <h2 className="text-xl font-bold font-headline tracking-tighter">ميثاق العضوية والامتيازات</h2>
            </div>
            
            <div className="overflow-hidden border rounded-none shadow-sm">
              <table className="w-full text-[10px] text-right">
                <thead className="bg-secondary/50 border-b">
                  <tr>
                    <th className="p-4 font-bold border-l">الميزة المتاحة</th>
                    <th className="p-4 font-bold text-muted-foreground border-l">المستكشف (عادي)</th>
                    <th className="p-4 font-bold text-blue-600">النخبة (موثق)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-4 font-medium bg-muted/5 border-l">طول المنشور النصي</td>
                    <td className="p-4 border-l italic text-muted-foreground">400 حرف</td>
                    <td className="p-4 font-bold text-blue-600">1500 حرف</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium bg-muted/5 border-l">معرض الصور (للمنشور)</td>
                    <td className="p-4 border-l italic text-muted-foreground">صورة واحدة فقط</td>
                    <td className="p-4 font-bold text-blue-600">حتى 3 صور</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium bg-muted/5 border-l">استطلاعات الرأي</td>
                    <td className="p-4 border-l italic text-muted-foreground">تكلفة: 3 عملات</td>
                    <td className="p-4 font-bold text-blue-600">مجاني (1 يومياً) ثم 2 عملة</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium bg-muted/5 border-l">أولوية الظهور (الأورا)</td>
                    <td className="p-4 border-l italic text-muted-foreground">عادية</td>
                    <td className="p-4 font-bold text-blue-600">فائقة (تعزيز الأورا)</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium bg-muted/5 border-l">دعم المحتوى (القهوة)</td>
                    <td className="p-4 border-l italic text-muted-foreground">استقبال فقط</td>
                    <td className="p-4 font-bold text-blue-600">إرسال واستقبال مفتوح</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5. الميثاق القانوني والتشريعي */}
          <section className="space-y-6 pt-6">
            <div className="flex items-center gap-3 text-red-600 border-r-4 border-red-600 pr-3">
              <Scale size={20} />
              <h2 className="text-xl font-bold font-headline tracking-tighter">الميثاق القانوني</h2>
            </div>
            
            <div className="bg-red-50/50 p-6 border border-red-100 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-red-600 mt-1 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-red-700">طبيعة الوحدات الذهبية</h4>
                  <p className="text-[10px] text-red-600/80 leading-relaxed">
                    تُعد "عملة تيمقاد" وحدات مكافأة داخلية مغلقة النظام (Closed Loop Loyalty System). ليست عملة مالية حقيقية ولا يمكن صرفها أو تحويلها لأي عملة نقدية خارج المنصة.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-red-100 pt-4">
                <Gavel size={16} className="text-red-600 mt-1 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-red-700">الالتزام بالقانون الجزائري</h4>
                  <p className="text-[10px] text-red-600/80 leading-relaxed italic pr-2 border-r border-red-200">
                    تؤكد إدارة تيمقاد التزامها التام بقانون المالية لسنة 2018 المادة 117؛ حيث أن هذه الوحدات هي "نقاط ولاء" ترويجية وتفاعلية ولا تندرج تحت مسمى العملات الرقمية المشفرة المحظورة.
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
