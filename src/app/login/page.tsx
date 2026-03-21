
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2, Sparkles, ShieldCheck, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import TimgadLogo from '@/components/ui/Logo';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { auth, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "مرحباً بعودتك!", description: "تم تسجيل الدخول بنجاح إلى تيمقاد." });
        router.push('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: username });
        
        const now = new Date().toISOString();
        await setDoc(doc(firestore, 'users', user.uid), {
          id: user.uid,
          username: username,
          email: email,
          profilePictureUrl: "",
          createdAt: now,
          lastLoginAt: now,
          lastPassiveRewardAt: now, // تهيئة تاريخ أول مكافأة سلبيّة
          bio: 'مرحباً، أنا مستخدم جديد في تيمقاد. فخور بانضمامي لهذه المنصة العريقة!',
          followingIds: [],
          followerIds: [],
          interactedAuthorIds: [],
          role: 'user',
          verificationType: 'none',
          coins: 10 
        });

        toast({ title: "تم إنشاء الحساب!", description: "مرحباً بك في تيمقاد. لقد حصلت على 10 عملات هدية انضمام!" });
        router.push('/onboarding');
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "خطأ في العملية", 
        description: error.message || "تأكد من البيانات المدخلة." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* عناصر جمالية في الخلفية */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse" />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex justify-center"
          >
            <div className="p-4 bg-white shadow-2xl rounded-full border-2 border-primary/10">
              <TimgadLogo size={56} className="text-primary" />
            </div>
          </motion.div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-primary font-headline tracking-tighter">
              تيمقاد <span className="text-accent text-sm">Timgad</span>
            </h1>
            
            {/* التعريف الأكاديمي الملكي */}
            <div className="px-2">
              <p className="text-[11px] leading-relaxed text-accent font-bold text-center bg-accent/5 p-4 border-y border-accent/20 rounded-sm">
                "منصة تيمقاد الرقمية تمثل الجيل الجديد من الشبكات الاجتماعية السيادية؛ حيث تعد المنصة الأولى التي تدمج بروتوكولات العملات الرقمية (TRX) ضمن نسيجها الاجتماعي، متبنيةً نموذجاً اقتصادياً مبتكراً يتيح للمستخدمين والمعلنين تبادل القيمة الحقيقية من خلال المحتوى والإعلانات التفاعلية في بيئة تقنية آمنة ومتطورة."
              </p>
            </div>
          </div>
        </div>

        <Card className="border-none shadow-xl bg-card/80 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="px-6 pt-8 pb-2 text-center">
            <CardTitle className="text-md font-bold text-primary flex items-center justify-center gap-2">
              {isLogin ? <ShieldCheck size={18} className="text-accent" /> : <Globe size={18} className="text-accent" />}
              {isLogin ? 'بوابة الدخول للمجتمع' : 'تأسيس هوية رقمية'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground mr-1 uppercase">اسم المستخدم الفريد</label>
                  <Input 
                    placeholder="مثال: القائد القرطاجي" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-10 text-xs rounded-xl bg-secondary/50 border-none text-right focus:ring-accent"
                    required
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground mr-1 uppercase">البريد الإلكتروني المؤسسي</label>
                <Input 
                  type="email" 
                  placeholder="name@timgad.app" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-secondary/50 border-none text-right focus:ring-accent"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground mr-1 uppercase">رمز الوصول المشفر</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-secondary/50 border-none text-right focus:ring-accent"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 rounded-full font-bold text-xs gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all" 
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                {isLogin ? 'تفعيل الدخول' : 'بدأ المسيرة الرقمية'}
              </Button>
            </form>

            <div className="mt-8 text-center flex flex-col gap-4">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] text-primary font-bold hover:text-accent transition-colors flex items-center justify-center gap-1"
              >
                {isLogin ? (
                  <>لا تملك حساباً؟ <span className="underline decoration-accent/50">انضم لنخبة تيمقاد</span></>
                ) : (
                  <>لديك حساب بالفعل؟ <span className="underline decoration-accent/50">سجل حضورك الآن</span></>
                )}
              </button>
              
              <div className="flex items-center justify-center gap-2 opacity-40">
                <div className="h-px w-8 bg-muted-foreground" />
                <span className="text-[8px] font-bold uppercase tracking-widest">Powered by TRX Protocols</span>
                <div className="h-px w-8 bg-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-[9px] text-muted-foreground/60 flex items-center justify-center gap-1 font-medium">
            <Sparkles size={10} className="text-accent" />
            تيمقاد: حيث يلتقي التراث التاريخي بالمستقبل المالي
          </p>
        </div>
      </div>
    </div>
  );
}
