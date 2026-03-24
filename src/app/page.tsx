
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { Toaster } from '@/components/ui/toaster';
import { useCollection, useFirebase, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, increment, limit } from 'firebase/firestore';
import { Loader2, Sparkles, Users, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { HighPerformanceAd } from '@/components/ads/AadsUnit';
import { useToast } from '@/hooks/use-toast';

function HomeContent() {
  const { firestore, user, isUserLoading } = useFirebase();
  const [activeTab, setActiveTab] = useState('for-you');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) router.push('/login');
  }, [user, isUserLoading, router]);

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user?.uid) ? doc(firestore, 'users', user.uid) : null, 
  [firestore, user?.uid]);
  const { data: profile } = useDoc(userProfileRef);

  useEffect(() => {
    if (!mounted) return;

    if (searchParams.get('show_ad_warning') === 'true') {
      toast({
        title: "تنبيه بخصوص الإعلانات",
        description: "بعض الإعلانات في المنصة قد تظهر بشكل غير لائق تأتي من المصدر ونعمل على فرزها قدر المستطاع.",
        duration: 8000,
      });
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (user && profile && firestore) {
      const now = Date.now();
      const lastRewardTime = profile.lastPassiveRewardAt 
        ? new Date(profile.lastPassiveRewardAt).getTime() 
        : profile.createdAt ? new Date(profile.createdAt).getTime() : now;
      
      const elapsedHours = Math.floor((now - lastRewardTime) / 3600000);

      if (elapsedHours >= 1) {
        const reward = elapsedHours * 0.02;
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
          coins: increment(reward),
          lastPassiveRewardAt: new Date(now).toISOString()
        });
        toast({ title: "دخل إعلانات سلبي 💰", description: `حصلت على ${reward.toFixed(3)} عملة مقابل نشاطك.` });
      }
    }
  }, [mounted, searchParams, user, profile, firestore, toast]);

  const feedPoolQuery = useMemoFirebase(() => 
    (firestore && user?.uid) ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'), limit(100)) : null, 
  [firestore, user?.uid]);
  const { data: postsPool, isLoading: isPoolLoading } = useCollection(feedPoolQuery);

  const recommendedPosts = useMemo(() => {
    if (!postsPool) return [];
    return [...postsPool].map(post => {
      let score = (post.likesCount || 0) * 3 + (post.commentsCount || 0) * 5;
      if (profile?.followingIds?.includes(post.authorId)) score += 80;
      
      const hours = (Date.now() - (post.createdAt?.toMillis?.() || Date.now())) / 3600000;
      score += hours < 1 ? 60 : hours < 24 ? 30 : 10;
      
      // تطبيق عامل التعزيز (Boost Factor)
      const boost = post.boostFactor || 1.0;
      score *= boost;

      return { ...post, calculatedScore: score };
    }).sort((a, b) => {
      // المنشورات الممولة (Ads) تأتي أولاً إذا كانت نشطة، ثم الترتيب حسب النقاط
      if (a.isAdPost !== b.isAdPost) return a.isAdPost ? -1 : 1;
      return b.calculatedScore - a.calculatedScore;
    }).slice(0, 50);
  }, [postsPool, profile]);

  const followingPosts = useMemo(() => 
    postsPool?.filter(p => profile?.followingIds?.includes(p.authorId)) || [], 
  [postsPool, profile]);

  const renderList = (posts: any[]) => (
    <div className="space-y-[1px]">
      {posts.map((post, idx) => (
        <div key={post.id}>
          <PostCard post={post} currentUserProfile={profile} />
          {(idx + 1) % 5 === 0 && <HighPerformanceAd />}
        </div>
      ))}
    </div>
  );

  if (!mounted || isUserLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-0 md:px-4 pt-12 flex flex-col md:flex-row gap-6">
        <div className="hidden md:block w-64 pt-4 h-fit sticky top-12"><LeftSidebar /></div>
        <div className="flex-1 w-full max-w-xl mx-auto min-h-screen">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-background/80 backdrop-blur-md border-b sticky top-10 z-40 rounded-none h-10 p-0">
              <TabsTrigger value="for-you" className="flex-1 h-full font-bold text-xs gap-2"><Sparkles size={14} /> لك</TabsTrigger>
              <TabsTrigger value="following" className="flex-1 h-full font-bold text-xs gap-2"><Users size={14} /> أتابعهم</TabsTrigger>
            </TabsList>
            <AnimatePresence mode="wait">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                {isPoolLoading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : (
                  <TabsContent value="for-you" className="m-0">{renderList(recommendedPosts)}</TabsContent>
                )}
                <TabsContent value="following" className="m-0">
                  {followingPosts.length > 0 ? renderList(followingPosts) : <div className="py-24 text-center text-xs font-bold text-muted-foreground">لم تتابع أحداً بعد!</div>}
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>
        <div className="hidden lg:block w-80 pt-4 h-fit sticky top-12"><RightSidebar /></div>
      </main>
      <Toaster />
    </div>
  );
}

export default function Home() {
  return <Suspense fallback={null}><HomeContent /></Suspense>;
}
