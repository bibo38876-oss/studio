
"use client"

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, doc, limit, where, serverTimestamp, orderBy, increment } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Search, ShieldCheck, BarChart3, Users, MessageSquare, AlertTriangle, Trash2, CheckCircle2, Coins, History, ArrowUpRight, TrendingUp, LayoutGrid, Plus, Calendar as CalendarIcon, ImageIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

export default function AdminPage() {
  const { firestore, user: currentUser, isUserLoading } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [coinAmount, setCoinAmount] = useState<Record<string, string>>({});

  // لبانرات المستطيلات
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerDays, setBannerDays] = useState('5');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const reportedPostsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'posts'), where('reportsCount', '>', 0), orderBy('reportsCount', 'desc'), limit(50));
  }, [firestore, isAdminUser]);

  const revenueQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'platform_revenue'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore, isAdminUser]);

  const bannersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collection(firestore, 'admin_banners'), orderBy('createdAt', 'desc'));
  }, [firestore, isAdminUser]);

  const { data: users } = useCollection(usersQuery);
  const { data: reportedPosts } = useCollection(reportedPostsQuery);
  const { data: revenue } = useCollection(revenueQuery);
  const { data: banners } = useCollection(bannersQuery);

  const stats = useMemo(() => {
    if (!users || !revenue) return { totalUsers: 0, totalRevenue: 0, totalCoins: 0 };
    const totalRevenue = revenue.reduce((acc, entry) => acc + (entry.amount || 0), 0);
    const totalCoins = users.reduce((acc, u) => acc + (u.coins || 0), 0);
    return {
      totalUsers: users.length,
      totalRevenue,
      totalCoins
    };
  }, [users, revenue]);

  const filteredUsers = users?.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleUpdateVerification = (userId: string, type: string) => {
    if (!firestore || !isAdminUser) return;
    updateDocumentNonBlocking(doc(firestore, 'users', userId), { verificationType: type });
    toast({ description: "تم تحديث التوثيق." });
  };

  const handleAdjustCoins = (userId: string) => {
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
    } catch (e) {
      toast({ variant: "destructive", description: "فشل الرفع." });
    } finally {
      setIsUploading(false);
    }
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
              <p className="text-[10px] text-white/60">Revenue & Banner Control</p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="w-full bg-secondary/30 mb-8 rounded-none p-1 border-b h-12">
            <TabsTrigger value="analytics" className="flex-1 text-[11px] font-bold gap-2">الإحصائيات</TabsTrigger>
            <TabsTrigger value="users" className="flex-1 text-[11px] font-bold gap-2">الأعضاء</TabsTrigger>
            <TabsTrigger value="banners" className="flex-1 text-[11px] font-bold gap-2">المستطيلات</TabsTrigger>
            <TabsTrigger value="moderation" className="flex-1 text-[11px] font-bold gap-2">الرقابة</TabsTrigger>
            <TabsTrigger value="revenue" className="flex-1 text-[11px] font-bold gap-2">الإيرادات</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-primary/5 border-r-4 border-r-primary"><CardHeader className="p-4"><CardTitle className="text-[10px] uppercase">إجمالي المستخدمين</CardTitle></CardHeader><CardContent className="p-4 pt-0 text-2xl font-bold text-primary">{stats.totalUsers}</CardContent></Card>
              <Card className="bg-accent/5 border-r-4 border-r-accent"><CardHeader className="p-4"><CardTitle className="text-[10px] uppercase">أرباح المنصة (العمولات)</CardTitle></CardHeader><CardContent className="p-4 pt-0 flex items-center gap-2 text-2xl font-bold text-accent">{stats.totalRevenue.toFixed(1)} <TimgadCoin size={20} /></CardContent></Card>
              <Card className="bg-yellow-500/5 border-r-4 border-r-yellow-600"><CardHeader className="p-4"><CardTitle className="text-[10px] uppercase">العملات المتداولة</CardTitle></CardHeader><CardContent className="p-4 pt-0 flex items-center gap-2 text-2xl font-bold text-yellow-600">{stats.totalCoins.toFixed(0)} <TimgadCoin size={20} /></CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="banners" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold mb-4">إضافة مستطيل إعلاني جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="عنوان الإعلان" value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="h-10 text-xs" />
                <Input placeholder="رابط الموقع" value={bannerLink} onChange={e => setBannerLink(e.target.value)} className="h-10 text-xs" />
                <div className="flex gap-2">
                  <Select value={bannerDays} onValueChange={setBannerDays}>
                    <SelectTrigger className="h-10 text-xs"><SelectValue placeholder="المدة" /></SelectTrigger>
                    <SelectContent><SelectItem value="4">4 أيام</SelectItem><SelectItem value="5">5 أيام</SelectItem><SelectItem value="10">10 أيام</SelectItem></SelectContent>
                  </Select>
                  <Button variant="outline" className="h-10 text-xs flex-1 gap-2" onClick={() => fileInputRef.current?.click()}>
                    {isUploading ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                    {bannerImage ? "تم اختيار صورة" : "ارفع بانر (أفقي)"}
                  </Button>
                  <input type="file" hidden ref={fileInputRef} onChange={handleBannerUpload} accept="image/*" />
                </div>
                <Button className="h-10 text-xs font-bold" onClick={handleCreateBanner} disabled={!bannerImage}>حفظ ونشر البانر</Button>
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
                        <span className="text-[9px] text-muted-foreground">{user.email}</span>
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

          <TabsContent value="moderation" className="space-y-4">
            {reportedPosts?.map((post: any) => (
              <Card key={post.id} className="p-4 flex justify-between items-center">
                <div className="text-right">
                  <p className="text-xs font-bold text-red-600">{post.reportsCount} بلاغ</p>
                  <p className="text-[10px] line-clamp-1">{post.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'posts', post.id))}><Trash2 size={12} /></Button>
                  <Button size="sm" variant="outline" onClick={() => updateDocumentNonBlocking(doc(firestore!, 'posts', post.id), { reportsCount: 0 })}><CheckCircle2 size={12} /></Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="space-y-2">
              {revenue?.map((rev: any) => (
                <div key={rev.id} className="p-3 bg-secondary/20 flex justify-between items-center border-r-4 border-r-accent">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-accent">{rev.type === 'support_fee' ? 'عمولة دعم' : rev.type === 'ad_click_commission' ? 'عمولة إعلان' : 'رسوم ترويج'}</span>
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
}
