
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
import { Calendar, MapPin, Settings, Loader2, UserPlus, UserCheck, Share, Copy, ExternalLink, Twitter, Camera, ImageIcon, Lock, Heart, Bookmark, UserRoundPlus, ShieldCheck, Coffee, Sparkles, Wallet, Users } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, where, orderBy, arrayUnion, arrayRemove, updateDoc, serverTimestamp, limit } from 'firebase/firestore';
import VerifiedBadge, { VerificationType } from '@/components/ui/VerifiedBadge';
import TimgadLogo from '@/components/ui/Logo';
import TimgadCoin from '@/components/ui/TimgadCoin';
import Link from 'next/link';
import { ar } from 'date-fns/locale';
import { formatDistanceToNow } from 'date-fns';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { AadsUnitBanner } from '@/components/ads/AadsUnit';

function AdminAdBanner({ banner }: { banner: any }) {
  if (!banner) return null;
  return (
    <Link href={banner.link || '#'} target="_blank" className="block w-full rounded-xl overflow-hidden border border-primary/10 shadow-sm mb-4 group relative bg-card">
      <img src={banner.imageUrl} alt={banner.title} className="w-full h-auto object-cover aspect-[3/1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
        <p className="text-white text-[10px] font-bold">{banner.title}</p>
      </div>
      <div className="absolute top-2 right-2 bg-primary/80 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-widest flex items-center gap-1 shadow-lg">
        <ShieldCheck size={8} /> إعلان الإدارة
      </div>
    </Link>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { toast } = useToast();
  
  const { firestore, user: currentUser, isUserLoading } = useFirebase();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSupportHistoryOpen, setIsSupportHistoryOpen] = useState(false);
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

  const adminBannersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'admin_banners'),
      where('expiresAt', '>', new Date()),
      orderBy('expiresAt', 'desc'),
      limit(1)
    );
  }, [firestore]);

  const { data: activeBanners } = useCollection(adminBannersQuery);
  const activeAdminBanner = activeBanners?.[0];

  const postsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'posts'),
      where('authorId', '==', id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const { data: posts, isLoading: isPostsLoading } = useCollection(postsQuery);

  const bookmarksQuery = useMemoFirebase(() => {
    if (!firestore || !id || currentUser?.uid !== id) return null;
    return query(
      collection(firestore, 'users', id, 'bookmarks'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id, currentUser?.uid]);

  const { data: bookmarks, isLoading: isBookmarksLoading } = useCollection(bookmarksQuery);

  const likedPostsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'users', id, 'likedPosts'),
      orderBy('likedAt', 'desc')
    );
  }, [firestore, id]);

  const { data: likedPosts, isLoading: isLikesLoading } = useCollection(likedPostsQuery);

  const supportedPeopleQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'users', id, 'supportedPeople'),
      orderBy('lastSupportedAt', 'desc')
    );
  }, [firestore, id]);

  const { data: supportedPeople, isLoading: isSupportedPeopleLoading } = useCollection(supportedPeopleQuery);

  const supportersQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'users', id, 'supporters'),
      orderBy('lastSupportedAt', 'desc')
    );
  }, [firestore, id]);

  const { data: supporters, isLoading: isSupportersLoading } = useCollection(supportersQuery);

  const isOwnProfile = currentUser?.uid === id;
  const isFollowing = (profile?.followerIds || []).includes(currentUser?.uid);
  const isFollowingMe = (profile?.followingIds || []).includes(currentUser?.uid);
  
  const isInfiniteAdmin = profile?.email === ADMIN_EMAIL;
  const verificationType: VerificationType = profile?.verificationType || 'none';

  useEffect(() => {
    if (profile) {
      setEditName(profile.username || '');
      setEditBio(profile.bio || '');
      setEditProfilePic(profile.profilePictureUrl || null);
      setEditBanner(profile.bannerUrl || null);
    }
  }, [profile]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsSaving(true);
      const url = await uploadImageToCloudinary(file);
      if (type === 'profile') setEditProfilePic(url);
      else setEditBanner(url);
      toast({ description: "تم رفع الصورة بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", description: "فشل في رفع الصورة." });
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
            
            {currentUser?.email === ADMIN_EMAIL && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-accent text-white shadow-lg hover:bg-accent/90 z-20" 
                onClick={() => router.push('/admin')}
              >
                <ShieldCheck size={14} />
              </Button>
            )}

            <div className="absolute top-2 left-2 flex gap-2">
              <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
                <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40"><Share size={14} /></Button></DialogTrigger>
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
              {isOwnProfile && <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/20 text-white backdrop-blur-sm hover:bg-black/40" onClick={() => router.push('/settings')}><Settings size={14} /></Button>}
            </div>
          </div>

          <div className="px-4 pb-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-12 md:-mt-10 mb-4 gap-4">
              <div className="flex flex-col items-start text-right w-full md:w-auto">
                <Avatar className="h-24 w-24 border-4 border-card bg-background rounded-full text-primary bg-primary/5 mb-2 shrink-0">
                  {profile.profilePictureUrl ? <AvatarImage src={profile.profilePictureUrl} alt={profile.username} /> : null}
                  <AvatarFallback className="text-xl font-bold">{profile.username?.[0] || 'ت'}</AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-start">
                    <VerifiedBadge type={verificationType} size={16} />
                    <span className="text-md font-bold text-primary">{profile.username}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                {isOwnProfile && (
                  <Button 
                    variant="ghost" 
                    className="h-10 border border-muted hover:bg-secondary transition-all rounded-full flex items-center gap-2 px-3 group shrink-0"
                    onClick={() => router.push('/wallet')}
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-[7px] text-muted-foreground uppercase font-bold tracking-tighter">رصيدي</span>
                      <span className="text-[10px] font-bold text-primary">{isInfiniteAdmin ? '∞' : (profile.coins || 0)}</span>
                    </div>
                    <TimgadCoin size={20} className="group-hover:scale-110 transition-transform" />
                  </Button>
                )}

                <Dialog open={isSupportHistoryOpen} onOpenChange={setIsSupportHistoryOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full h-10 w-10 border border-muted hover:bg-secondary transition-all shrink-0"
                    >
                      <Coffee size={20} className="text-primary" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-bold text-primary flex items-center gap-2">
                        <Sparkles size={16} className="text-accent" />
                        سجل تيمقاد للكرم
                      </DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="supporters" className="w-full">
                      <TabsList className="w-full grid grid-cols-2 h-9 rounded-none bg-secondary/30 mb-4 p-1">
                        <TabsTrigger value="supporters" className="text-[10px] font-bold gap-1.5">الأبطال الداعمون</TabsTrigger>
                        <TabsTrigger value="supported" className="text-[10px] font-bold gap-1.5">مساهمات العضو</TabsTrigger>
                      </TabsList>

                      <TabsContent value="supporters" className="max-h-[400px] overflow-y-auto no-scrollbar space-y-3">
                        <p className="text-[9px] text-muted-foreground text-center mb-2 italic">قائمة بمن قاموا بتقديم الدعم لـ {profile.username}.</p>
                        {isSupportersLoading ? (
                          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                        ) : supporters && supporters.length > 0 ? (
                          supporters.map((person: any) => (
                            <div key={person.id} className="flex items-center justify-between p-3 bg-card border rounded-none">
                              <Link href={`/profile/${person.userId}`} className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border">
                                  <AvatarImage src={person.avatar} />
                                  <AvatarFallback>{person.username?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col text-right">
                                  <div className="flex items-center gap-1">
                                    <VerifiedBadge type={person.verificationType || 'none'} size={10} />
                                    <span className="text-xs font-bold text-primary">{person.username}</span>
                                  </div>
                                  <span className="text-[8px] text-muted-foreground">آخر دعم: {person.lastSupportedAt?.toDate ? formatDistanceToNow(person.lastSupportedAt.toDate(), { locale: ar }) : 'غير محدد'}</span>
                                </div>
                              </Link>
                              <div className="flex items-center gap-1.5 bg-accent/5 px-2 py-1 border border-accent/10">
                                <span className="text-[10px] font-bold text-accent">{person.totalAmount}</span>
                                <TimgadCoin size={16} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-16 opacity-40">
                            <Users size={32} className="mx-auto mb-2" />
                            <p className="text-[10px]">لا يوجد داعمون مسجلون بعد.</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="supported" className="max-h-[400px] overflow-y-auto no-scrollbar space-y-3">
                        <p className="text-[9px] text-muted-foreground text-center mb-2 italic">مبدعون قام {profile.username} بدعمهم في تيمقاد.</p>
                        {isSupportedPeopleLoading ? (
                          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                        ) : supportedPeople && supportedPeople.length > 0 ? (
                          supportedPeople.map((person: any) => (
                            <div key={person.id} className="flex items-center justify-between p-3 bg-card border rounded-none">
                              <Link href={`/profile/${person.userId}`} className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border">
                                  <AvatarImage src={person.avatar} />
                                  <AvatarFallback>{person.username?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col text-right">
                                  <div className="flex items-center gap-1">
                                    <VerifiedBadge type={person.verificationType || 'none'} size={10} />
                                    <span className="text-xs font-bold text-primary">{person.username}</span>
                                  </div>
                                  <span className="text-[8px] text-muted-foreground">تاريخ المساهمة: {person.lastSupportedAt?.toDate ? formatDistanceToNow(person.lastSupportedAt.toDate(), { locale: ar }) : 'غير محدد'}</span>
                                </div>
                              </Link>
                              <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-1 border border-primary/10">
                                <span className="text-[10px] font-bold text-primary">{person.totalAmount}</span>
                                <TimgadCoin size={16} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-16 opacity-40">
                            <Coffee size={32} className="mx-auto mb-2" />
                            <p className="text-[10px]">لم يقم هذا العضو بدعم أحد بعد.</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                {isOwnProfile ? (
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild><Button variant="outline" className="rounded-full gap-2 font-bold h-10 text-[11px] px-5 shrink-0">تعديل الملف</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle className="text-sm font-bold">تعديل الملف الشخصي</DialogTitle></DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="space-y-4">
                          <div className="space-y-2"><label className="text-[10px] font-bold text-muted-foreground uppercase">صورة البنر</label>
                            <div className="h-24 bg-secondary/30 relative cursor-pointer group overflow-hidden" onClick={() => bannerInputRef.current?.click()}>
                              {editBanner ? <img src={editBanner} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-muted-foreground/40"><ImageIcon size={24} /></div>}
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                {isSaving ? <Loader2 className="text-white animate-spin" /> : <Camera className="text-white" size={20} />}
                              </div>
                            </div><input type="file" hidden ref={bannerInputRef} onChange={(e) => handleImageChange(e, 'banner')} accept="image/*" />
                          </div>
                          <div className="space-y-2"><label className="text-[10px] font-bold text-muted-foreground uppercase">الصورة الشخصية</label>
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-16 rounded-full bg-secondary/30 relative cursor-pointer group overflow-hidden shrink-0" onClick={() => profilePicInputRef.current?.click()}>
                                {editProfilePic ? <img src={editProfilePic} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-muted-foreground/40 font-bold">{editName?.[0] || 'ت'}</div>}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  {isSaving ? <Loader2 className="text-white animate-spin" /> : <Camera className="text-white" size={16} />}
                                </div>
                              </div><p className="text-[9px] text-muted-foreground">تغيير صورة ملفك في تيمقاد عبر سحابة Cloudinary.</p>
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
                    className={`rounded-full px-5 font-bold h-10 text-[11px] gap-2 shrink-0 ${isFollowing ? 'border-primary text-primary' : 'bg-primary text-white'}`}
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

        {/* وحدة الإعلانات في ملف المستخدم الشخصي */}
        <div className="px-4 py-2">
          {activeAdminBanner ? (
            <AdminAdBanner banner={activeAdminBanner} />
          ) : (
            <AadsUnitBanner />
          )}
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
              {isOwnProfile && <TabsTrigger value="bookmarks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 text-[10px] font-bold h-full gap-1.5 shrink-0">المحفوظات <span className="text-[9px] opacity-50">({bookmarks?.length || 0})</span></TabsTrigger>}
              <TabsTrigger value="likes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 text-[10px] font-bold h-full gap-1.5 shrink-0">الإعجابات <span className="text-[9px] opacity-50">({likedPosts?.length || 0})</span></TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="mt-0 space-y-[1px]">
              {isPostsLoading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-6 w-6" /></div> : posts && posts.length > 0 ? posts.map((post: any) => <PostCard key={post.id} post={post} />) : <div className="text-center py-24 bg-card px-8 border-b"><p className="text-muted-foreground text-[10px]">لا توجد منشورات في تيمقاد بعد.</p></div>}
            </TabsContent>
            {isOwnProfile && (
              <TabsContent value="bookmarks" className="mt-0 space-y-[1px]">
                {isBookmarksLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary h-6 w-6" /></div>
                ) : bookmarks && bookmarks.length > 0 ? (
                  bookmarks.map((bookmark: any) => (
                    <PostCard key={bookmark.id} post={bookmark} />
                  ))
                ) : (
                  <div className="text-center py-24 bg-card px-8 border-b flex flex-col items-center">
                    <Bookmark size={30} className="text-muted-foreground/20 mb-3" />
                    <p className="text-muted-foreground text-[10px]">لا توجد منشورات محفوظة.</p>
                  </div>
                )}
              </TabsContent>
            )}
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
