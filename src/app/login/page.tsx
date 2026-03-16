
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
        toast({ title: "مرحباً بعودتك!", description: "تم تسجيل الدخول بنجاح." });
        router.push('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // تحديث الاسم في ملف التعريف الخاص بـ Auth
        await updateProfile(user, { displayName: username });
        
        // إنشاء ملف مستخدم كامل في Firestore
        await setDoc(doc(firestore, 'users', user.uid), {
          id: user.uid,
          username: username,
          email: email,
          profilePictureUrl: "", // سيعتمد التطبيق تلقائياً على أول حرف من الاسم
          createdAt: new Date().toISOString(),
          bio: 'مرحباً، أنا مستخدم جديد في تواصل. فخور بانضمامي لهذا المجتمع!',
          followingIds: [],
          followerIds: []
        });

        toast({ title: "تم إنشاء الحساب!", description: "مرحباً بك في مجتمع تواصل. دعنا نبدأ بضبط ملفك الشخصي." });
        
        // التوجيه إلى الصفحة الشخصية للمستخدم الجديد بدلاً من الرئيسية
        router.push(`/profile/${user.uid}`);
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary font-headline tracking-tighter">
            تواصل <span className="text-accent text-xs">Tawasul</span>
          </h1>
          <p className="text-xs text-muted-foreground">كن جزءاً من مجتمعنا العربي المتطور</p>
        </div>

        <Card className="border-none shadow-none bg-card rounded-none">
          <CardHeader className="px-6 pt-6 pb-2">
            <CardTitle className="text-sm font-bold text-primary">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground">اسم المستخدم</label>
                  <Input 
                    placeholder="مثال: أحمد العتيبي" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-9 text-xs rounded-none bg-secondary/30 border-none"
                    required
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground">البريد الإلكتروني</label>
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs rounded-none bg-secondary/30 border-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground">كلمة المرور</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-xs rounded-none bg-secondary/30 border-none"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-9 rounded-full font-bold text-xs gap-2" 
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                {isLogin ? 'دخول' : 'تسجيل'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] text-primary font-bold hover:underline"
              >
                {isLogin ? 'لا تملك حساباً؟ سجل الآن' : 'لديك حساب بالفعل؟ ادخل هنا'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
