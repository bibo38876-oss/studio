"use client"

import { useParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import PostCard from '@/components/posts/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Link as LinkIcon, Edit3, Settings, Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';

export default function ProfilePage() {
  const { id } = useParams() as { id: string };
  const { firestore, user: currentUser } = useFirebase();

  // Get profile data
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'users', id);
  }, [firestore, id]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // Get user's posts
  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'posts'),
      where('authorId', '==', id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery);

  const isOwnProfile = currentUser?.uid === id;

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">لم يتم العثور على هذا المستخدم.</p>
        <Button variant="link" onClick={() => window.history.back()}>العودة</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-4xl py-0 md:py-6 px-0 md:px-4 mt-8">
        {/* Profile Header */}
        <div className="bg-card rounded-none md:rounded-3xl shadow-none md:shadow-sm overflow-hidden mb-6">
          <div className="h-48 bg-primary relative">
            {isOwnProfile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 left-4 h-8 w-8 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm"
              >
                <Settings size={16} />
              </Button>
            )}
          </div>
          <div className="px-6 pb-6 relative">
            <div className="flex justify-between items-end -mt-12 mb-4">
              <Avatar className="h-32 w-32 border-4 border-card">
                <AvatarImage src={profile.profilePictureUrl} alt={profile.username} />
                <AvatarFallback>{profile.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="pb-2">
                {isOwnProfile ? (
                  <Button variant="outline" className="rounded-full gap-2 font-bold h-9">
                    <Edit3 size={16} />
                    تعديل الملف الشخصي
                  </Button>
                ) : (
                  <Button className="rounded-full px-8 bg-primary text-white font-bold h-9">
                    متابعة
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-primary">{profile.username}</h1>
                <p className="text-muted-foreground">@{profile.id?.slice(0, 8)}</p>
              </div>

              <p className="text-foreground max-w-2xl leading-relaxed">
                {profile.bio || 'لا يوجد نبذة شخصية بعد.'}
              </p>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>الرياض، المملكة العربية السعودية</span>
                </div>
                <div className="flex items-center gap-1">
                  <LinkIcon size={16} />
                  <a href="#" className="text-accent hover:underline">tawasul.com/{profile.username}</a>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>انضم {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }) : 'حديثاً'}</span>
                </div>
              </div>

              <div className="flex gap-6 pt-2">
                <div className="flex gap-1.5 items-center">
                  <span className="font-bold text-primary">{profile.followingIds?.length || 0}</span>
                  <span className="text-muted-foreground text-sm">يتابع</span>
                </div>
                <div className="flex gap-1.5 items-center">
                  <span className="font-bold text-primary">{profile.followerIds?.length || 0}</span>
                  <span className="text-muted-foreground text-sm">متابع</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 mb-6 px-4 md:px-0">
            <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-8 py-3 font-bold">منشورات</TabsTrigger>
            <TabsTrigger value="replies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-8 py-3 font-bold">الردود</TabsTrigger>
            <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-8 py-3 font-bold">الوسائط</TabsTrigger>
            <TabsTrigger value="likes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent px-8 py-3 font-bold">الإعجابات</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="space-y-1 md:space-y-4">
            {isPostsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : posts && posts.length > 0 ? (
              posts.map((post: any) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-20 bg-card rounded-none md:rounded-3xl">
                <p className="text-muted-foreground">لا توجد منشورات حتى الآن.</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="replies">
            <div className="text-center py-20 bg-card rounded-none md:rounded-3xl">
              <p className="text-muted-foreground">لا توجد ردود لعرضها.</p>
            </div>
          </TabsContent>
          <TabsContent value="media">
             <div className="text-center py-20 bg-card rounded-none md:rounded-3xl">
              <p className="text-muted-foreground">لا توجد صور أو فيديوهات.</p>
            </div>
          </TabsContent>
          <TabsContent value="likes">
             <div className="text-center py-20 bg-card rounded-none md:rounded-3xl">
              <p className="text-muted-foreground">المنشورات المعجب بها ستظهر هنا.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
    </div>
  );
}
