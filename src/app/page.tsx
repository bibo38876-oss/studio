'use client';

import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { Toaster } from '@/components/ui/toaster';
import { useCollection, useFirebase, useMemoFirebase, initiateAnonymousSignIn, setDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const ARABIC_NAMES = ['خالد الجبر', 'نورة السبيعي', 'فهد الشمري', 'ريم القحطاني', 'صالح الحربي', 'منى الشهري'];

export default function Home() {
  const { firestore, auth, user, isUserLoading } = useFirebase();

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

  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'posts'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="container mx-auto px-0 md:px-4 pt-10 flex gap-6">
        {/* Left column - Hidden on small screens */}
        <div className="hidden md:block w-64 pt-2 h-fit sticky top-10">
          <LeftSidebar />
        </div>

        {/* Middle column - Feed */}
        <div className="flex-1 w-full max-w-full md:max-w-xl mx-auto">
          <div className="flex flex-col">
            {isPostsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground text-xs">جاري جلب المنشورات...</p>
              </div>
            ) : posts && posts.length > 0 ? (
              posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))
            ) : (
              <div className="text-center py-20 bg-card">
                <p className="text-muted-foreground text-sm">لا توجد منشورات بعد.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Hidden on small screens */}
        <div className="hidden lg:block w-80 pt-2 h-fit sticky top-10">
          <RightSidebar />
        </div>
      </main>

      <Toaster />
    </div>
  );
}
