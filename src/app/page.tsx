
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { Toaster } from '@/components/ui/toaster';
import { useCollection, useFirebase, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, where, limit, serverTimestamp, increment } from 'firebase/firestore';
import { Loader2, Sparkles, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { AadsUnitInside } from '@/components/ads/AadsUnit';

export default function Home() {
  const { firestore, user, isUserLoading } = useFirebase();
  const [activeTab, setActiveTab] = useState('for-you');
  const router = useRouter();
  const { toast } = useToast();

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

  useEffect(() => {
    if (user && profile && firestore) {
      const now = new Date();
      const lastLogin = profile.lastLoginAt ? new Date(profile.lastLoginAt) : new Date(0);
      const diffMs = now.getTime() - lastLogin.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours >= 24) {
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
          coins: increment(1),
          lastLoginAt: now.toISOString()
        });
        toast({
          title: "🎁 مكافأة الوفاء!",
          description: "لقد حصلت على 1 عملة تيمقاد لتسجيل دخولك اليومي. استمر في الإبداع!"
        });
      }
    }
  }, [user, profile, firestore, toast]);

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

      const hasInteractedBefore = profile?.interactedAuthorIds?.includes(post.authorId);
      if (hasInteractedBefore) score += (25 * 6);

      return { ...post, calculatedScore: score };
    })
    .sort((a, b) => {
      if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
      return b.calculatedScore - a.calculatedScore;
    })
    .slice(0, 50);
  }, [postsPool, profile]);

  const followingPostsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !profile?.followingIds || profile.followingIds.length === 0) return null;
    return query(
      collection(firestore, 'posts'), 
      where('authorId', 'in', profile.followingIds.slice(0, 30)),
      limit(50)
    );
  }, [firestore, user?.uid, profile?.followingIds]);

  const { data: rawFollowingPosts, isLoading: isFollowingLoading } = useCollection(followingPostsQuery);

  const sortedFollowingPosts = useMemo(() => {
    if (!rawFollowingPosts) return [];
    return [...rawFollowingPosts].sort((a, b) => {
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return dateB - dateA;
    });
  }, [rawFollowingPosts]);

  const renderPostsWithAds = (posts: any[]) => {
    const elements = [];
    for (let i = 0; i < posts.length; i++) {
      elements.push(<PostCard key={posts[i].id} post={posts[i]} currentUserProfile={profile} />);
      if ((i + 1) % 5 === 0) {
        elements.push(<AadsUnitInside key={`ad-${i}`} />);
      }
    }
    return elements;
  };

  if (isUserLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="container mx-auto px-0 md:px-4 pt-8 flex flex-col md:flex-row gap-6">
        <div className="hidden md:block w-64 pt-4 h-fit sticky top-8"><LeftSidebar /></div>
        <div className="flex-1 w-full max-w-full md:max-w-xl mx-auto min-h-screen">
          
          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-background/80 backdrop-blur-md border-b-[0.5px] border-muted/20 rounded-none h-10 p-0 sticky top-10 z-40">
              <TabsTrigger value="for-you" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary font-bold text-xs gap-2">
                <Sparkles size={14} /> لك (توصيات ذكية)
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
                    {isFollowingLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div> : (!profile?.followingIds || profile.followingIds.length === 0) ? (
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
        <div className="hidden lg:block w-80 pt-4 h-fit sticky top-8"><RightSidebar /></div>
      </main>
      <Toaster />
    </div>
  );
}
