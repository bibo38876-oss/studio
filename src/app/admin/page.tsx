
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, query, doc, limit, where, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, ShieldCheck, BarChart3, Users, MessageSquare, TrendingUp, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

export default function AdminPage() {
  const { firestore, user: currentUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isAdminUser = currentUser?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isUserLoading && !isAdminUser) {
      router.push('/');
    }
  }, [isAdminUser, isUserLoading, router]);

  // جلب المستخدمين - مسموح فقط للأدمن
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'users'), limit(100));
  }, [firestore, isAdminUser]);

  // جلب المنشورات العامة للإحصائيات - مسموح فقط للأدمن
  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'posts'), limit(500));
  }, [firestore, isAdminUser]);

  // جلب المنشورات المبلغ عنها - مسموح فقط للأدمن
  const reportedPostsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'posts'), where('reportsCount', '>=', 100), limit(50));
  }, [firestore, isAdminUser]);

  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);
  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery);
  const { data: reportedPosts, isLoading: isReportedLoading } = useCollection(reportedPostsQuery);

  const stats = useMemo(() => {
    if (!users || !posts) return { totalUsers: 0, totalPosts: 0, totalInteractions: 0, trendingTags: 0 };
    
    const totalInteractions = posts.reduce((acc, post) => {
      return acc + (post.likesCount || 0) + (post.commentsCount || 0) + (post.repostsCount || 0);
    }, 0);

    const allTags = new Set();
    posts.forEach(post => {
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach(tag => allTags.add(tag));
      }
    });

    return {
      totalUsers: users.length,
      totalPosts: posts.length,
      totalInteractions,
      trendingTags: allTags.size
    };
  }, [users, posts]);

  const growthData = useMemo(() => {
    if (!stats.totalUsers || !stats.totalPosts) return [];
    const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    return days.map((day, i) => ({
      name: day,
      users: Math.floor((stats.totalUsers / 7) * (i + 1)),
      posts: Math.floor((stats.totalPosts / 7) * (i + 1.5))
    }));
  }, [stats]);

  const filteredUsers = users?.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleUpdateVerification = (userId: string, type: string) => {
    if (!firestore || !isAdminUser) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), {
      verificationType: type,
    });
    toast({ description: "تم تحديث حالة التوثيق بنجاح." });
  };

  const handleDeleteViolatingPost = (post: any) => {
    if (!firestore || !isAdminUser) return;

    deleteDocumentNonBlocking(doc(firestore, 'posts', post.id));

    addDocumentNonBlocking(collection(firestore, 'users', post.authorId, 'notifications'), {
      type: 'violation',
      message: 'تم حذف منشورك لمخالفته إرشادات مجتمع تيمقاد.',
      postContent: post.content?.substring(0, 50) + '...',
      createdAt: serverTimestamp(),
      read: false
    });

    toast({ title: "تم الحذف", description: "تم حذف المنشور وإرسال تنبيه للمستخدم." });
  };

  if (isUserLoading || !isAdminUser) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const isLoading = isUsersLoading || isPostsLoading;

  return (
    <div className="min-h-screen bg-background text-right">
      <Navbar />
      
      <main className="container mx-auto max-w-4xl pt-10 pb-20 px-4">
        <div className="flex items-center gap-3 mb-8 bg-primary/5 p-6 border-b border-primary/20 justify-end">
          <div className="text-right">
            <h1 className="text-xl font-bold text-primary">لوحة إدارة تيمقاد</h1>
            <p className="text-xs text-muted-foreground">الرقابة والتحكم في المحتوى والمستخدمين</p>
          </div>
          <ShieldCheck size={32} className="text-primary" />
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="w-full bg-secondary/20 mb-6 rounded-none p-1 overflow-x-auto no-scrollbar">
            <TabsTrigger value="analytics" className="flex-1 text-[10px] font-bold gap-1">
              <BarChart3 size={12} /> الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex-1 text-[10px] font-bold gap-1 relative">
              <AlertTriangle size={12} /> الرقابة
              {reportedPosts && reportedPosts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {reportedPosts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 text-[10px] font-bold gap-1">
              <Users size={12} /> المستخدمين
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-none shadow-sm rounded-none bg-primary/5 text-right">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] text-muted-foreground uppercase flex items-center gap-2 justify-end">
                    إجمالي المستخدمين <Users size={12} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-primary">{stats.totalUsers}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-none bg-accent/5 text-right">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] text-muted-foreground uppercase flex items-center gap-2 justify-end">
                    إجمالي التفاعل <MessageSquare size={12} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-accent">{stats.totalInteractions}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-none bg-secondary/50 text-right">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] text-muted-foreground uppercase flex items-center gap-2 justify-end">
                    المواضيع الرائجة <TrendingUp size={12} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold text-foreground">{stats.trendingTags}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-sm rounded-none text-right">
              <CardHeader>
                <CardTitle className="text-sm font-bold">نمو المنصة</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '10px', textAlign: 'right' }} />
                      <Line type="monotone" dataKey="users" name="المستخدمين" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="posts" name="المنشورات" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation">
            <div className="space-y-4">
              <div className="bg-red-50 p-4 border border-red-100 flex items-center gap-3">
                <AlertTriangle className="text-red-500 shrink-0" />
                <div className="text-right">
                  <h3 className="text-xs font-bold text-red-700">مراجعة المحتوى المبلغ عنه</h3>
                  <p className="text-[10px] text-red-600">منشورات تجاوزت 100 بلاغ وتتطلب تدخل الإدارة فوراً.</p>
                </div>
              </div>

              {isReportedLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
              ) : reportedPosts && reportedPosts.length > 0 ? (
                reportedPosts.map((post: any) => (
                  <Card key={post.id} className="border-none shadow-sm rounded-none overflow-hidden">
                    <CardHeader className="bg-secondary/20 p-4 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.authorAvatar} />
                          <AvatarFallback>{post.authorName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-right">
                          <span className="text-[11px] font-bold text-primary">{post.authorName}</span>
                          <span className="text-[8px] text-muted-foreground">{post.reportsCount} بلاغ</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="h-8 text-[10px] gap-1.5 px-3 rounded-none"
                          onClick={() => handleDeleteViolatingPost(post)}
                        >
                          <Trash2 size={12} /> حذف نهائي
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-[10px] gap-1.5 px-3 rounded-none"
                          onClick={() => updateDocumentNonBlocking(doc(firestore!, 'posts', post.id), { reportsCount: 0 })}
                        >
                          <CheckCircle2 size={12} /> تجاهل البلاغ
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 text-right">
                      <p className="text-xs text-foreground/80 leading-relaxed mb-4">{post.content}</p>
                      {post.mediaUrls && post.mediaUrls.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {post.mediaUrls.map((url: string, i: number) => (
                            <img key={i} src={url} className="w-full h-24 object-cover border" alt="Violating media" />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-muted">
                  <CheckCircle2 size={40} className="mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-xs text-muted-foreground font-bold">لا يوجد محتوى يتطلب المراجعة حالياً.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="relative mb-6">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="ابحث عن مستخدم للتوثيق..." 
                className="pr-10 h-10 rounded-none bg-secondary/30 border-none text-xs text-right"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {isUsersLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div key={user.id} className="bg-card p-4 border flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={user.profilePictureUrl} />
                        <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-right">
                        <div className="flex items-center gap-1.5 leading-tight">
                          <VerifiedBadge type={user.verificationType || 'none'} />
                          <span className="text-xs font-bold text-primary">{user.username}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{user.email}</span>
                      </div>
                    </div>

                    <Select 
                      defaultValue={user.verificationType || 'none'} 
                      onValueChange={(val) => handleUpdateVerification(user.id, val)}
                    >
                      <SelectTrigger className="h-8 text-[10px] w-[120px] rounded-none bg-secondary/50 border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون توثيق</SelectItem>
                        <SelectItem value="blue">أزرق (مستخدم)</SelectItem>
                        <SelectItem value="gold">ذهبي (إعلامي)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 border-dashed border-2">
                  <p className="text-xs text-muted-foreground">لا يوجد نتائج للبحث.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
