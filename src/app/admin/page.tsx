
"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, doc, limit, where, serverTimestamp, orderBy, increment, getDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, ShieldCheck, BarChart3, Users, MessageSquare, AlertTriangle, Trash2, CheckCircle2, Coins, History, ArrowUpRight, TrendingUp, LayoutGrid, Plus, Calendar as CalendarIcon, ImageIcon, Megaphone, ArrowDownToLine, Wallet, Flag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const { firestore, user: currentUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [coinAmount, setCoinAmount] = useState<Record<string, string>>({});

  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerDays, setBannerDays] = useState('5');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [postAdId, setPostAdId] = useState('');
  const [postAdTitle, setPostAdIdTitle] = useState('');
  const [postAdLink, setPostAdIdLink] = useState('');
  const [postAdImage, setPostAdIdImage] = useState<string | null>(null);
  const postAdFileRef = useRef<HTMLInputElement>(null);

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';
  const isAdminUser = currentUser?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isUserLoading && !isAdminUser) {
      router.push('/');
    }
  }, [isAdminUser, isUserLoading, router]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'users'), limit(100));
  }, [firestore, isAdminUser]);

  const postAdsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'post_ads'), orderBy('createdAt', 'desc'));
  }, [firestore, isAdminUser]);

  const revenueQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'platform_revenue'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore, isAdminUser]);

  const bannersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'admin_banners'), orderBy('createdAt', 'desc'));
  }, [firestore, isAdminUser]);

  const withdrawalsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'withdrawal_requests'), orderBy('createdAt', 'desc'));
  }, [firestore, isAdminUser]);

  const reportedPostsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'posts'), where('reportsCount', '>', 0), orderBy('reportsCount', 'desc'));
  }, [firestore, isAdminUser]);

  const { data: users } = useCollection(usersQuery);
  const { data: postAds } = useCollection(postAdsQuery);
  const { data: revenue } = useCollection(revenueQuery);
  const { data: banners } = useCollection(bannersQuery);
  const { data: withdrawals } = useCollection(withdrawalsQuery);
  const { data: reportedPosts } = useCollection(reportedPostsQuery);

  const stats = useMemo(() => {
    if (!users || !revenue) return { totalUsers: 0, totalRevenue: 0, totalCoins: 0 };
    const totalRevenue = revenue.reduce((acc, entry) => acc + (entry.amount || 0), 0);
    const totalCoins = users.reduce((acc, u) => acc + (u.coins || 0), 0);
    return { totalUsers: users.length, totalRevenue, totalCoins };
  }, [users, revenue]);

  const filteredUsers = users?.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleCreatePostAd = async () => {
    if (!postAdId || !postAdTitle || !postAdImage || !firestore) return;
    
    setIsUploading(true);
    try {
      const postSnap = await getDoc(doc(firestore, 'posts', postAdId));
      if (!postSnap.exists()) {
        toast({ variant: "destructive", description: "المنشور غير موجود." });
        return;
      }
      const postData = postSnap.data();
      const authorId = postData.authorId;

      const authorSnap = await getDoc(doc(firestore, 'users', authorId));
      const authorData = authorSnap.data();
      
      const isVerified = authorData?.verificationType === 'blue' || authorData?.verificationType === 'gold';
      const hasMinFollowers = (authorData?.followerIds?.length || 0) >= 500;
      const isEligible = isVerified && hasMinFollowers;

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3); 

      await addDocumentNonBlocking(collection(firestore, 'post_ads'), {
        postId: postAdId,
        title: postAdTitle,
        link: postAdLink,
        imageUrl: postAdImage,
        expiresAt: expiresAt,
        createdAt: serverTimestamp()
      });

      if (isEligible) {
        const rewardAmount = 250;
        updateDocumentNonBlocking(doc(firestore, 'users', authorId), {
          coins: increment(rewardAmount)
        });

        addDocumentNonBlocking(collection(firestore, 'users', authorId, 'notifications'), {
          type: 'system',
          message: `🎉 مبروك! منشورك حقق شروط الربح (500+ متابع وتوثيق) وتم وضع إعلان عليه، حصلت على ${rewardAmount} عملة.`,
          createdAt: serverTimestamp(),
          read: false
        });

        addDocumentNonBlocking(collection(firestore, 'platform_revenue'), {
          type: 'post_ad_share',
          amount: 250,
          postId: postAdId,
          fromUserId: authorId,
          createdAt: serverTimestamp()
        });
        toast({ description: `تم النشر. العضو مؤهل وحصل على 250 عملة.` });
      } else {
        addDocumentNonBlocking(collection(firestore, 'platform_revenue'), {
          type: 'post_ad_full',
          amount: 500,
          postId: postAdId,
          fromUserId: authorId,
          createdAt: serverTimestamp()
        });
        toast({ description: `تم النشر. العضو غير مؤهل، الإيراد كامل للمنصة.` });
      }

      setPostAdId(''); setPostAdIdTitle(''); setPostAdIdImage(null);
    } catch (e) {
      toast({ variant: "destructive", description: "فشل إنشاء الإعلان." });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePostAdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setPostAdIdImage(url);
    } catch (e) { toast({ description: "فشل الرفع." }); }
    finally { setIsUploading(false); }
  };

  const handleCreateBanner = async () => {
    if (!bannerTitle || !bannerLink || !bannerImage || !firestore) return;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(bannerDays));

    await addDocumentNonBlocking(collection(firestore, 'admin_banners'), {
      title: bannerTitle,
      link: bannerLink,
      imageUrl: bannerImage,
      expiresAt: expiresAt,
      createdAt: serverTimestamp()
    });

    toast({ description: "تمت إضافة البانر بنجاح." });
    setBannerTitle(''); setBannerLink(''); setBannerImage(null);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setBannerImage(url);
    } catch (e) { toast({ description: "فشل الرفع." }); }
    finally { setIsUploading(false); }
  };

  const handleCompleteWithdrawal = async (id: string) => {
    if (!firestore) return;
    updateDocumentNonBlocking(doc(firestore, 'withdrawal_requests', id), {
      status: 'completed',
      completedAt: serverTimestamp()
    });
    toast({ description: "تم تعليم الطلب كمكتمل بنجاح." });
  };

  if (isUserLoading || !isAdminUser) return null;

  return (
    <div className="min-h-screen bg-background text-right">
      <Navbar />
      <main className="container mx-auto max-w-5xl pt-10 pb-20 px-4">
        <header className="flex items-center justify-between mb-8 bg-primary p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <ShieldCheck size={24} className="text-white" />
            <div className="text-right">
              <h1 className="text-xl font-bold text-white uppercase">مركز قيادة تيمقاد</h1>
              <p className="text-[10px] text-white/60">الإدارة والتحكم الاقتصادي</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="w-full bg-secondary/30 mb-8 rounded-none p-1 border-b h-12 overflow-x-auto no-scrollbar">
            <TabsTrigger value="analytics" className="flex-1 text-[11px] font-bold gap-2">الإحصائيات</TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex-1 text-[11px] font-bold gap-2 text-accent">طلبات السحب</TabsTrigger>
            <TabsTrigger value="moderation" className="flex-1 text-[11px] font-bold gap-2 text-destructive">الرقابة</TabsTrigger>
            <TabsTrigger value="post_ads" className="flex-1 text-[11px] font-bold gap-2">إعلانات المنشورات</TabsTrigger>
            <TabsTrigger value="banners" className="flex-1 text-[11px] font-bold gap-2">مستطيلات السوق</TabsTrigger>
            <TabsTrigger value="users" className="flex-1 text-[11px] font-bold gap-2">الأعضاء</TabsTrigger>
            <TabsTrigger value="revenue" className="flex-1 text-[11px] font-bold gap-2">الإيرادات</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-primary/5 border-r-4 border-r-primary"><CardHeader className="p-4"><CardTitle className="text-[10px] uppercase">إجمالي المستخدمين</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold text-primary">{stats.totalUsers}</CardContent></Card>
              <Card className="bg-accent/5 border-r-4 border-r-accent"><CardHeader className="p-4"><CardTitle className="text-[10px] uppercase">أرباح المنصة (TRX)</CardTitle></CardHeader><CardContent className="p-4 pt-0 flex items-center gap-2 text-2xl font-bold text-accent">{(stats.totalRevenue / 100).toFixed(2)} TRX</CardContent></Card>
              <Card className="bg-yellow-500/5 border-r-4 border-r-yellow-600"><CardHeader className="p-4"><CardTitle className="text-[10px] uppercase">العملات المتداولة</CardTitle></CardHeader><CardContent className="p-4 pt-0 flex items-center gap-2 text-2xl font-bold text-yellow-600">{stats.totalCoins.toFixed(0)} <TimgadCoin size={20} /></CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4 text-destructive"><Flag size={16} /> المحتوى المبلّغ عنه</h3>
            <div className="grid gap-4">
              {reportedPosts?.map((post: any) => (
                <Card key={post.id} className="p-4 border-r-4 border-r-destructive">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6"><AvatarImage src={post.authorAvatar} /></Avatar>
                        <span className="text-[10px] font-bold">{post.authorName}</span>
                        <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 font-bold">{post.reportsCount} بلاغات</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                    </div>
                    <Button variant="destructive" size="sm" className="h-8 text-[10px]" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'posts', post.id))}>حذف نهائي</Button>
                  </div>
                </Card>
              ))}
              {(!reportedPosts || reportedPosts.length === 0) && (
                <div className="text-center py-20 opacity-40 text-xs">لا يوجد محتوى مخالف حالياً.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4"><ArrowDownToLine size={16} className="text-accent" /> طلبات سحب الأرباح (TRX)</h3>
            <div className="grid gap-4">
              {withdrawals?.map((req: any) => (
                <Card key={req.id} className={cn("p-4 border-r-4", req.status === 'completed' ? "border-r-green-500 opacity-60" : "border-r-accent")}>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">{req.username}</span>
                        <span className="text-[8px] px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">{req.email}</span>
                      </div>
                      <p className="text-[10px] font-bold text-accent">المبلغ: {req.amount} عملة ({req.finalTRX?.toFixed(2)} TRX الصافي)</p>
                      <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded mt-2">
                        <Wallet size={12} className="text-muted-foreground" />
                        <code className="text-[10px] font-mono select-all">{req.address}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.status !== 'completed' ? (
                        <>
                          <Button size="sm" className="h-8 text-[10px] font-bold bg-green-600" onClick={() => handleCompleteWithdrawal(req.id)}>إتمام التحويل</Button>
                          <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold text-destructive" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'withdrawal_requests', req.id))}>حذف</Button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> تم التحويل</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="post_ads" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><Megaphone size={16} className="text-primary" /> إضافة إعلان لمنشور (3 أيام - 5 TRX)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="معرف المنشور (Post ID)" value={postAdId} onChange={e => setPostAdId(e.target.value)} className="h-10 text-xs" />
                <Input placeholder="عنوان الإعلان" value={postAdTitle} onChange={e => setPostAdIdTitle(e.target.value)} className="h-10 text-xs" />
                <Input placeholder="رابط المعلن" value={postAdLink} onChange={e => setPostAdIdLink(e.target.value)} className="h-10 text-xs" />
                <div className="flex gap-2">
                  <Button variant="outline" className="h-10 text-xs flex-1 gap-2" onClick={() => postAdFileRef.current?.click()}>
                    {isUploading ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                    {postAdImage ? "تم اختيار صورة" : "رفع بانر المنشور"}
                  </Button>
                  <input type="file" hidden ref={postAdFileRef} onChange={handlePostAdUpload} accept="image/*" />
                  <Button className="h-10 text-xs font-bold px-8" onClick={handleCreatePostAd} disabled={!postAdImage || isUploading}>نشر الإعلان</Button>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {postAds?.map((ad: any) => (
                <Card key={ad.id} className="p-4 flex items-center justify-between border-r-4 border-r-primary">
                  <div className="flex items-center gap-4">
                    <img src={ad.imageUrl} className="h-12 w-20 object-cover rounded shadow-sm" alt="" />
                    <div className="text-right">
                      <p className="text-xs font-bold">{ad.title}</p>
                      <p className="text-[8px] text-accent">ينتهي في: {ad.expiresAt?.toDate?.().toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'post_ads', ad.id))}><Trash2 size={16} /></Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="banners" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold mb-4">إضافة مستطيل إعلاني للسوق (5 أيام - 5 TRX)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="عنوان الإعلان" value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="h-10 text-xs" />
                <Input placeholder="رابط الموقع" value={bannerLink} onChange={e => setBannerLink(e.target.value)} className="h-10 text-xs" />
                <div className="flex gap-2">
                  <Select value={bannerDays} onValueChange={setBannerDays}>
                    <SelectTrigger className="h-10 text-xs"><SelectValue placeholder="المدة" /></SelectTrigger>
                    <SelectContent><SelectItem value="5">5 أيام</SelectItem><SelectItem value="10">10 أيام</SelectItem></SelectContent>
                  </Select>
                  <Button variant="outline" className="h-10 text-xs flex-1 gap-2" onClick={() => fileInputRef.current?.click()}>
                    {isUploading ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                    {bannerImage ? "تم اختيار صورة" : "ارفع بانر (أفقي)"}
                  </Button>
                  <input type="file" hidden ref={fileInputRef} onChange={handleBannerUpload} accept="image/*" />
                </div>
                <Button className="h-10 text-xs font-bold" onClick={handleCreateBanner} disabled={!bannerImage || isUploading}>حفظ ونشر البانر</Button>
              </div>
            </Card>

            <div className="space-y-4">
              {banners?.map((banner: any) => (
                <Card key={banner.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={banner.imageUrl} className="h-12 w-20 object-cover rounded" alt="" />
                    <div className="text-right">
                      <p className="text-xs font-bold">{banner.title}</p>
                      <p className="text-[10px] text-muted-foreground">ينتهي في: {banner.expiresAt?.toDate?.().toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'admin_banners', banner.id))}><Trash2 size={16} /></Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Input placeholder="بحث..." className="bg-secondary/30 border-none" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.map(user => (
                <Card key={user.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarImage src={user.profilePictureUrl} /><AvatarFallback>{user.username?.[0]}</AvatarFallback></Avatar>
                      <div className="text-right">
                        <div className="flex items-center gap-1"><VerifiedBadge type={user.verificationType || 'none'} size={14} /><span className="text-xs font-bold">{user.username}</span></div>
                        <span className="text-[9px] text-muted-foreground">{user.followerIds?.length || 0} متابع</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold">{user.coins || 0} <TimgadCoin size={14} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select defaultValue={user.verificationType || 'none'} onValueChange={(v) => handleUpdateVerification(user.id, v)}>
                      <SelectTrigger className="h-8 text-[9px]"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="none">عادي</SelectItem><SelectItem value="blue">موثق</SelectItem><SelectItem value="gold">ذهبي</SelectItem></SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      <Input type="number" placeholder="+/-" className="h-8 text-[9px]" value={coinAmount[user.id] || ''} onChange={(e) => setCoinAmount(prev => ({...prev, [user.id]: e.target.value}))} />
                      <Button size="sm" className="h-8 w-8 p-0" onClick={() => handleAdjustCoins(user.id)}><CheckCircle2 size={12} /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="space-y-2">
              {revenue?.map((rev: any) => (
                <div key={rev.id} className="p-3 bg-secondary/20 flex justify-between items-center border-r-4 border-r-accent">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-accent">
                      {rev.type === 'support_fee' ? 'عمولة دعم' : rev.type === 'ad_click_commission' ? 'عمولة إعلان' : rev.type === 'post_ad_share' ? 'رسوم إعلان منشور (50%)' : 'رسوم شحن/إعلان'}
                    </span>
                    <p className="text-[8px] text-muted-foreground">{rev.createdAt?.toDate?.()?.toLocaleString('ar-SA')}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-accent">+{rev.amount.toFixed(2)} <TimgadCoin size={14} /></div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );

  function handleUpdateVerification(userId: string, type: string) {
    if (!firestore || !isAdminUser) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), { verificationType: type });
    toast({ description: "تم تحديث التوثيق." });
  }

  function handleAdjustCoins(userId: string) {
    const amount = parseInt(coinAmount[userId] || '0');
    if (isNaN(amount) || amount === 0) return;
    if (!firestore || !isAdminUser) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), { coins: increment(amount) });
    addDocumentNonBlocking(collection(firestore, 'users', userId, 'notifications'), {
      type: 'system',
      message: amount > 0 ? `🎁 مُنحت ${amount} عملة من الإدارة.` : `⚠️ سُحب ${Math.abs(amount)} عملة من رصيدك.`,
      createdAt: serverTimestamp(),
      read: false
    });
    setCoinAmount(prev => ({ ...prev, [userId]: '' }));
    toast({ description: "تم التحديث." });
  }
}
