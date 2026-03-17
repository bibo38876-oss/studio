
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
import { Loader2, Sparkles, Users, ChevronLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

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

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const dzNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (3600000));
      const hours = dzNow.getHours();
      const minutes = dzNow.getMinutes();
      if (hours === 19 && minutes >= 55) setIsJarBreakingSoon(true);
      else setIsJarBreakingSoon(false);
    };
    const interval = setInterval(checkTime, 30000);
    checkTime();
    return () => clearInterval(interval);
  }, []);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (!firestore || !user?.uid || !profile) return;
    const now = new Date();
    const lastLoginStr = profile.lastLoginAt;
    const lastLoginDate = lastLoginStr ? new Date(lastLoginStr) : new Date(0);
    const timeDiff = now.getTime() - lastLoginDate.getTime();
    if (timeDiff >= 86400000) {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        coins: increment(1),
        lastLoginAt: now.toISOString()
      });
      toast({ title: "مكافأة 24 ساعة!", description: "لقد حصلت على عملة تيمقاد لولائك المستمر." });
    }
  }, [firestore, user?.uid, profile, toast]);

  const feedPoolQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'), limit(limitForYou));
  }, [firestore, user?.uid, limitForYou]);

  const { data: postsPool, isLoading: isPoolLoading } = useCollection(feedPoolQuery);

  const promotedQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'posts'), where('promoted', '==', true), where('impressions_left', '>', 0), limit(5));
  }, [firestore, user?.uid]);

  const { data: promotedPosts } = useCollection(promotedQuery);

  const followingPostsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !profile?.followingIds || profile.followingIds.length === 0) return null;
    return query(collection(firestore, 'posts'), where('authorId', 'in', profile.followingIds.slice(0, 30)), limit(100));
  }, [firestore, user?.uid, profile?.followingIds]);

  const { data: rawFollowingPosts, isLoading: isFollowingLoading } = useCollection(followingPostsQuery);

  const sortedFollowingPosts = useMemo(() => {
    if (!rawFollowingPosts) return [];
    return [...rawFollowingPosts].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return dateB - dateA;
    }).slice(0, limitFollowing);
  }, [rawFollowingPosts, limitFollowing]);

  const recommendedPosts = useMemo(() => {
    if (!postsPool) return [];
    const basePosts = [...postsPool].map(post => {
      let score = 0;
      score += (post.likesCount || 0) * 3;
      score += (post.commentsCount || 0) * 5;
      score += (post.viewsCount || 0) * 0.1;
      if (profile?.followingIds?.includes(post.authorId)) score += 50;
      return { ...post, recommendationScore: score };
    }).sort((a, b) => b.recommendationScore - a.recommendationScore);
    return basePosts;
  }, [postsPool, profile]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (activeTab === 'for-you' && !isPoolLoading) setLimitForYou(p => p + 10);
        else if (activeTab === 'following' && !isFollowingLoading) setLimitFollowing(p => p + 10);
      }
    }, { threshold: 0.1 });
    const currentRef = activeTab === 'for-you' ? loadMoreForYouRef.current : loadMoreFollowingRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => observer.disconnect();
  }, [activeTab, isPoolLoading, isFollowingLoading]);

  if (isUserLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-0 md:px-4 pt-8 flex flex-col md:flex-row gap-6">
        <div className="hidden md:block w-64 pt-4 h-fit sticky top-8"><LeftSidebar /></div>
        <div className="flex-1 w-full max-w-full md:max-w-xl mx-auto min-h-screen">
          <AnimatePresence>
            {isJarBreakingSoon && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div onClick={() => toast({ title: "قريباً جداً! 🏺", description: "ميزة جرة تيمقاد في مراحل التطوير الأخيرة." })} className="cursor-pointer bg-gradient-to-r from-primary to-accent p-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏺</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">حدث ذروة تيمقاد</span>
                      <p className="text-[10px]">الجرة الأثرية على وشك الانكسار!</p>
                    </div>
                  </div>
                  <ChevronLeft size={18} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-background/80 backdrop-blur-md border-b-[0.5px] border-muted/20 rounded-none h-10 p-0 sticky top-8 z-40">
              <TabsTrigger value="for-you" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold text-xs gap-2">
                <Sparkles size={14} /> لك
              </TabsTrigger>
              <TabsTrigger value="following" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold text-xs gap-2">
                <Users size={14} /> أتابعهم
              </TabsTrigger>
            </TabsList>

            <div className="relative min-h-[60vh]">
              <AnimatePresence mode="wait">
                {activeTab === 'for-you' ? (
                  <motion.div key="for-you" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    {isPoolLoading && limitForYou === 10 ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div> : (
                      <>
                        {recommendedPosts.map((post: any) => <PostCard key={post.id} post={post} currentUserProfile={profile} />)}
                        <div ref={loadMoreForYouRef} className="py-10 flex justify-center">{isPoolLoading && <Loader2 className="animate-spin text-primary/50" />}</div>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="following" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                    {isProfileLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div> : (!profile?.followingIds || profile.followingIds.length === 0) ? (
                      <div className="text-center py-24 px-8"><Users size={40} className="mx-auto text-muted-foreground/30 mb-4" /><p className="text-primary font-bold text-xs">ابدأ بمتابعة الآخرين</p></div>
                    ) : (
                      <>
                        {sortedFollowingPosts.map((post: any) => <PostCard key={post.id} post={post} currentUserProfile={profile} />)}
                        <div ref={loadMoreFollowingRef} className="py-10 flex justify-center">{isFollowingLoading && <Loader2 className="animate-spin text-primary/50" />}</div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
        <div className="hidden lg:block w-80 pt-4 h-fit sticky top-8"><RightSidebar /></div>
      </main>
      <Toaster />
    </div>
  );
}
