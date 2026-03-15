'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { Toaster } from '@/components/ui/toaster';
import { useCollection, useFirebase, useMemoFirebase, initiateAnonymousSignIn, setDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import { Loader2, Sparkles, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ARABIC_NAMES = ['خالد الجبر', 'نورة السبيعي', 'فهد الشمري', 'ريم القحطاني', 'صالح الحربي', 'منى الشهري'];

export default function Home() {
  const { firestore, auth, user, isUserLoading } = useFirebase();
  const [activeTab, setActiveTab] = useState('all');

  // Auto sign-in anonymously
  useEffect(() => {
    if (auth && !user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isUserLoading]);

  // Create profile for new anonymous user
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (user && !isProfileLoading && !profile && firestore) {
      const randomName = ARABIC_NAMES[Math.floor(Math.random() * ARABIC_NAMES.length)];
      const randomSeed = Math.floor(Math.random() * 1000);
      setDocumentNonBlocking(doc(firestore, 'users', user.uid), {
        id: user.uid,
        username: randomName,
        profilePictureUrl: `https://picsum.photos/seed/${randomSeed}/200/200`,
        createdAt: new Date().toISOString(),
        bio: 'عضو جديد في تواصل',
        followingIds: [],
        followerIds: []
      }, { merge: true });
    }
  }, [user, profile, isProfileLoading, firestore]);

  // Query for all posts - Ensure firestore is available
  const allPostsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  // Query for posts from followed users
  const followingPostsQuery = useMemoFirebase(() => {
    if (!firestore || !profile?.followingIds || profile.followingIds.length === 0) return null;
    return query(
      collection(firestore, 'posts'), 
      where('authorId', 'in', profile.followingIds.slice(0, 10)),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, profile?.followingIds]);

  const { data: allPosts, isLoading: isAllLoading } = useCollection(allPostsQuery);
  const { data: followingPosts, isLoading: isFollowingLoading } = useCollection(followingPostsQuery);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="container mx-auto px-0 md:px-4 pt-10 flex gap-6">
        {/* Left column */}
        <div className="hidden md:block w-64 pt-2 h-fit sticky top-10">
          <LeftSidebar />
        </div>

        {/* Middle column - Feed */}
        <div className="flex-1 w-full max-w-full md:max-w-xl mx-auto">
          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-background border-b border-muted rounded-none h-10 p-0 sticky top-8 z-40">
              <TabsTrigger 
                value="all" 
                className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none font-bold text-xs"
              >
                <Sparkles size={14} className="ml-1.5" />
                لك
              </TabsTrigger>
              <TabsTrigger 
                value="following" 
                className="flex-1 h-full rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none font-bold text-xs"
              >
                <Users size={14} className="ml-1.5" />
                أتابعهم
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {isAllLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : allPosts && allPosts.length > 0 ? (
                allPosts.map((post: any) => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="text-center py-20 bg-card">
                  <p className="text-muted-foreground text-xs font-medium">لا توجد منشورات بعد.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="following" className="mt-0">
              {isFollowingLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : followingPosts && followingPosts.length > 0 ? (
                followingPosts.map((post: any) => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="text-center py-24 bg-card px-8">
                  <Users size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-primary font-bold text-sm mb-1">ابدأ بمتابعة الآخرين</p>
                  <p className="text-muted-foreground text-[10px]">عندما تتابع أشخاصاً، ستظهر منشوراتهم هنا.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column */}
        <div className="hidden lg:block w-80 pt-2 h-fit sticky top-10">
          <RightSidebar />
        </div>
      </main>

      <Toaster />
    </div>
  );
}
