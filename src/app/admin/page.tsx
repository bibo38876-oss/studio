
"use client"

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, doc, limit, where, serverTimestamp, orderBy, increment } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, ShieldCheck, BarChart3, Users, MessageSquare, TrendingUp, AlertTriangle, Trash2, CheckCircle2, Coins, History, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
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
  const [coinAmount, setCoinAmount] = useState<Record<string, string>>({});

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isAdminUser = currentUser?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isUserLoading && !isAdminUser) {
      router.push('/');
    }
  }, [isAdminUser, isUserLoading, router]);

  // استعلامات البيانات
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'users'), limit(100));
  }, [firestore, isAdminUser]);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'posts'), limit(500));
  }, [firestore, isAdminUser]);

  const reportedPostsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'posts'), where('reportsCount', '>', 0), orderBy('reportsCount', 'desc'), limit(50));
  }, [firestore, isAdminUser]);

  const vaultHistoryQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'vault_history'), orderBy('brokenAt', 'desc'), limit(20));
  }, [firestore, isAdminUser]);

  const { data: users, isLoading: isUsersLoading } = useCollection(usersQuery);
  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery);
  const { data: reportedPosts, isLoading: isReportedLoading } = useCollection(reportedPostsQuery);
  const { data: vaultHistory, isLoading: isHistoryLoading } = useCollection(vaultHistoryQuery);

  const stats = useMemo(() => {
    if (!users || !posts || !vaultHistory) return { totalUsers: 0, totalPosts: 0, totalFees: 0, totalCoins: 0 };
    
    const totalFees = vaultHistory.reduce((acc, entry) => acc + (entry.platformFee || 0), 0);
    const totalCoins = users.reduce((acc, u) => acc + (u.coins || 0), 0);

    return {
      totalUsers: users.length,
      totalPosts: posts.length,
      totalFees,
      totalCoins
    };
  }, [users, posts, vaultHistory]);

  const filteredUsers = users?.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleUpdateVerification = (userId: string, type: string) => {
    if (!firestore || !isAdminUser) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), {
      verificationType: type,
    });
    toast({ description: "تم تحديث حالة التوثيق." });
  };

  const handleAdjustCoins = (userId: string) => {
    const amount = parseInt(coinAmount[userId] || '0');
    if (isNaN(amount) || amount === 0) {
      toast({ variant: "destructive", description: "يرجى إدخال مبلغ صحيح (موجب للإضافة، سالب للسحب)." });
      return;
    }

    if (!firestore || !isAdminUser) return;

    // الخصم أو الإضافة اليدوية من الإدارة
    updateDocumentNonBlocking(doc(firestore, 'users', userId), {
      coins: increment(amount)
    });

    // إرسال إشعار للمستخدم بالتعديل اليدوي
    addDocumentNonBlocking(collection(firestore, 'users', userId, 'notifications'), {
      type: 'system',
      message: amount > 0 
        ? `🎁 قامت الإدارة بمنحك ${amount} عملة تيمقاد إضافية.` 
        : `⚠️ قامت الإدارة بسحب ${Math.abs(amount)} عملة تيمقاد من رصيدك.`,
      createdAt: serverTimestamp(),
      read: false
    });

    setCoinAmount(prev => ({ ...prev, [userId]: '' }));
    toast({ 
      title: "تم تحديث الرصيد", 
      description: `تم ${amount > 0 ? 'منح' : 'سحب'} ${Math.abs(amount)} عملة للمستخدم.` 
    });
  };

  const handleDeleteViolatingPost = (post: any) => {
    if (!firestore || !isAdminUser) return;
    deleteDocumentNonBlocking(doc(firestore, 'posts', post.id));
    toast({ title: "تم الحذف", description: "تم حذف المنشور المخالف بنجاح." });
  };

  if (isUserLoading || !isAdminUser) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background text-right">
      <Navbar />
      
      <main className="container mx-auto max-w-5xl pt-10 pb-20 px-4">
        <header className="flex items-center justify-between mb-8 bg-primary p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold text-white uppercase tracking-tighter">مركز قيادة تيمقاد</h1>
              <p className="text-[10px] text-white/60 font-medium uppercase tracking-[0.2em]">Manual & Auto Coin Control Center</p>
            </div>
          </div>
          <div className="flex flex-col items-end relative z-10">
            <span className="text-[10px] text-white/60 font-bold">نظام العملات</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">آلي ومراقب</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]" />
            </div>
          </div>
        </header>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="w-full bg-secondary/30 mb-8 rounded-none p-1 border-b h-12">
            <TabsTrigger value="analytics" className="flex-1 text-[11px] font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <BarChart3 size={14} /> الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1 text-[11px] font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users size={14} /> إدارة الأعضاء
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex-1 text-[11px] font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <AlertTriangle size={14} /> الرقابة
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 text-[11px] font-bold gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
              <History size={14} /> سجل الخزنة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm rounded-none bg-primary/5 text-right border-r-4 border-r-primary">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] text-muted-foreground uppercase flex items-center gap-2 justify-end">إجمالي المستخدمين <Users size={12} /></CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0"><p className="text-2xl font-bold text-primary">{stats.totalUsers}</p></CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-none bg-accent/5 text-right border-r-4 border-r-accent">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] text-muted-foreground uppercase flex items-center gap-2 justify-end">أرباح المنصة (الرسوم) <ArrowUpRight size={12} /></CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-2xl font-bold text-accent">{stats.totalFees}</p>
                    <TimgadCoin size={20} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-none bg-yellow-500/5 text-right border-r-4 border-r-yellow-600">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] text-muted-foreground uppercase flex items-center gap-2 justify-end">العملات المتداولة <Coins size={12} /></CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-2 justify-end">
                    <p className="text-2xl font-bold text-yellow-600">{stats.totalCoins}</p>
                    <TimgadCoin size={20} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-none bg-secondary/50 text-right border-r-4 border-r-muted-foreground">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] text-muted-foreground uppercase flex items-center gap-2 justify-end">إجمالي المنشورات <MessageSquare size={12} /></CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0"><p className="text-2xl font-bold text-foreground">{stats.totalPosts}</p></CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm rounded-none">
                <CardHeader><CardTitle className="text-sm font-bold">نمو الأرباح (رسوم الجرة)</CardTitle></CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vaultHistory?.slice().reverse()}>
                      <defs>
                        <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="brokenAt" hide />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '10px', textAlign: 'right' }} labelFormatter={() => 'تاريخ الكنز'} />
                      <Area type="monotone" dataKey="platformFee" name="رسوم المنصة" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorFee)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-none">
                <CardHeader><CardTitle className="text-sm font-bold">أحدث البلاغات</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {reportedPosts?.slice(0, 5).map((post: any) => (
                    <div key={post.id} className="flex items-center justify-between p-2 bg-red-50 border-r-2 border-r-red-500">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-red-700">{post.authorName}</span>
                        <p className="text-[9px] text-red-600 line-clamp-1">{post.content}</p>
                      </div>
                      <Badge variant="destructive" className="text-[8px] h-4">{post.reportsCount} بلاغ</Badge>
                    </div>
                  ))}
                  {(!reportedPosts || reportedPosts.length === 0) && (
                    <p className="text-center py-10 text-[10px] text-muted-foreground italic">لا توجد بلاغات حالياً.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="relative mb-6">
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="ابحث عن عضو بالإسم أو البريد..." 
                className="pr-10 h-12 rounded-none bg-secondary/30 border-none text-xs text-right"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isUsersLoading ? (
                <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
              ) : filteredUsers.map((user) => (
                <Card key={user.id} className="border-none shadow-sm rounded-none bg-card hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/10">
                          <AvatarImage src={user.profilePictureUrl} />
                          <AvatarFallback>{user.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-right">
                          <div className="flex items-center gap-1.5 leading-tight">
                            <VerifiedBadge type={user.verificationType || 'none'} size={14} />
                            <span className="text-xs font-bold text-primary">{user.username}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                      <div className="bg-primary/5 p-2 border border-primary/10 flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">{user.coins || 0}</span>
                        <TimgadCoin size={16} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-muted-foreground uppercase">حالة التوثيق</label>
                        <Select 
                          defaultValue={user.verificationType || 'none'} 
                          onValueChange={(val) => handleUpdateVerification(user.id, val)}
                        >
                          <SelectTrigger className="h-8 text-[9px] rounded-none bg-secondary/50 border-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">مستكشف (عادي)</SelectItem>
                            <SelectItem value="blue">أزرق (موثق)</SelectItem>
                            <SelectItem value="gold">ذهبي (إعلامي/إدارة)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-muted-foreground uppercase">تعديل العملات (+/-)</label>
                        <div className="flex gap-1">
                          <Input 
                            type="number" 
                            placeholder="+/- مبلغ" 
                            className="h-8 text-[10px] rounded-none bg-secondary/50 border-none text-center"
                            value={coinAmount[user.id] || ''}
                            onChange={(e) => setCoinAmount(prev => ({ ...prev, [user.id]: e.target.value }))}
                          />
                          <Button 
                            size="sm" 
                            className="h-8 w-8 p-0 rounded-none bg-accent hover:bg-accent/90"
                            onClick={() => handleAdjustCoins(user.id)}
                          >
                            <CheckCircle2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            <div className="bg-destructive/10 p-4 border-r-4 border-r-destructive flex items-center gap-3">
              <AlertTriangle className="text-destructive shrink-0" />
              <div className="text-right">
                <h3 className="text-xs font-bold text-destructive">البلاغات المعلقة</h3>
                <p className="text-[10px] text-muted-foreground">قرارات الحذف اليدوي للمنشورات المخالفة.</p>
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
                        <span className="text-[8px] text-destructive font-bold">{post.reportsCount} بلاغ مجتمعي</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" className="h-8 text-[9px] gap-1.5 px-3 rounded-none font-bold" onClick={() => handleDeleteViolatingPost(post)}><Trash2 size={12} /> حذف</Button>
                      <Button size="sm" variant="outline" className="h-8 text-[9px] gap-1.5 px-3 rounded-none font-bold" onClick={() => updateDocumentNonBlocking(doc(firestore!, 'posts', post.id), { reportsCount: 0 })}><CheckCircle2 size={12} /> تجاهل</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 text-right">
                    <p className="text-xs text-foreground/80 leading-relaxed mb-4">{post.content}</p>
                    {post.mediaUrls && post.mediaUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {post.mediaUrls.map((url: string, i: number) => (
                          <img key={i} src={url} className="w-full h-20 object-cover border" alt="Violating media" />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed">
                <CheckCircle2 size={40} className="mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-xs text-muted-foreground font-bold">لا توجد بلاغات حالياً.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="bg-accent/10 p-4 border-r-4 border-r-accent flex items-center gap-3">
              <History className="text-accent shrink-0" />
              <div className="text-right">
                <h3 className="text-xs font-bold text-accent">سجلات جرة تيمقاد</h3>
                <p className="text-[10px] text-muted-foreground">أرشيف الكنوز الموزعة ورسوم المنصة المحصلة يدوياً.</p>
              </div>
            </div>

            <div className="space-y-3">
              {isHistoryLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
              ) : vaultHistory && vaultHistory.length > 0 ? (
                vaultHistory.map((history: any) => (
                  <Card key={history.id} className="border-none shadow-none rounded-none bg-card border-b">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] font-bold text-primary">تاريخ الانكسار</span>
                          <span className="text-[9px] text-muted-foreground">{new Date(history.brokenAt).toLocaleString('ar-SA')}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">إجمالي الجرة</span>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold text-primary">{history.totalCoins}</span>
                              <TimgadCoin size={14} />
                            </div>
                          </div>
                          <div className="flex flex-col items-center bg-accent/5 p-2 border border-accent/10">
                            <span className="text-[8px] font-bold text-accent uppercase">حصيلة المنصة</span>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold text-accent">{history.platformFee}</span>
                              <TimgadCoin size={14} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                        {(history.winners || []).map((winner: any, i: number) => (
                          <div key={i} className="flex flex-col items-center gap-1 min-w-[60px]">
                            <Avatar className="h-8 w-8 border border-muted/20">
                              <AvatarImage src={winner.avatar} />
                              <AvatarFallback className="text-[8px]">{winner.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-[7px] font-bold text-primary truncate max-w-[50px]">{winner.username}</span>
                            <span className="text-[7px] text-accent font-bold">+{winner.prize}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 text-muted-foreground text-xs italic">لا توجد سجلات سابقة بعد.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
