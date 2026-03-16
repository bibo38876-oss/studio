
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import PostCard from '@/components/posts/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Edit3, Settings, Loader2, UserPlus, UserCheck, Share, Copy, ExternalLink, Twitter, Camera, Image as ImageIcon, Lock, Heart, Repeat, UserRoundPlus, ShieldCheck } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, orderBy, arrayUnion, arrayRemove, updateDoc, serverTimestamp } from 'firebase/firestore';
import VerifiedBadge, { VerificationType } from '@/components/ui/VerifiedBadge';
import TimgadLogo from '@/components/ui/Logo';
import Link from 'next/link';

const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

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
  const [editProfilePic, setEditProfilePic] = useState<string | null>(null);
  const [editBanner, setEditBanner] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const ADMIN_EMAIL = 'adelbenmaza8@gmail.com';

  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isUserLoading, router]);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'users', id);
  }, [firestore, id]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const currentUserProfileRef = useMemoFirebase(() => {
    if (!firestore || !currentUser?.uid) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser?.uid]);

  const { data: currentUserProfile } = useDoc(currentUserProfileRef);

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'posts'),
      where('authorId', '==', id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery);

  const repostsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'users', id, 'reposts'),
      orderBy('repostedAt', 'desc')
    );
  }, [firestore, id]);

  const { data: reposts, isLoading: isRepostsLoading } = useCollection(repostsQuery);

  const likesQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'users', id, 'likedPosts'),
      orderBy('likedAt', 'desc')
    );
  }, [firestore, id]);

  const { data: likedPosts, isLoading: isLikesLoading } = useCollection(likesQuery);

  const isOwnProfile = currentUser?.uid === id;
  const isFollowing = (profile?.followerIds || []).includes(currentUser?.uid);
  const isFollowingMe = (profile?.followingIds || []).includes(currentUser?.uid);
  
  const verificationType: VerificationType = profile?.email === ADMIN_EMAIL 
    ? 'blue' 
    : (profile?.verificationType || 'none');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsSaving(true);
      const maxWidth = type === 'banner' ? 1200 : 400;
      const maxHeight = type === 'banner' ? 600 : 400;
      const compressedData = await compressImage(file, maxWidth, maxHeight, 0.7);
      if (type === 'profile') setEditProfilePic(compressedData);
      else setEditBanner(compressedData);
    } catch (error) {
      toast({ variant: "destructive", description: "فشل في معالجة الصورة." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!firestore || !currentUser?.uid) return;
    setIsSaving(true);
    try {
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), {
        username: editName || profile?.username,
        bio: editBio || profile?.bio,
        profilePictureUrl: editProfilePic || profile?.profilePictureUrl || "",
        bannerUrl: editBanner || profile?.bannerUrl || ""
      });
      setIsEditOpen(false);
      toast({ description: "تم تحديث ملفك في تيمقاد بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", description: "فشل تحديث الملف الشخصي." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollow = () => {
    if (!currentUser?.uid || !firestore || !profile || isOwnProfile) return;

    const curUserRef = doc(firestore, 'users', currentUser.uid);
    const targetUserRef = doc(firestore, 'users', id);

    if (isFollowing) {
      updateDoc(curUserRef, { followingIds: arrayRemove(id) });
      updateDoc(targetUserRef, { followerIds: arrayRemove(currentUser.uid) });
    } else {
      updateDoc(curUserRef, { followingIds: arrayUnion(id) });
      updateDoc(targetUserRef, { followerIds: arrayUnion(currentUser.uid) });
      
      addDocumentNonBlocking(collection(firestore, 'users', id, 'notifications'), {
        type: 'follow',
        fromUserId: currentUser.uid,
        fromUsername: currentUserProfile?.username || currentUser.displayName || 'مستكشف تيمقاد',
        fromAvatar: currentUserProfile?.profilePictureUrl || '',
        createdAt: serverTimestamp(),
        read: false
      });
    }
  };

  if (isUserLoading || !currentUser) return null;
  if (isProfileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  if (!profile) return <div className="min-h-screen flex items-center justify-center p-4"><p className="text-muted-foreground text-sm font-bold">المستخدم غير موجود.</p></div>;

  const isPrivateAndNotFollowing = profile.isPrivate && !isFollowing && !isOwnProfile;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-xl pt-8 pb-20 px-0 md:px-4">
        <div className="bg-card rounded-none overflow-hidden mb-1 border-b">
          <div className="h-32 bg-primary/10 relative">
            {profile.bannerUrl && <img src={profile.bannerUrl} alt="Banner" className="w-full h-full object-cover" />}
            <div className="absolute top-2 left-2 flex gap-2">
              <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/10 text-white backdrop-blur-sm hover:bg-black/20"><Share size={14} /></Button></DialogTrigger>
                <DialogContent className="p-0 overflow-hidden border-none bg-background">
                  <DialogTitle className="sr-only">مشاركة الملف الشخصي</DialogTitle>
                  <div className="bg-primary p-6 text-center text-white space-y-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
                      <TimgadLogo size={32} variant="white" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold font-headline tracking-tighter">تيمقاد | Timgad</h2>
                      <p className="text-[10px] opacity-80">منصة اجتماعية عربية عريقة برؤية تقنية عصرية</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <Card className="border-none bg-secondary/30 rounded-none p-4"><p className="text-xs leading-relaxed text-center font-medium text-primary">انضم إلينا في تيمقاد، حيث يلتقي التراث بالمستقبل في بيئة تقنية متطورة.</p></Card>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="rounded-none text-[8px] h-8 font-bold gap-1 px-1" onClick={() => {navigator.clipboard.writeText(window.location.href); toast({description: "تم نسخ الرابط"});}}><Copy size={10} /> نسخ الرابط</Button>
                      <Button className="rounded-none text-[8px] h-8 font-bold gap-1 px-1 bg-green-600" onClick={() => window.open(`https://wa.me/?text=${window.location.href}`)}><ExternalLink size={10} /> واتساب</Button>
                      <Button className="rounded-none text-[8px] h-8 font-bold gap-1 px-1 bg-black" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}`)}><Twitter size={10} /> تويتر</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {isOwnProfile && <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/10 text-white backdrop-blur-sm hover:bg-black/20" onClick={() => router.push('/settings')}><Settings size={14} /></Button>}
              
              {/* Admin Management Icon in Corner */}
              {currentUser?.email === ADMIN_EMAIL && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full bg-accent/20 text-accent backdrop-blur-sm hover:bg-accent/40 border border-accent/30" 
                  onClick={() => router.push('/admin')}
                >
                  <ShieldCheck size={14} />
                </Button>
              )}
            </div>
          </div>

          <div className="px-4 pb-6 relative">
            <div className="flex flex-row justify-between items-start -mt-10 mb-4">
              <div className="flex flex-col items-start text-right">
                <Avatar className="h-24 w-24 border-4 border-card bg-background rounded-full text-primary bg-primary/5 mb-2">
                  {profile.profilePictureUrl ? <AvatarImage src={profile.profilePictureUrl} alt={profile.username} /> : null}
                  <AvatarFallback className="text-xl font-bold">{profile.username?.[0] || 'ت'}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-start">
                    <span className="text-md font-bold text-primary">{profile.username}</span>
                    <VerifiedBadge type={verificationType} size={16} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              <div className="pt-12">
                {isOwnProfile ? (
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild><Button variant="outline" className="rounded-full gap-2 font-bold h-8 text-[11px] px-6">تعديل الملف</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle className="text-sm font-bold">تعديل الملف الشخصي</DialogTitle></DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="space-y-4">
                          <div className="space-y-2"><label className="text-[10px] font-bold text-muted-foreground uppercase">صورة البنر</label>
                            <div className="h-24 bg-secondary/30 relative cursor-pointer group overflow-hidden" onClick={() => bannerInputRef.current?.click()}>
                              {editBanner ? <img src={editBanner} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-muted-foreground/40"><ImageIcon size={24} /></div>}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera className="text-white" size={20} /></div>
                            </div><input type="file" hidden ref={bannerInputRef} onChange={(e) => handleImageChange(e, 'banner')} accept="image/*" />
                          </div>
                          <div className="space-y-2"><label className="text-[10px] font-bold text-muted-foreground uppercase">الصورة الشخصية</label>
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-16 rounded-full bg-secondary/30 relative cursor-pointer group overflow-hidden shrink-0" onClick={() => profilePicInputRef.current?.click()}>
                                {editProfilePic ? <img src={editProfilePic} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-muted-foreground/40 font-bold">{editName?.[0] || 'ت'}</div>}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera className="text-white" size={16} /></div>
                              </div><p className="text-[9px] text-muted-foreground">تغيير صورة ملفك في تيمقاد.</p>
                            </div><input type="file" hidden ref={profilePicInputRef} onChange={(e) => handleImageChange(e, 'profile')} accept="image/*" />
                          </div>
                        </div>
                        <div className="grid gap-2"><label className="text-[10px] font-bold text-muted-foreground uppercase">الاسم</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9 rounded-none bg-secondary/30 border-none text-xs" /></div>
                        <div className="grid gap-2"><label className="text-[10px] font-bold text-muted-foreground uppercase">النبذة الشخصية</label><Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="rounded-none bg-secondary/30 border-none text-xs min-h-[100px]" /></div>
                      </div>
                      <DialogFooter><Button className="w-full rounded-full font-bold text-xs h-9" onClick={handleUpdateProfile} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : "حفظ التغييرات"}</Button></DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button 
                    onClick={handleFollow} 
                    variant={isFollowing ? "outline" : "default"} 
                    className={`rounded-full px-6 font-bold h-8 text-[11px] gap-2 ${isFollowing ? 'border-primary text-primary' : 'bg-primary text-white'}`}
                  >
                    {isFollowing ? (
                      <UserCheck size={12} />
                    ) : isFollowingMe ? (
                      <UserRoundPlus size={12} />
                    ) : (
                      <UserPlus size={12} />
                    )} 
                    {isFollowing ? 'متابع' : isFollowingMe ? 'رد المتابعة' : 'متابعة'}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <p className="text-xs leading-relaxed text-foreground/80 text-right">{profile.bio || 'لا يوجد نبذة شخصية.'}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground justify-end">
                <div className="flex items-center gap-1"><MapPin size={10} /><span>تيمقاد، الجزائر</span></div>
                <div className="flex items-center gap-1"><Calendar size={10} /><span>انضم {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' }) : 'حديثاً'}</span></div>
              </div>
              <div className="flex gap-4 pt-1 justify-end">
                <Link href={`/profile/${id}/connections?tab=following`} className="flex gap-1 items-center text-xs hover:bg-secondary/50 px-2 py-1 rounded-sm transition-colors">
                  <span className="font-bold text-primary">{profile.followingIds?.length || 0}</span>
                  <span className="text-muted-foreground text-[10px]">يتابع</span>
                </Link>
                <Link href={`/profile/${id}/connections?tab=followers`} className="flex gap-1 items-center text-xs hover:bg-secondary/50 px-2 py-1 rounded-sm transition-colors">
                  <span className="font-bold text-primary">{profile.followerIds?.length || 0}</span>
                  <span className="text-muted-foreground text-[10px]">متابع</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {isPrivateAndNotFollowing ? (
          <div className="text-center py-24 bg-card px-8 border-b flex flex-col items-center gap-3">
            <Lock size={40} className="text-muted-foreground/30" />
            <h2 className="text-sm font-bold text-primary">هذا الحساب في تيمقاد خاص</h2>
            <p className="text-[10px] text-muted-foreground max-w-[200px]">يجب عليك متابعة هذا المستخدم لمشاهدة منشوراته وتفاعلاته.</p>
          </div>
        ) : (
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-10 p-0 mb-0.5 sticky top-7 z-40 bg-background/80 backdrop-blur-md overflow-x-auto no-scrollbar">
              <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 text-[10px] font-bold h-full gap-1.5 shrink-0">المنشورات <span className="text-[9px] opacity-50">({posts?.length || 0})</span></TabsTrigger>
              <TabsTrigger value="reposts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 text-[10px] font-bold h-full gap-1.5 shrink-0">المعاد نشرها <span className="text-[9px] opacity-50">({reposts?.length || 0})</span></TabsTrigger>
              <TabsTrigger value="likes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 text-[10px] font-bold h-full gap-1.5 shrink-0">الإعجابات <span className="text-[9px] opacity-50">({likedPosts?.length || 0})</span></TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-0 space-y-[1px]">
              {isPostsLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-6 w-6" /></div> : posts && posts.length > 0 ? posts.map((post: any) => <PostCard key={post.id} post={post} />) : <div className="text-center py-24 bg-card px-8 border-b"><p className="text-muted-foreground text-[10px]">لا توجد منشورات في تيمقاد بعد.</p></div>}
            </TabsContent>
            <TabsContent value="reposts" className="mt-0 space-y-[1px]">
              {isRepostsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-6 w-6" /></div>
              ) : reposts && reposts.length > 0 ? (
                reposts.map((repost: any) => (
                  <div key={repost.id} className="relative">
                    <div className="bg-muted/30 px-4 py-1 flex items-center gap-2 text-[9px] text-muted-foreground font-bold border-b text-right">
                      <Repeat size={10} className="text-green-500" /> أعاد نشر هذا
                    </div>
                    <PostCard post={repost.postData} />
                  </div>
                ))
              ) : (
                <div className="text-center py-24 bg-card px-8 border-b flex flex-col items-center">
                  <Repeat size={30} className="text-muted-foreground/20 mb-3" />
                  <p className="text-muted-foreground text-[10px]">لا توجد منشورات معاد نشرها.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="likes" className="mt-0 space-y-[1px]">
              {isLikesLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-6 w-6" /></div>
              ) : likedPosts && likedPosts.length > 0 ? (
                likedPosts.map((post: any) => <PostCard key={post.id} post={post} />)
              ) : (
                <div className="text-center py-24 bg-card px-8 border-b flex flex-col items-center gap-3">
                  <Heart size={30} className="text-muted-foreground/20 mb-3" />
                  <p className="text-muted-foreground text-[10px]">لا توجد منشورات معجب بها بعد.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Toaster />
    </div>
  );
}
