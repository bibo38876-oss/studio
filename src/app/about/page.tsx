
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Target, Rocket, ShieldCheck, Heart, Sparkles, Globe, Scale, History, Ban, ShieldAlert } from 'lucide-react';
import TimgadLogo from '@/components/ui/Logo';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-2xl pt-8 pb-20 px-4 md:px-0">
        {/* Header Section */}
        <div className="bg-background sticky top-8 z-30 py-4 border-b flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
            <ChevronRight size={20} />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-primary">الميثاق التأسيسي والتعريف بالمنصة</h1>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">الرؤية الاستراتيجية | تيمقاد</span>
          </div>
        </div>

        <div className="space-y-12 text-right">
          {/* Intro Hero */}
          <section className="flex flex-col items-center text-center gap-6 py-10 bg-primary/5 border-y border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-accent/5 rounded-full -translate-x-10 -translate-y-10" />
            <div className="w-20 h-20 bg-white shadow-xl rounded-full flex items-center justify-center relative z-10 border-2 border-primary/10">
              <TimgadLogo size={40} className="text-primary" />
            </div>
            <div className="space-y-3 px-6 relative z-10">
              <h2 className="text-xl font-bold text-primary leading-tight">فلسفة تيمقاد الرقمية</h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                تعد منصة تيمقاد مشروعاً تقنياً طموحاً يهدف إلى بلورة مفهوم جديد للتواصل الاجتماعي الرقمي، من خلال دمج مقومات الهوية العربية الأصيلة مع أحدث النظم البرمجية، لتقديم تجربة مستخدم تتسم بالكفاءة العالية والاستدامة.
              </p>
            </div>
          </section>

          {/* Core Content */}
          <div className="grid gap-12">
            {/* Legal and Compliance Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center"><Scale size={16} /></div>
                <h3 className="font-bold text-sm uppercase tracking-tighter">الإطار القانوني والامتثال</h3>
              </div>
              <div className="bg-secondary/10 p-5 border-r-4 border-primary">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  تعمل منصة تيمقاد بموجب **القوانين والتشريعات المعمول بها في الجمهورية الجزائرية الديمقراطية الشعبية**، وبالتوافق مع النظم التشريعية الرقمية في العالم العربي. إن الالتزام بهذه الضوابط القانونية يعد شرطاً أساسياً لاستخدام المنصة، ويُطالب كافة الأعضاء بالتقيد التام بالمعايير الأخلاقية والقانونية المنصوص عليها، لضمان بيئة رقمية آمنة تحترم الحقوق وتنبذ التجاوزات.
                </p>
              </div>
            </section>

            {/* Content Integrity Section (Prohibited Content) */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-destructive">
                <div className="w-8 h-8 bg-destructive/10 rounded-full flex items-center justify-center"><ShieldAlert size={16} /></div>
                <h3 className="font-bold text-sm uppercase tracking-tighter">سلامة المجتمع والمحتوى المحظور</h3>
              </div>
              <div className="p-5 border border-destructive/20 bg-destructive/5 space-y-3">
                <p className="text-xs text-foreground/80 leading-relaxed">
                  تلتزم تيمقاد بمعايير السلامة العالمية الرقمية؛ حيث **يُحظر تماماً** نشر أو الترويج لأي محتوى يتعلق بـ:
                </p>
                <ul className="text-[11px] text-muted-foreground space-y-2 list-disc pr-5">
                  <li>الترويج للمواد المخدرة والسموم العقلية بكافة أشكالها.</li>
                  <li>نشر الفكر المتطرف، التحريض على الإرهاب، أو دعم المنظمات التخريبية.</li>
                  <li>خطاب الكراهية، التحريض على العنف، أو المساس بالثوابت الوطنية والدينية.</li>
                </ul>
                <p className="text-[10px] text-destructive font-medium italic">
                  * إن مخالفة هذه البنود تضع صاحبها تحت طائلة القانون الجزائري والعربي وتؤدي للحظر الفوري والنهائي.
                </p>
              </div>
            </section>

            {/* Expansion and Origin */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center"><History size={16} /></div>
                <h3 className="font-bold text-sm uppercase tracking-tighter">منشأ التطبيق ومسيرة التوسع</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pr-11">
                انطلق مشروع تيمقاد من رؤية تقنية فردية تسعى لسد الفجوة في المنصات الاجتماعية العربية. وبفضل التطور المتسارع، شهد منشأ التطبيق **توسعاً مؤسسياً وتقنياً استراتيجياً**، حيث تحول من مجرد واجهة تواصل إلى منظومة رقمية متكاملة تهدف للريادة الإقليمية، مع الالتزام بتطوير خوارزميات ذكية تخدم الهوية العربية وتكفل جودة المحتوى.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="space-y-4 p-5 bg-secondary/20 border-r-4 border-primary">
                <div className="flex items-center gap-3 text-primary">
                  <Target size={18} />
                  <h3 className="font-bold text-sm">رؤيتنا الاستراتيجية</h3>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  أن نتبوأ مكانة الصدارة كمنصة رقمية موثوقة تعتمد عليها الكوادر العربية كمحرك أساسي للتواصل والابتكار الرقمي بكفاءة استثنائية.
                </p>
              </section>

              <section className="space-y-4 p-5 bg-secondary/20 border-r-4 border-accent">
                <div className="flex items-center gap-3 text-accent">
                  <Rocket size={18} />
                  <h3 className="font-bold text-sm">رسالتنا التقنية</h3>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  تمكين المستخدمين عبر واجهات برمجية تجمع بين التبسيط والعمق الوظيفي، بما يحقق أقصى درجات الفعالية في إدارة المحتوى الاجتماعي.
                </p>
              </section>
            </div>

            {/* Values Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-primary border-b pb-2">
                <Sparkles size={18} />
                <h3 className="font-bold text-sm">منظومة القيم الجوهرية</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Heart size={14} />, title: "المسؤولية الاجتماعية", desc: "إعطاء الأولوية لاحتياجات المجتمع الرقمي العربي." },
                  { icon: <ShieldCheck size={14} />, title: "الجودة والمعيارية", desc: "الالتزام بأعلى معايير الأداء والأمان المعلوماتي." },
                  { icon: <Globe size={14} />, title: "الأصالة والابتكار", desc: "الموازنة بين الهوية الحضارية والتطور التكنولوجي." },
                  { icon: <Rocket size={14} />, title: "الريادة المستمرة", desc: "تبني التحولات التقنية لضمان التفوق البرمجي." }
                ].map((val, i) => (
                  <div key={i} className="space-y-2 p-4 border hover:bg-muted/5 transition-colors">
                    <div className="flex items-center gap-2 text-primary">
                      {val.icon}
                      <h4 className="text-[11px] font-bold">{val.title}</h4>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-snug">{val.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <footer className="pt-16 border-t text-center space-y-6">
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                تيمقاد هي نتاج رؤية وطنية تسعى لتمكين المجتمع العربي تقنياً.<br />نثمن ثقتكم وانضمامكم لهذه الرحلة الطموحة.
              </p>
              <p className="text-[8px] font-bold text-primary/40 uppercase tracking-widest mt-2">Legal Compliance | Algerian & Arab Jurisdiction</p>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full text-[10px] h-8 px-8 font-bold" onClick={() => router.push('/')}>العودة للرئيسية</Button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
