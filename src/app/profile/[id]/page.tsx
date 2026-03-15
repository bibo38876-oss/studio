
"use client"

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import PostCard from '@/components/posts/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, Edit3, Settings, Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useFirebase, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';

export default function ProfilePage() {
  const { id } = useParams() as { id: string };
  const { firestore, user: currentUser } = useFirebase();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'users', id);
  }, [firestore, id]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

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

  const handleUpdateProfile = () => {
    if (!firestore || !currentUser) return;
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), {
      username: editName || profile?.username,
      bio: editBio || profile?.bio
    });
    setIsEditOpen(false);
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return <div className="text-center py-20">المستخدم غير موجود.</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-4xl pt-8 pb-20 px-0 md:px-4">
        <div className="bg-card rounded-none overflow-hidden mb-1">
          <div className="h-32 bg-primary relative">
            {isOwnProfile && (
              <Button variant="ghost" size="icon" className="absolute top-2 left-2 h-7 w-7 rounded-full bg-black/10 text-white backdrop-blur-sm">
                <Settings size={14} />
              </Button>
            )}
          </div>
          <div className="px-4 pb-6 relative">
            <div className="flex justify-between items-end -mt-10 mb-4">
              <Avatar className="h-24 w-24 border-4 border-card">
                <AvatarImage src={profile.profilePictureUrl} alt={profile.username} />
                <AvatarFallback>{profile.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="pb-2">
                {isOwnProfile ? (
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-full gap-2 font-bold h-8 text-[11px]" onClick={() => {
                        setEditName(profile.username);
                        setEditBio(profile.bio || '');
                      }}>
                        <Edit3 size={14} />
                        تعديل الملف
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>تعديل الملف الشخصي</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <label className="text-xs font-bold">الاسم</label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-xs font-bold">النبذة الشخصية</label>
                          <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="w-full rounded-full" onClick={handleUpdateProfile}>حفظ التغييرات</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button className="rounded-full px-6 bg-primary text-white font-bold h-8 text-[11px]">متابعة</Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-0.5">
                <h1 className="text-lg font-bold text-primary">{profile.username}</h1>
                <p className="text-[10px] text-muted-foreground">@{profile.id?.slice(0, 8)}</p>
              </div>

              <p className="text-sm leading-relaxed">{profile.bio || 'لا يوجد نبذة شخصية.'}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1"><MapPin size={12} /><span>الرياض</span></div>
                <div className="flex items-center gap-1"><Calendar size={12} /><span>انضم {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }) : 'حديثاً'}</span></div>
              </div>

              <div className="flex gap-4 pt-1">
                <div className="flex gap-1 items-center text-xs"><span className="font-bold">{profile.followingIds?.length || 0}</span><span className="text-muted-foreground">يتابع</span></div>
                <div className="flex gap-1 items-center text-xs"><span className="font-bold">{profile.followerIds?.length || 0}</span><span className="text-muted-foreground">متابع</span></div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-9 p-0 mb-1 px-4">
            <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold">منشورات</TabsTrigger>
            <TabsTrigger value="likes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold">إعجابات</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="mt-0 space-y-[1px]">
            {isPostsLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : 
             posts?.length ? posts.map((post: any) => <PostCard key={post.id} post={post} />) : 
             <div className="text-center py-20 text-xs text-muted-foreground">لا توجد منشورات.</div>}
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
