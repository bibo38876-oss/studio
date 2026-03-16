"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, limit } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, ShieldCheck, BarChart3, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';

// بيانات تجريبية للرسوم البيانية
const growthData = [
  { name: 'السبت', users: 400, posts: 240 },
  { name: 'الأحد', users: 300, posts: 139 },
  { name: 'الاثنين', users: 200, posts: 980 },
  { name: 'الثلاثاء', users: 278, posts: 390 },
  { name: 'الأربعاء', users: 189, posts: 480 },
  { name: 'الخميس', users: 239, posts: 380 },
  { name: 'الجمعة', users: 349, posts: 430 },
];

export default function AdminPage() {
  const { firestore, user: currentUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';

  useEffect(() => {
    if (!isUserLoading && (!currentUser || currentUser.email !== ADMIN_EMAIL)) {
      router.push('/');
    }
  }, [currentUser, isUserLoading, router]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), limit(50));
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const filteredUsers = users?.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleUpdateVerification = (userId: string, type: string) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), {
      verificationType: type,
    });
    toast({ description: "تم تحديث حالة التوثيق بنجاح." });
  };

  if (isUserLoading || !currentUser || currentUser.email !== ADMIN_EMAIL) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-4xl pt-10 pb-20 px-4">
        <div className="flex items-center gap-3 mb-8 bg-primary/5 p-6 border-b border-primary/20">
          <ShieldCheck size={32} className="text-primary" />
          <div>
            <h1 className="text-xl font-bold text-primary">لوحة إدارة تواصل</h1>
            <p className="text-xs text-muted-foreground">إحصائيات المنصة والتحكم في المستخدمين</p>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="w-full bg-secondary/20 mb-6 rounded-none p-1">
            <TabsTrigger value="analytics" className="flex-1 text-xs font-bold gap-2">
              <BarChart3 size={14} />
              الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 text-xs font-bold gap-2">
              <Users size={14} />
              المستخدمين
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm rounded-none bg-primary/5">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] text-muted-foreground uppercase flex items-center gap-2">
                    <Users size={12} /> إجمالي المستخدمين
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-primary">{users?.length || 0}</p>
                  <p className="text-[8px] text-green-600 font-bold mt-1">+12% منذ الأمس</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-none bg-accent/5">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] text-muted-foreground uppercase flex items-center gap-2">
                    <MessageSquare size={12} /> التفاعل الكلي
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-accent">1.2K</p>
                  <p className="text-[8px] text-green-600 font-bold mt-1">+5% منذ الأمس</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-none bg-secondary/50">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] text-muted-foreground uppercase flex items-center gap-2">
                    <TrendingUp size={12} /> المواضيع الرائجة
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-foreground">12</p>
                  <p className="text-[8px] text-muted-foreground mt-1">وسوم نشطة حالياً</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card className="border-none shadow-sm rounded-none">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">نمو المستخدمين والنشاط</CardTitle>
                  <CardDescription className="text-[10px]">معدل التسجيل ونشر المحتوى خلال الأسبوع الأخير</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ fontSize: '10px', borderRadius: '0', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                      />
                      <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="posts" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="relative mb-6">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="ابحث عن مستخدم للتوثيق..." 
                className="pr-10 h-10 rounded-none bg-secondary/30 border-none text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div key={user.id} className="bg-card p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={user.profilePictureUrl} alt={user.username} />
                        <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-primary">{user.username}</span>
                          <VerifiedBadge type={user.email === ADMIN_EMAIL ? 'blue' : (user.verificationType || 'none')} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{user.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select 
                        defaultValue={user.email === ADMIN_EMAIL ? 'blue' : (user.verificationType || 'none')} 
                        onValueChange={(val) => handleUpdateVerification(user.id, val)}
                      >
                        <SelectTrigger className="h-8 text-[10px] w-[120px] rounded-none bg-secondary/50 border-none">
                          <SelectValue placeholder="نوع التوثيق" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">بدون توثيق</SelectItem>
                          <SelectItem value="blue">أزرق (مستخدم)</SelectItem>
                          <SelectItem value="gold">ذهبي (إعلامي)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-muted/20 border-dashed border-2">
                  <p className="text-xs text-muted-foreground font-bold">لا يوجد مستخدمين مطابقين للبحث.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
