
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
  const params = useParams();
  const id = params?.id as string;
  
  const { firestore, user: currentUser } = useFirebase();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  // استرجاع بيانات الملف الشخصي
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'users', id);
  }, [firestore, id]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // استرجاع منشورات المستخدم - تأكد من أن القواعد تسمح بهذا الاستعلام
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  if (!profile) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Navbar />
      <p className="text-muted-foreground text-sm font-bold">المستخدم غير موجود.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-xl pt-8 pb-20 px-0 md:px-4">
        {/* Header Profile Section */}
        <div className="bg-card rounded-none overflow-hidden mb-1 border-b">
          <div className="h-28 bg-primary/10 relative">
            {isOwnProfile && (
              <Button variant="ghost" size="icon" className="absolute top-2 left-2 h-7 w-7 rounded-full bg-black/10 text-white backdrop-blur-sm">
                <Settings size={14} />
              </Button>
            )}
          </div>
          <div className="px-4 pb-6 relative">
            <div className="flex justify-between items-end -mt-10 mb-4">
              <Avatar className="h-20 w-20 border-4 border-card bg-background">
                <AvatarImage src={profile.profilePictureUrl} alt={profile.username} />
                <AvatarFallback>{profile.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className="pb-1">
                {isOwnProfile ? (
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-full gap-2 font-bold h-8 text-[11px]" onClick={() => {
                        setEditName(profile.username);
                        setEditBio(profile.bio || '');
                      }}>
                        <Edit3 size={12} />
                        تعديل الملف
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-sm font-bold">تعديل الملف الشخصي</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <label className="text-[10px] font-bold text-muted-foreground">الاسم</label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 rounded-none bg-secondary/30 border-none text-xs" />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-[10px] font-bold text-muted-foreground">النبذة الشخصية</label>
                          <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="rounded-none bg-secondary/30 border-none text-xs min-h-[100px]" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="w-full rounded-full font-bold text-xs h-9" onClick={handleUpdateProfile}>حفظ التغييرات</Button>
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
                <h1 className="text-md font-bold text-primary">{profile.username}</h1>
                <p className="text-[9px] text-muted-foreground">@{profile.id?.slice(0, 8)}</p>
              </div>

              <p className="text-xs leading-relaxed text-foreground/80">{profile.bio || 'لا يوجد نبذة شخصية.'}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1"><MapPin size={10} /><span>الرياض، السعودية</span></div>
                <div className="flex items-center gap-1"><Calendar size={10} /><span>انضم {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }) : 'حديثاً'}</span></div>
              </div>

              <div className="flex gap-4 pt-1">
                <div className="flex gap-1 items-center text-xs"><span className="font-bold text-primary">{profile.followingIds?.length || 0}</span><span className="text-muted-foreground text-[10px]">يتابع</span></div>
                <div className="flex gap-1 items-center text-xs"><span className="font-bold text-primary">{profile.followerIds?.length || 0}</span><span className="text-muted-foreground text-[10px]">متابع</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for content */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-10 p-0 mb-0.5 sticky top-7 z-40 bg-background/80 backdrop-blur-md">
            <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold h-full">المنشورات</TabsTrigger>
            <TabsTrigger value="likes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-xs font-bold h-full">الإعجابات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-0 space-y-[1px]">
            {isPostsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-6 w-6" /></div>
            ) : posts && posts.length > 0 ? (
              posts.map((post: any) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-24 bg-card px-8">
                <p className="text-muted-foreground text-[10px]">لا توجد منشورات لهذا المستخدم بعد.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-0">
            <div className="text-center py-24 bg-card px-8">
              <p className="text-muted-foreground text-[10px]">سيتم عرض الإعجابات هنا قريباً.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
