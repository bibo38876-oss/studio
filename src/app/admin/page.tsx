
"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, doc, limit, where, serverTimestamp, orderBy, increment, getDocs, getDoc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, ShieldCheck, BarChart3, Users, MessageSquare, AlertTriangle, Trash2, CheckCircle2, Coins, History, ArrowUpRight, TrendingUp, LayoutGrid, Plus, Calendar as CalendarIcon, ImageIcon, Megaphone, ArrowDownToLine, Wallet, Flag, Gift, Sparkles } from 'lucide-react';
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
  const [isDistributing, setIsDistributing] = useState(false);

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

  const handleDailyDistribution = async () => {
    if (!firestore || !isAdminUser) return;
    
    setIsDistributing(true);
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      const allUsers = usersSnap.docs;
      const count = allUsers.length;

      if (count === 0) {
        toast({ variant: "destructive", description: "لا يوجد مستخدمون للتوزيع عليهم." });
        return;
      }

      const totalBudget = 5;
      const sharePerUser = totalBudget / count;

      allUsers.forEach(userDoc => {
        const userId = userDoc.id;
        updateDocumentNonBlocking(doc(firestore, 'users', userId), {
          coins: increment(sharePerUser)
        });

        addDocumentNonBlocking(collection(firestore, 'users', userId, 'notifications'), {
          type: 'system',
          message: `🎁 لقد حصلت على نصيبك من عوائد مشاهدة الإعلانات لليوم (${sharePerUser.toFixed(3)} عملة). شكراً لتفاعلك في تيمقاد!`,
          createdAt: serverTimestamp(),
          read: false
        });
      });

      toast({ title: "تم التوزيع بنجاح! 🚀" });
    } catch (e) {
      toast({ variant: "destructive", description: "فشل توزيع العوائد." });
    } finally {
      setIsDistributing(false);
    }
  };

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
          message: `🎉 مبروك! منشورك حقق شروط الربح وتم وضع إعلان عليه، حصلت على ${rewardAmount} عملة.`,
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
      }

      setPostAdId(''); setPostAdIdTitle(''); setPostAdIdImage(null);
      toast({ description: "تم نشر الإعلان." });
    } catch (e) {
      toast({ variant: "destructive", description: "فشل الإنشاء." });
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
    toast({ description: "تم إتمام التحويل." });
  };

  if (isUserLoading || !isAdminUser) return null;

  return (
    <div className="min-h-screen bg-background text-right">
      <Navbar />
      <main className="container mx-auto pt-10 pb-20 px-4 max-w-full">
        <header className="flex flex-col gap-4 mb-8 bg-primary p-5 shadow-xl">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-white" />
            <div className="text-right">
              <h1 className="text-lg font-bold text-white uppercase leading-none">مركز القيادة</h1>
              <p className="text-[8px] text-white/60">تحكم تيمقاد السيادي</p>
            </div>
          </div>
          
          <Button 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-primary font-bold gap-2 rounded-full h-10 px-6 shadow-lg animate-pulse text-[10px]"
            onClick={handleDailyDistribution}
            disabled={isDistributing}
          >
            {isDistributing ? <Loader2 className="animate-spin" /> : <Gift size={16} />}
            توزيع الـ 5 عملات (يومي)
          </Button>
        </header>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="w-full bg-secondary/30 mb-6 rounded-none p-1 border-b h-11 overflow-x-auto no-scrollbar flex flex-nowrap shrink-0">
            <TabsTrigger value="analytics" className="px-4 text-[10px] font-bold shrink-0">الإحصائيات</TabsTrigger>
            <TabsTrigger value="withdrawals" className="px-4 text-[10px] font-bold text-accent shrink-0">السحب</TabsTrigger>
            <TabsTrigger value="moderation" className="px-4 text-[10px] font-bold text-destructive shrink-0">الرقابة</TabsTrigger>
            <TabsTrigger value="post_ads" className="px-4 text-[10px] font-bold shrink-0">إعلانات</TabsTrigger>
            <TabsTrigger value="users" className="px-4 text-[10px] font-bold shrink-0">الأعضاء</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Card className="bg-primary/5 border-r-4 border-r-primary p-4 flex justify-between items-center">
                <span className="text-[9px] font-bold text-primary">المستخدمين</span>
                <span className="text-xl font-bold">{stats.totalUsers}</span>
              </Card>
              <Card className="bg-accent/5 border-r-4 border-r-accent p-4 flex justify-between items-center">
                <span className="text-[9px] font-bold text-accent">أرباح (TRX)</span>
                <span className="text-xl font-bold">{(stats.totalRevenue / 100).toFixed(2)}</span>
              </Card>
              <Card className="bg-yellow-500/5 border-r-4 border-r-yellow-600 p-4 flex justify-between items-center">
                <span className="text-[9px] font-bold text-yellow-600">المتداول</span>
                <div className="flex items-center gap-1 font-bold text-xl">{stats.totalCoins.toFixed(1)} <TimgadCoin size={16} /></div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-4">
            <h3 className="text-xs font-bold text-destructive flex items-center gap-2 mb-2"><Flag size={14} /> محتوى مبلّغ عنه</h3>
            <div className="grid gap-3">
              {reportedPosts?.map((post: any) => (
                <Card key={post.id} className="p-3 border-r-2 border-r-destructive">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6"><AvatarImage src={post.authorAvatar} /></Avatar>
                      <span className="text-[10px] font-bold">{post.authorName}</span>
                      <span className="text-[8px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{post.reportsCount} بلاغ</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{post.content}</p>
                    <Button variant="destructive" size="sm" className="w-full h-7 text-[9px] font-bold" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'posts', post.id))}>حذف المنشور</Button>
                  </div>
                </Card>
              ))}
              {(!reportedPosts || reportedPosts.length === 0) && <div className="text-center py-10 opacity-40 text-[10px]">لا يوجد بلاغات.</div>}
            </div>
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            <h3 className="text-xs font-bold text-accent flex items-center gap-2 mb-2"><ArrowDownToLine size={14} /> طلبات السحب المعلقة</h3>
            <div className="grid gap-3">
              {withdrawals?.map((req: any) => (
                <Card key={req.id} className={cn("p-3 border-r-4", req.status === 'completed' ? "border-r-green-500 opacity-60" : "border-r-accent")}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-right">
                        <span className="text-[10px] font-bold block">{req.username}</span>
                        <span className="text-[8px] text-muted-foreground">{req.email}</span>
                      </div>
                      <span className="text-[10px] font-bold text-accent">{req.finalTRX?.toFixed(2)} TRX</span>
                    </div>
                    <div className="bg-secondary/50 p-2 rounded text-center">
                      <code className="text-[9px] font-mono break-all block">{req.address}</code>
                    </div>
                    <div className="flex gap-2">
                      {req.status !== 'completed' ? (
                        <>
                          <Button size="sm" className="flex-1 h-8 text-[9px] font-bold bg-green-600" onClick={() => handleCompleteWithdrawal(req.id)}>إتمام</Button>
                          <Button size="sm" variant="ghost" className="h-8 text-[9px] text-destructive" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'withdrawal_requests', req.id))}>حذف</Button>
                        </>
                      ) : (
                        <span className="w-full text-[9px] font-bold text-green-600 text-center flex items-center justify-center gap-1"><CheckCircle2 size={10} /> تم التحويل</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="post_ads" className="space-y-4">
            <Card className="p-4">
              <h3 className="text-xs font-bold mb-3 flex items-center gap-2"><Megaphone size={14} /> إعلان منشور (3 أيام)</h3>
              <div className="grid gap-3">
                <Input placeholder="Post ID" value={postAdId} onChange={e => setPostAdId(e.target.value)} className="h-9 text-[10px]" />
                <Input placeholder="عنوان الإعلان" value={postAdTitle} onChange={e => setPostAdIdTitle(e.target.value)} className="h-9 text-[10px]" />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-9 text-[9px] gap-2" onClick={() => postAdFileRef.current?.click()}>
                    {isUploading ? <Loader2 className="animate-spin" size={12} /> : <ImageIcon size={12} />}
                    {postAdImage ? "تم الرفع" : "رفع الصورة"}
                  </Button>
                  <input type="file" hidden ref={postAdFileRef} onChange={handlePostAdUpload} accept="image/*" />
                  <Button className="flex-1 h-9 text-[9px] font-bold" onClick={handleCreatePostAd} disabled={!postAdImage || isUploading}>نشر</Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Input placeholder="بحث..." className="bg-secondary/30 h-9 text-[10px]" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="grid gap-3">
              {filteredUsers.map(user => (
                <Card key={user.id} className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8"><AvatarImage src={user.profilePictureUrl} /><AvatarFallback>{user.username?.[0]}</AvatarFallback></Avatar>
                      <div className="text-right">
                        <div className="flex items-center gap-1"><VerifiedBadge type={user.verificationType || 'none'} size={12} /><span className="text-[10px] font-bold">{user.username}</span></div>
                        <span className="text-[8px] text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold">{user.coins?.toFixed(1)} <TimgadCoin size={12} /></div>
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
        </Tabs>
      </main>
    </div>
  );

  function handleUpdateVerification(userId: string, type: string) {
    if (!firestore || !isAdminUser) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), { verificationType: type });
    toast({ description: "تم التحديث." });
  }

  function handleAdjustCoins(userId: string) {
    const amount = parseFloat(coinAmount[userId] || '0');
    if (isNaN(amount) || amount === 0) return;
    if (!firestore || !isAdminUser) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), { coins: increment(amount) });
    setCoinAmount(prev => ({ ...prev, [userId]: '' }));
    toast({ description: "تم التعديل." });
  }
}
