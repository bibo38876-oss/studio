
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { Toaster } from '@/components/ui/toaster';
import { useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, where, limit } from 'firebase/firestore';
import { Loader2, Sparkles, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { firestore, user, isUserLoading } = useFirebase();
  const [activeTab, setActiveTab] = useState('for-you');
  const [limitForYou, setLimitForYou] = useState(10);
  const [limitFollowing, setLimitFollowing] = useState(10);
  const router = useRouter();

  const loadMoreForYouRef = useRef<HTMLDivElement>(null);
  const loadMoreFollowingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userProfileRef);

  const feedPoolQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'), limit(limitForYou));
  }, [firestore, user?.uid, limitForYou]);

  const { data: postsPool, isLoading: isPoolLoading } = useCollection(feedPoolQuery);

  // جلب المنشورات المروجة (Ads) - تتطلب تسجيل الدخول لتفادي خطأ الصلاحيات
  const promotedQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'posts'),
      where('promoted', '==', true),
      where('impressions_left', '>', 0),
      limit(10)
    );
  }, [firestore, user?.uid]);

  const { data: promotedPosts } = useCollection(promotedQuery);

  const followingPostsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !profile?.followingIds || profile.followingIds.length === 0) return null;
    return query(
      collection(firestore, 'posts'), 
      where('authorId', 'in', profile.followingIds.slice(0, 10)),
      orderBy('createdAt', 'desc'),
      limit(limitFollowing)
    );
  }, [firestore, user?.uid, profile?.followingIds, limitFollowing]);

  const { data: followingPosts, isLoading: isFollowingLoading } = useCollection(followingPostsQuery);

  // خوارزمية التوصيات المتقدمة + دمج الإعلانات
  const recommendedPosts = useMemo(() => {
    if (!postsPool || !profile) return [];

    const basePosts = [...postsPool].map(post => {
      let score = 0;
      score += (post.likesCount || 0) * 3;
      score += (post.commentsCount || 0) * 5;
      score += (post.viewsCount || 0) * 0.1;
      if (profile.followingIds?.includes(post.authorId)) score += 50;
      if (profile.interactedAuthorIds?.includes(post.authorId)) score += 30;

      const postDate = post.createdAt?.toDate ? post.createdAt.toDate() : (post.createdAt ? new Date(post.createdAt) : new Date());
      const postAgeMs = Date.now() - postDate.getTime();
      const oneHour = 3600000;
      const oneDay = 86400000;

      if (postAgeMs < oneHour) score += 40;
      else if (postAgeMs < oneDay) score += 20;
      else score -= 10;

      return { ...post, recommendationScore: score };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);

    // دمج الإعلانات: منشور مروج كل 5 منشورات
    const finalFeed: any[] = [];
    let adIdx = 0;
    const ads = promotedPosts?.filter(ad => !basePosts.some(p => p.id === ad.id)) || [];

    basePosts.forEach((post, i) => {
      finalFeed.push(post);
      if ((i + 1) % 5 === 0 && ads[adIdx]) {
        finalFeed.push(ads[adIdx]);
        adIdx++;
      }
    });

    return finalFeed;
  }, [postsPool, profile, promotedPosts]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (activeTab === 'for-you' && !isPoolLoading) {
            setLimitForYou(prev => prev + 10);
          } else if (activeTab === 'following' && !isFollowingLoading) {
            setLimitFollowing(prev => prev + 10);
          }
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = activeTab === 'for-you' ? loadMoreForYouRef.current : loadMoreFollowingRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => observer.disconnect();
  }, [activeTab, isPoolLoading, isFollowingLoading]);

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="container mx-auto px-0 md:px-4 pt-8 flex gap-6">
        <div className="hidden md:block w-64 pt-4 h-fit sticky top-8">
          <LeftSidebar />
        </div>

        <div className="flex-1 w-full max-w-full md:max-w-xl mx-auto">
          <Tabs defaultValue="for-you" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-background/80 backdrop-blur-md border-b-[0.5px] border-muted/20 rounded-none h-10 p-0 sticky top-8 z-40">
              <TabsTrigger 
                value="for-you" 
                className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none font-bold text-xs gap-2"
              >
                <Sparkles size={14} className={activeTab === 'for-you' ? 'text-primary' : ''} />
                لك
              </TabsTrigger>
              <TabsTrigger 
                value="following" 
                className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none font-bold text-xs gap-2"
              >
                <Users size={14} className={activeTab === 'following' ? 'text-primary' : ''} />
                أتابعهم
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="for-you" key="for-you" className="mt-0">
                {isPoolLoading && limitForYou === 10 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-[10px] text-muted-foreground animate-pulse font-bold">جاري تحضير التوصيات...</p>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="flex flex-col"
                  >
                    {recommendedPosts.map((post: any) => <PostCard key={post.id} post={post} />)}
                    
                    <div ref={loadMoreForYouRef} className="py-10 flex justify-center">
                      {isPoolLoading && <Loader2 className="h-5 w-5 animate-spin text-primary/50" />}
                    </div>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="following" key="following" className="mt-0">
                {!profile?.followingIds || profile.followingIds.length === 0 ? (
                  <div className="text-center py-24 bg-card px-8 border-b">
                    <Users size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-primary font-bold text-xs mb-1">ابدأ بمتابعة الآخرين</p>
                    <p className="text-muted-foreground text-[10px]">ستظهر منشورات من تتابعهم هنا.</p>
                  </div>
                ) : isFollowingLoading && limitFollowing === 10 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="flex flex-col"
                  >
                    {followingPosts?.map((post: any) => <PostCard key={post.id} post={post} />)}
                    
                    <div ref={loadMoreFollowingRef} className="py-10 flex justify-center">
                      {isFollowingLoading && <Loader2 className="h-5 w-5 animate-spin text-primary/50" />}
                    </div>
                  </motion.div>
                )}
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>

        <div className="hidden lg:block w-80 pt-4 h-fit sticky top-8">
          <RightSidebar />
        </div>
      </main>

      <Toaster />
    </div>
  );
}
