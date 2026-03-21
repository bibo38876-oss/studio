
'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { Toaster } from '@/components/ui/toaster';
import { useCollection, useFirebase, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, where, limit, increment } from 'firebase/firestore';
import { Loader2, Sparkles, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { AadsUnitBanner } from '@/components/ads/AadsUnit';
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
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, mounted]);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userProfileRef);

  useEffect(() => {
    if (mounted && searchParams.get('show_ad_warning') === 'true') {
      toast({
        title: "تنبيه بخصوص الإعلانات",
        description: "بعض الإعلانات في المنصة قد تظهر بشكل غير لائق تأتي من المصدر و نعمل على فرزها قدر المستطاع لحماية مجتمع تيمقاد.",
        duration: 8000,
      });
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    // نظام الدخل الساعي المجاني (0.02 كل ساعة)
    if (mounted && user && profile) {
      const now = Date.now();
      const lastRewardTime = profile.lastPassiveRewardAt 
        ? new Date(profile.lastPassiveRewardAt).getTime() 
        : profile.createdAt 
          ? new Date(profile.createdAt).getTime() 
          : now;
      
      const elapsedMs = now - lastRewardTime;
      const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));

      if (elapsedHours >= 1) {
        const reward = elapsedHours * 0.02;
        updateDocumentNonBlocking(doc(firestore!, 'users', user.uid), {
          coins: increment(reward),
          lastPassiveRewardAt: new Date(now).toISOString()
        });
        
        toast({
          title: "دخل إعلانات سلبي 💰",
          description: `لقد حصلت على ${reward.toFixed(3)} عملة تيمقاد مقابل نشاطك الساعي.`,
        });
      }
    }
  }, [mounted, searchParams, toast, user, profile, firestore]);

  const feedPoolQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'), limit(150));
  }, [firestore, user?.uid]);

  const { data: postsPool, isLoading: isPoolLoading } = useCollection(feedPoolQuery);

  const recommendedPosts = useMemo(() => {
    if (!postsPool) return [];
    
    return [...postsPool].map(post => {
      let score = 0;
      const now = Date.now();
      const createdAt = post.createdAt?.toMillis ? post.createdAt.toMillis() : now;
      const diffHours = (now - createdAt) / (1000 * 60 * 60);

      score += (post.likesCount || 0) * 3;
      score += (post.commentsCount || 0) * 5;

      const isFollowing = profile?.followingIds?.includes(post.authorId);
      if (isFollowing) score += (20 * 4);

      let recencyBase = 5; 
      if (diffHours < 1) recencyBase = 30;
      else if (diffHours < 24) recencyBase = 15;
      score += (recencyBase * 2);

      return { ...post, calculatedScore: score };
    })
    .sort((a, b) => {
      if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
      return b.calculatedScore - a.calculatedScore;
    })
    .slice(0, 50);
  }, [postsPool, profile]);

  const sortedFollowingPosts = useMemo(() => {
    if (!postsPool || !profile?.followingIds) return [];
    return postsPool.filter(p => profile.followingIds.includes(p.authorId));
  }, [postsPool, profile]);

  const renderPostsWithAds = (posts: any[]) => {
    const elements = [];
    for (let i = 0; i < posts.length; i++) {
      elements.push(<PostCard key={posts[i].id} post={posts[i]} currentUserProfile={profile} />);
      // إعلان بانر نظيف كل 5 منشورات
      if ((i + 1) % 5 === 0) {
        elements.push(<AadsUnitBanner key={`ad-${i}`} />);
      }
    }
    return elements;
  };

  if (!mounted || isUserLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-0 md:px-4 pt-12 flex flex-col md:flex-row gap-6">
        <div className="hidden md:block w-64 pt-4 h-fit sticky top-12"><LeftSidebar /></div>
        <div className="flex-1 w-full max-w-full md:max-w-xl mx-auto min-h-screen">
          
          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-background/80 backdrop-blur-md border-b-[0.5px] border-muted/20 rounded-none h-10 p-0 sticky top-10 z-40">
              <TabsTrigger value="for-you" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold text-xs gap-2">
                <Sparkles size={14} /> لك
              </TabsTrigger>
              <TabsTrigger value="following" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold text-xs gap-2">
                <Users size={14} /> أتابعهم
              </TabsTrigger>
            </TabsList>

            <div className="relative min-h-[70vh]">
              <AnimatePresence mode="wait">
                {activeTab === 'for-you' ? (
                  <motion.div key="for-you" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {isPoolLoading && recommendedPosts.length === 0 ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div> : (
                      renderPostsWithAds(recommendedPosts)
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="following" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {(!profile?.followingIds || profile.followingIds.length === 0) ? (
                      <div className="text-center py-24 px-8">
                        <Users size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-primary font-bold text-xs">لم تتابع أحداً بعد!</p>
                      </div>
                    ) : (
                      renderPostsWithAds(sortedFollowingPosts)
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
        <div className="hidden lg:block w-80 pt-4 h-fit sticky top-12"><RightSidebar /></div>
      </main>
      <Toaster />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <HomeContent />
    </Suspense>
  );
}
