
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import PostCard from '@/components/posts/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Edit3, Settings, Loader2, UserPlus, UserCheck, Repeat, Share, Copy, ExternalLink, Twitter } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, orderBy, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const { firestore, user: currentUser, isUserLoading } = useFirebase();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isUserLoading, router]);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !id || !currentUser?.uid) return null;
    return doc(firestore, 'users', id);
  }, [firestore, id, currentUser?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !id || !currentUser?.uid) return null;
    return query(
      collection(firestore, 'posts'),
      where('authorId', '==', id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id, currentUser?.uid]);

  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery);

  const repostsQuery = useMemoFirebase(() => {
    if (!firestore || !id || !currentUser?.uid) return null;
    return query(
      collection(firestore, 'users', id, 'reposts'),
      orderBy('repostedAt', 'desc')
    );
  }, [firestore, id, currentUser?.uid]);

  const { data: reposts, isLoading: isRepostsLoading } = useCollection(repostsQuery);

  const isOwnProfile = currentUser?.uid === id;
  const isFollowing = (profile?.followerIds || []).includes(currentUser?.uid);

  const handleUpdateProfile = () => {
    if (!firestore || !currentUser?.uid) return;
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), {
      username: editName || profile?.username,
      bio: editBio || profile?.bio
    });
    setIsEditOpen(false);
  };

  const handleFollow = () => {
    if (!currentUser?.uid || !firestore || !profile || isOwnProfile) return;

    const currentUserRef = doc(firestore, 'users', currentUser.uid);
    const targetUserRef = doc(firestore, 'users', id);

    if (isFollowing) {
      updateDoc(currentUserRef, { followingIds: arrayRemove(id) });
      updateDoc(targetUserRef, { followerIds: arrayRemove(currentUser.uid) });
    } else {
      updateDoc(currentUserRef, { followingIds: arrayUnion(id) });
      updateDoc(targetUserRef, { followerIds: arrayUnion(currentUser.uid) });
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    toast({
      title: "تم النسخ!",
      description: "تم نسخ رابط التطبيق لمشاركته مع أصدقائك.",
    });
  };

  if (isUserLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary h-8 w-8" />
      </div>
    );
  }

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      </div>
    );
  }

  if (!profile) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Navbar />
      <p className="text-muted-foreground text-sm font-bold mt-20">المستخدم غير موجود.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-xl pt-8 pb-20 px-0 md:px-4">
        <div className="bg-card rounded-none overflow-hidden mb-1 border-b">
          <div className="h-28 bg-primary/10 relative">
            <div className="absolute top-2 left-2 flex gap-2">
              <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/10 text-white backdrop-blur-sm hover:bg-black/20">
                    <Share size={14} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none bg-background">
                  <DialogTitle className="sr-only">مشاركة الملف الشخصي</DialogTitle>
                  <div className="bg-primary p-6 text-center text-white space-y-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
                      <span className="text-2xl font-bold font-headline tracking-tighter">ت</span>
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold font-headline tracking-tighter">تواصل | Tawasul</h2>
                      <p className="text-[10px] opacity-80">منصة تواصل اجتماعي عربية متطورة ومبسطة</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <Card className="border-none bg-secondary/30 rounded-none p-4">
                      <p className="text-xs leading-relaxed text-center font-medium text-primary">
                        انضم إلينا في تواصل، حيث المجتمع العربي يلتقي في بيئة تقنية متطورة، فائقة السرعة، ومصممة خصيصاً لتناسب احتياجاتك.
                      </p>
                    </Card>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="rounded-none text-[8px] h-8 font-bold gap-1 px-1" onClick={copyShareLink}>
                        <Copy size={10} />
                        نسخ الرابط
                      </Button>
                      <Button className="rounded-none text-[8px] h-8 font-bold gap-1 px-1 bg-green-600 hover:bg-green-700" onClick={() => window.open(`https://wa.me/?text=انضم%20إلي%20في%20تواصل!%20${window.location.origin}`)}>
                        <ExternalLink size={10} />
                        واتساب
                      </Button>
                      <Button className="rounded-none text-[8px] h-8 font-bold gap-1 px-1 bg-black hover:bg-black/90" onClick={() => window.open(`https://twitter.com/intent/tweet?text=انضم%20إلي%20في%20تواصل!&url=${window.location.origin}`)}>
                        <Twitter size={10} />
                        تويتر
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {isOwnProfile && (
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/10 text-white backdrop-blur-sm hover:bg-black/20" onClick={() => router.push('/settings')}>
                  <Settings size={14} />
                </Button>
              )}
            </div>
          </div>
          <div className="px-4 pb-6 relative">
            <div className="flex justify-between items-end -mt-10 mb-4">
              <Avatar className="h-20 w-20 border-4 border-card bg-background rounded-full text-primary bg-primary/5">
                {profile.profilePictureUrl ? <AvatarImage src={profile.profilePictureUrl} alt={profile.username} /> : null}
                <AvatarFallback className="text-xl font-bold">{profile.username?.[0] || 'ت'}</AvatarFallback>
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
                  <Button 
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className={`rounded-full px-6 font-bold h-8 text-[11px] gap-2 ${isFollowing ? 'border-primary text-primary' : 'bg-primary text-white'}`}
                  >
                    {isFollowing ? <UserCheck size={12} /> : <UserPlus size={12} />}
                    {isFollowing ? 'متابع' : 'متابعة'}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-0.5">
                <h1 className="text-md font-bold text-primary">{profile.username}</h1>
                <p className="text-[9px] text-muted-foreground">{profile.email}</p>
              </div>

              <p className="text-xs leading-relaxed text-foreground/80">{profile.bio || 'لا يوجد نبذة شخصية.'}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1"><MapPin size={10} /><span>الجزائر</span></div>
                <div className="flex items-center gap-1"><Calendar size={10} /><span>انضم {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }) : 'حديثاً'}</span></div>
              </div>

              <div className="flex gap-4 pt-1">
                <div className="flex gap-1 items-center text-xs"><span className="font-bold text-primary">{profile.followingIds?.length || 0}</span><span className="text-muted-foreground text-[10px]">يتابع</span></div>
                <div className="flex gap-1 items-center text-xs"><span className="font-bold text-primary">{profile.followerIds?.length || 0}</span><span className="text-muted-foreground text-[10px]">متابع</span></div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-10 p-0 mb-0.5 sticky top-7 z-40 bg-background/80 backdrop-blur-md overflow-x-auto no-scrollbar">
            <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-[10px] font-bold h-full gap-1.5 shrink-0">
              المنشورات
              <span className="text-[9px] opacity-50">({posts?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="reposts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-[10px] font-bold h-full gap-1.5 shrink-0">
              المعاد نشرها
              <span className="text-[9px] opacity-50">({reposts?.length || 0})</span>
            </TabsTrigger>
            <TabsTrigger value="likes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 text-[10px] font-bold h-full shrink-0">الإعجابات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-0 space-y-[1px]">
            {isPostsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-6 w-6" /></div>
            ) : posts && posts.length > 0 ? (
              posts.map((post: any) => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-24 bg-card px-8 border-b">
                <p className="text-muted-foreground text-[10px]">لا توجد منشورات لهذا المستخدم بعد.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reposts" className="mt-0 space-y-[1px]">
            {isRepostsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-6 w-6" /></div>
            ) : reposts && reposts.length > 0 ? (
              reposts.map((repost: any) => (
                <div key={repost.id} className="relative">
                  <div className="bg-muted/30 px-4 py-1 flex items-center gap-2 text-[9px] text-muted-foreground font-bold border-b border-muted/50">
                    <Repeat size={10} className="text-green-500" />
                    أعاد نشر هذا
                  </div>
                  <PostCard post={repost.postData} />
                </div>
              ))
            ) : (
              <div className="text-center py-24 bg-card px-8 border-b flex flex-col items-center">
                <Repeat size={30} className="text-muted-foreground/20 mb-3" />
                <p className="text-muted-foreground text-[10px]">لا توجد منشورات معاد نشرها بعد.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-0">
            <div className="text-center py-24 bg-card px-8 border-b">
              <p className="text-muted-foreground text-[10px]">سيتم عرض الإعجابات هنا قريباً.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Toaster />
    </div>
  );
}
