
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { Toaster } from '@/components/ui/toaster';
import { useCollection, useFirebase, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, where, limit, increment } from 'firebase/firestore';
import { Loader2, Sparkles, Users, AlertCircle, ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function Home() {
  const { firestore, user, isUserLoading } = useFirebase();
  const [activeTab, setActiveTab] = useState('for-you');
  const [limitForYou, setLimitForYou] = useState(10);
  const [limitFollowing, setLimitFollowing] = useState(10);
  const [isJarBreakingSoon, setIsJarBreakingSoon] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const loadMoreForYouRef = useRef<HTMLDivElement>(null);
  const loadMoreFollowingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // مراقبة وقت انكسار الجرة للحدث المباشر (19:55 - 20:00 بتوقيت الجزائر)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const dzNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3600000));
      const hours = dzNow.getHours();
      const minutes = dzNow.getMinutes();
      
      if (hours === 19 && minutes >= 55) {
        setIsJarBreakingSoon(true);
      } else {
        setIsJarBreakingSoon(false);
      }
    };

    const interval = setInterval(checkTime, 30000); // تحقق كل 30 ثانية
    checkTime();
    return () => clearInterval(interval);
  }, []);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile } = useDoc(userProfileRef);

  // نظام مكافأة الدخول اليومي (1 عملة كل 24 ساعة)
  useEffect(() => {
    if (!firestore || !user?.uid || !profile) return;

    const now = new Date();
    const lastLoginStr = profile.lastLoginAt;
    const lastLoginDate = lastLoginStr ? new Date(lastLoginStr) : new Date(0);
    const timeDiff = now.getTime() - lastLoginDate.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (timeDiff >= twentyFourHours) {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        coins: increment(1),
        lastLoginAt: now.toISOString()
      });
      
      toast({
        title: "مكافأة 24 ساعة!",
        description: "لقد حصلت على عملة تيمقاد لولائك المستمر. عد غداً للمزيد!",
      });
    }
  }, [firestore, user?.uid, profile, toast]);

  // استعلام التغذية العامة
  const feedPoolQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'), limit(limitForYou));
  }, [firestore, user?.uid, limitForYou]);

  const { data: postsPool, isLoading: isPoolLoading } = useCollection(feedPoolQuery);

  // نظام الإعلانات
  const promotedQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'posts'),
      where('promoted', '==', true),
      where('impressions_left', '>', 0),
      limit(5)
    );
  }, [firestore, user?.uid]);

  const { data: promotedPosts } = useCollection(promotedQuery);

  // استعلام المتابعين
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

  // خوارزمية دمج الإعلانات مع المحتوى الموصى به
  const recommendedPosts = useMemo(() => {
    if (!postsPool || !profile) return [];

    const basePosts = [...postsPool].map(post => {
      let score = 0;
      score += (post.likesCount || 0) * 3;
      score += (post.commentsCount || 0) * 5;
      score += (post.viewsCount || 0) * 0.1;
      if (profile.followingIds?.includes(post.authorId)) score += 50;
      
      const postDate = post.createdAt?.toDate ? post.createdAt.toDate() : (post.createdAt ? new Date(post.createdAt) : new Date());
      const postAgeMs = Date.now() - postDate.getTime();
      const oneHour = 3600000;
      if (postAgeMs < oneHour) score += 40;

      return { ...post, recommendationScore: score };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);

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
      
      <main className="container mx-auto px-0 md:px-4 pt-8 flex flex-col md:flex-row gap-6">
        <div className="hidden md:block w-64 pt-4 h-fit sticky top-8">
          <LeftSidebar />
        </div>

        <div className="flex-1 w-full max-w-full md:max-w-xl mx-auto">
          {/* شريط حدث انكسار الجرة المباشر */}
          <AnimatePresence>
            {isJarBreakingSoon && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Link href="/vault">
                  <div className="bg-gradient-to-r from-primary to-accent p-3 flex items-center justify-between text-white relative overflow-hidden group">
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-white/10"
                    />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-lg">🏺</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider">حدث ذروة تيمقاد</span>
                        <p className="text-[10px] font-medium opacity-90">جرة تيمقاد الأثرية على وشك الانكسار! انضم الآن قبل 20:00.</p>
                      </div>
                    </div>
                    <ChevronLeft size={18} className="relative z-10 group-hover:translate-x-[-4px] transition-transform" />
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

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
