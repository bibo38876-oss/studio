
"use client"

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ChevronRight, Target, Rocket, ShieldCheck, Heart, Sparkles, Globe, Scale, History, ShieldAlert, FileText, Users, Briefcase } from 'lucide-react';
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
            <h1 className="text-sm font-bold text-primary">الميثاق التأسيسي والرؤية الاستراتيجية</h1>
            <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-medium">منصة تيمقاد الرقمية | الإصدار المؤسسي</span>
          </div>
        </div>

        <div className="space-y-12 text-right">
          {/* Intro Hero */}
          <section className="flex flex-col items-center text-center gap-6 py-12 bg-primary/5 border-y border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-accent/5 rounded-full -translate-x-16 -translate-y-16" />
            <div className="w-24 h-24 bg-white shadow-2xl rounded-full flex items-center justify-center relative z-10 border-4 border-primary/5">
              <TimgadLogo size={48} className="text-primary" />
            </div>
            <div className="space-y-3 px-6 relative z-10">
              <h2 className="text-2xl font-bold text-primary leading-tight">فلسفة تيمقاد: الريادة بالأصالة</h2>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                تُعد منصة تيمقاد صرحاً تقنياً عربياً يهدف إلى إعادة صياغة مفاهيم التواصل الرقمي، من خلال دمج الموروث الحضاري مع أحدث الابتكارات البرمجية، لتقديم تجربة مستخدم تتسم بالرصانة والكفاءة والاستدامة.
              </p>
            </div>
          </section>

          {/* Legal and Compliance Section */}
          <section className="space-y-5">
            <div className="flex items-center gap-3 text-primary border-r-4 border-primary pr-3">
              <Scale size={20} />
              <h3 className="font-bold text-md uppercase tracking-tighter">الإطار التشريعي والالتزام القانوني</h3>
            </div>
            <div className="bg-secondary/20 p-6 space-y-4">
              <p className="text-xs text-foreground/80 leading-relaxed">
                تعمل منصة تيمقاد بموجب **النظم والتشريعات الرقمية السارية في الجمهورية الجزائرية الديمقراطية الشعبية**، وبالتوافق التام مع المعاهدات العربية ذات الصلة. إن الالتزام بهذا الإطار التشريعي يُعد ركيزة أساسية لضمان استمرارية العضوية وجودة التفاعل:
              </p>
              <div className="grid gap-3">
                <div className="flex items-start gap-2 bg-background p-3 border">
                  <Globe size={14} className="text-primary mt-0.5" />
                  <p className="text-[10px] text-muted-foreground">تخضع كافة البيانات والأنشطة للمعايير القانونية الوطنية والعربية، مع الالتزام بالشفافية الكاملة في إدارة المحتوى الرقمي.</p>
                </div>
                <div className="flex items-start gap-2 bg-background p-3 border">
                  <FileText size={14} className="text-primary mt-0.5" />
                  <p className="text-[10px] text-muted-foreground">يُطالب المستخدمون بالتقيد التام بمعايير الآداب العامة والنظم الأخلاقية المتبعة في المجتمعات العربية الأصيلة.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Strict Content Prohibitions */}
          <section className="space-y-5">
            <div className="flex items-center gap-3 text-destructive border-r-4 border-destructive pr-3">
              <ShieldAlert size={20} />
              <h3 className="font-bold text-md uppercase tracking-tighter">سلامة المجتمع والمعايير السلوكية</h3>
            </div>
            <div className="p-6 border border-destructive/20 bg-destructive/5 space-y-4">
              <p className="text-xs text-foreground/80 leading-relaxed font-bold">
                تلتزم تيمقاد بمعايير السلامة العالمية الصارمة؛ حيث تُطبق ضوابط حازمة لضمان خلو المنصة من أي محتوى يتعلق بـ:
              </p>
              <ul className="text-[11px] text-muted-foreground space-y-3 list-disc pr-5">
                <li className="text-destructive font-bold">الترويج للمواد المخدرة، المؤثرات العقلية، أو المواد المحظورة بكافة أشكالها.</li>
                <li>نشر الفكر المتطرف، التحريض على العنف، أو دعم الكيانات غير المشروعة.</li>
                <li>خطاب الكراهية، العنصرية، أو المساس بالثوابت الوطنية والدينية للمجتمعات.</li>
                <li>المحتوى الخادش للحياء العام أو الذي ينتهك حقوق الإنسان والخصوصية الفردية.</li>
              </ul>
              <div className="bg-primary/10 p-3 flex items-center gap-3 border border-primary/20">
                <ShieldCheck size={16} className="text-primary shrink-0" />
                <p className="text-[10px] text-primary font-bold italic">
                  * إن الالتزام بهذه الضوابط هو ميثاق أخلاقي يربط كافة أعضاء تيمقاد لضمان بيئة تواصل آمنة ومثمرة للجميع.
                </p>
              </div>
            </div>
          </section>

          {/* Expansion Story */}
          <section className="space-y-5">
            <div className="flex items-center gap-3 text-primary border-r-4 border-accent pr-3">
              <History size={20} />
              <h3 className="font-bold text-md uppercase tracking-tighter">منشأ التطبيق ومسيرة التوسع المؤسسي</h3>
            </div>
            <div className="relative pr-6 border-r-2 border-dotted border-muted">
              <p className="text-xs text-muted-foreground leading-relaxed">
                بدأت تيمقاد كرؤية تقنية طموحة لإيجاد بديل رقمي يحترم الخصوصية العربية ويدعم الهوية الوطنية. وبفضل التطور المتسارع، شهد منشأ التطبيق **تحولاً استراتيجياً** من مجرد واجهة تواصل إلى منظومة برمجية متكاملة تسعى للريادة الإقليمية. نحن الآن في مرحلة **التوسع المؤسسي الرقمي**، حيث نستثمر في تطوير بنية تحتية مستقلة وآمنة، تهدف إلى تمكين الكوادر العربية وتقديم نموذج تقني يحتذى به في الابتكار والجودة.
              </p>
            </div>
          </section>

          {/* Pillars Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4 p-6 bg-secondary/30 border-t-4 border-primary">
              <div className="flex items-center gap-3 text-primary">
                <Target size={22} />
                <h3 className="font-bold text-sm">الرؤية الاستراتيجية</h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                أن نتبوأ مكانة الصدارة كأكثر المنصات الرقمية موثوقية في الوطن العربي، من خلال تقديم بيئة تكنولوجية تجمع بين الحماية الفائقة والجودة المعيارية.
              </p>
            </section>

            <section className="space-y-4 p-6 bg-secondary/30 border-t-4 border-accent">
              <div className="flex items-center gap-3 text-accent">
                <Rocket size={22} />
                <h3 className="font-bold text-sm">الرسالة التقنية</h3>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                تمكين الكوادر العربية عبر أدوات تواصل حديثة تخدم أهداف الابتكار المعرفي، مع الالتزام بتطوير بنية تحتية برمجية مستقلة وآمنة تماماً.
              </p>
            </section>
          </div>

          {/* Values Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary border-b pb-2">
              <Sparkles size={20} />
              <h3 className="font-bold text-sm uppercase">منظومة القيم الجوهرية</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: <Heart size={16} />, title: "المسؤولية الاجتماعية", desc: "وضع مصلحة المجتمع الرقمي فوق كل اعتبار تجاري." },
                { icon: <ShieldCheck size={16} />, title: "الجودة والمعيارية", desc: "الالتزام الصارم بأعلى معايير الأمان الأداء العالمي." },
                { icon: <Globe size={16} />, title: "الأصالة والابتكار", desc: "الموازنة بين الهوية الحضارية والتحول التكنولوجي." },
                { icon: <Users size={16} />, title: "الاهتمام بالعضو", desc: "بناء تجربة مستخدم محورها الاحترام المتبادل والخصوصية." }
              ].map((val, i) => (
                <div key={i} className="space-y-2 p-4 border bg-card hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 text-primary">
                    {val.icon}
                    <h4 className="text-[11px] font-bold">{val.title}</h4>
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-snug">{val.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <footer className="pt-20 border-t text-center space-y-8">
            <div className="flex flex-col items-center gap-3">
              <p className="text-[11px] text-muted-foreground italic leading-relaxed max-w-md">
                تيمقاد هي نتاج طموح وطني يسعى للسيادة التقنية.<br />نثمن ثقتكم وانضمامكم لهذه الرحلة التي تهدف لبناء مستقبل رقمي عربي أفضل.
              </p>
              <div className="flex flex-col gap-1 items-center">
                <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em]">Institutional Compliance Division</span>
                <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Algerian & Arab Jurisdiction | 2024-2025</span>
              </div>
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full text-[10px] h-9 px-10 font-bold border-primary/20 text-primary" onClick={() => router.push('/')}>العودة للرئيسية</Button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
