
"use client"

import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Bookmark, BarChart3, MoreHorizontal, Trash2, AlertTriangle, Rocket, Coffee, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CommentsDialog from "./CommentsDialog";
import VerifiedBadge, { VerificationType } from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface PostData {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  mediaUrls?: string[];
  createdAt: any;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  bookmarksCount?: number;
  viewsCount?: number;
  reportsCount?: number;
  promoted?: boolean;
  authorVerificationType?: VerificationType;
}

export default function PostCard({ post, currentUserProfile }: { post: PostData, currentUserProfile?: any }) {
  const { user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewedRef = useRef(false);
  
  const isAnonymous = !user || user.isAnonymous;
  const isOwner = user?.uid === post.authorId;
  const isAdmin = user?.email === 'adelbenmaza8@gmail.com';

  const authorRef = useMemoFirebase(() => {
    if (!firestore || !post.authorId) return null;
    return doc(firestore, 'users', post.authorId);
  }, [firestore, post.authorId]);
  
  const { data: authorProfile } = useDoc(authorRef);
  
  const currentVerificationType: VerificationType = authorProfile?.verificationType || post.authorVerificationType || 'none';
  const isVerifiedAuthor = currentVerificationType === 'blue' || currentVerificationType === 'gold';

  const likeRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !post.id) return null;
    return doc(firestore, 'posts', post.id, 'likes', user.uid);
  }, [firestore, post.id, user?.uid]);
  const { data: likeData } = useDoc(likeRef);

  const bookmarkRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !post.id) return null;
    return doc(firestore, 'users', user.uid, 'bookmarks', post.id);
  }, [firestore, post.id, user?.uid]);
  const { data: bookmarkData } = useDoc(bookmarkRef);

  useEffect(() => {
    if (!firestore || !post.id || !user?.uid || isOwner) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !viewedRef.current) {
        viewedRef.current = true;
        updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { viewsCount: increment(1) });
      }
    }, { threshold: 0.5 });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [firestore, post.id, user?.uid, isOwner]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !post.id) return;
    if (likeData) {
      deleteDocumentNonBlocking(likeRef!);
      updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { likesCount: increment(-1) });
    } else {
      setDocumentNonBlocking(likeRef!, { createdAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { likesCount: increment(1) });
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnonymous) { router.push('/login'); return; }
    if (!firestore || !user || !post.id) return;
    if (bookmarkData) {
      deleteDocumentNonBlocking(bookmarkRef!);
      updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { bookmarksCount: increment(-1) });
      toast({ description: "تمت الإزالة من المحفوظات." });
    } else {
      setDocumentNonBlocking(bookmarkRef!, { ...post, createdAt: serverTimestamp() }, { merge: true });
      updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { bookmarksCount: increment(1) });
      toast({ description: "تم الحفظ بنجاح." });
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnonymous) { router.push('/login'); return; }
    updateDocumentNonBlocking(doc(firestore!, 'posts', post.id), { reportsCount: increment(1) });
    toast({ title: "شكراً لبلاغك", description: "سنقوم بمراجعة هذا المنشور فوراً." });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin && !isOwner) return;
    deleteDocumentNonBlocking(doc(firestore!, 'posts', post.id));
    toast({ description: "تم حذف المنشور بنجاح." });
  };

  const handlePromote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isVerifiedAuthor && !isAdmin) return;
    if (!isAdmin && (currentUserProfile?.coins || 0) < 5) {
      toast({ variant: "destructive", title: "رصيد غير كافٍ", description: "الترويج يكلف 5 عملات تيمقاد." });
      return;
    }
    if (!isAdmin) updateDocumentNonBlocking(doc(firestore!, 'users', user!.uid), { coins: increment(-5) });
    updateDocumentNonBlocking(doc(firestore!, 'posts', post.id), { promoted: true });
    toast({ title: "تم الترويج!", description: "سيظهر منشورك الآن في مقدمة تيمقاد." });
  };

  const handleSupport = async (amount: number) => {
    if (isAnonymous) { router.push('/login'); return; }
    if ((currentUserProfile?.coins || 0) < amount) {
      toast({ variant: "destructive", description: "رصيدك في الخزانة لا يكفي لهذا الدعم." });
      return;
    }
    updateDocumentNonBlocking(doc(firestore!, 'users', user!.uid), { coins: increment(-amount) });
    updateDocumentNonBlocking(doc(firestore!, 'users', post.authorId), { coins: increment(amount) });
    addDocumentNonBlocking(collection(firestore!, 'users', post.authorId, 'notifications'), {
      type: 'support',
      fromUserId: user!.uid,
      fromUsername: currentUserProfile?.username || 'مبادر من تيمقاد',
      fromAvatar: currentUserProfile?.profilePictureUrl || '',
      amount,
      postId: post.id,
      createdAt: serverTimestamp(),
      read: false
    });
    toast({ title: "تم إرسال الدعم!", description: `لقد أرسلت ${amount} عملة ذهبية تقديراً لهذا المحتوى.` });
    setIsSupportOpen(false);
  };

  const renderContentWithHashtags = (text: string) => {
    if (!text) return null;
    const shouldTruncate = text.length > 200 && !isExpanded;
    const displayText = shouldTruncate ? text.substring(0, 200) + "..." : text;
    
    const parts = displayText.split(/(#[^\s#]+)/g);
    return (
      <div className="flex flex-col items-start w-full">
        <div className="text-sm leading-relaxed whitespace-pre-wrap text-right font-medium w-full">
          {parts.map((part, i) => {
            if (part.startsWith('#')) {
              return <span key={i} className="text-accent font-bold hover:underline cursor-pointer">{part}</span>;
            }
            return part;
          })}
        </div>
        {text.length > 200 && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="text-accent text-[11px] font-bold mt-1 hover:underline"
          >
            {isExpanded ? "عرض أقل" : "إقرأ المزيد"}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <Card ref={cardRef} className={cn("border-none shadow-none rounded-none w-full bg-card mb-0 cursor-pointer border-b-[0.5px] border-muted/10 hover:bg-muted/5 transition-all", post.promoted && "bg-primary/5")} onClick={() => setIsCommentsOpen(true)}>
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-1">
            {post.promoted && (
              <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1 ml-2">
                <Rocket size={10} />
                <span className="text-[8px] font-bold uppercase">مروج</span>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground"><MoreHorizontal size={16} /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem className="text-[11px] gap-2 cursor-pointer" onClick={handleReport}><AlertTriangle size={14} /> إبلاغ</DropdownMenuItem>
                {(isVerifiedAuthor || isAdmin) && !post.promoted && (
                  <DropdownMenuItem className="text-[11px] gap-2 cursor-pointer text-primary" onClick={handlePromote}><Rocket size={14} /> ترويج (5 عملات)</DropdownMenuItem>
                )}
                {(isOwner || isAdmin) && (
                  <DropdownMenuItem className="text-[11px] gap-2 cursor-pointer text-destructive" onClick={handleDelete}><Trash2 size={14} /> حذف المنشور</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href={`/profile/${post.authorId}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5 leading-tight justify-end">
                <VerifiedBadge type={currentVerificationType} size={14} />
                <span className="text-xs font-bold text-primary">{authorProfile?.username || post.authorName}</span>
              </div>
              <span className="text-[9px] text-muted-foreground">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
            </div>
            <Avatar className="h-10 w-10 border border-primary/10">
              <AvatarImage src={authorProfile?.profilePictureUrl || post.authorAvatar} />
              <AvatarFallback>{(authorProfile?.username || post.authorName)?.[0]}</AvatarFallback>
            </Avatar>
          </Link>
        </CardHeader>

        <CardContent className="px-4 py-1 text-right">
          {renderContentWithHashtags(post.content)}
          
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="mt-3 relative" onClick={(e) => e.stopPropagation()}>
              {post.mediaUrls.length === 1 ? (
                <div className="rounded-xl overflow-hidden border bg-muted/5">
                  <img src={post.mediaUrls[0]} alt="Post" className="w-full h-auto object-cover max-h-[500px]" />
                </div>
              ) : (
                <Carousel className="w-full">
                  <CarouselContent>
                    {post.mediaUrls.map((url, index) => (
                      <CarouselItem key={index}>
                        <div className="rounded-xl overflow-hidden border bg-muted/5">
                          <img src={url} alt={`Post Image ${index + 1}`} className="w-full h-auto object-cover max-h-[500px]" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="right-2 bg-black/20 text-white border-none h-8 w-8" />
                  <CarouselNext className="left-2 bg-black/20 text-white border-none h-8 w-8" />
                </Carousel>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 py-3 border-t border-muted/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleLike(e); }} className={cn("flex items-center gap-1.5 transition-colors", likeData ? "text-red-500" : "text-muted-foreground hover:text-red-500")}>
              <Heart size={18} className={likeData ? "fill-current" : ""} />
              <span className="text-[11px] font-bold">{post.likesCount || 0}</span>
            </motion.button>

            <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle size={18} />
              <span className="text-[11px] font-bold">{post.commentsCount || 0}</span>
            </div>

            {isVerifiedAuthor && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); setIsSupportOpen(true); }} className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 transition-colors">
                <Coffee size={18} />
                <span className="text-[10px] font-bold">دعم</span>
              </motion.button>
            )}

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BarChart3 size={18} />
              <span className="text-[11px] font-bold">{post.viewsCount || 0}</span>
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); handleBookmark(e); }} className={cn("flex items-center gap-1.5 transition-colors", bookmarkData ? "text-blue-500" : "text-muted-foreground hover:text-blue-500")}>
            <Bookmark size={18} className={bookmarkData ? "fill-current" : ""} />
            <span className="text-[11px] font-bold">{post.bookmarksCount || 0}</span>
          </motion.button>
        </CardFooter>
      </Card>

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="sm:max-w-[300px] text-center p-6">
          <DialogTitle className="text-md font-bold text-primary">دعم المحتوى المتميز</DialogTitle>
          <div className="grid grid-cols-3 gap-3 py-6">
            {[1, 5, 10].map((amt) => (
              <Button key={amt} variant="outline" className="h-12 flex flex-col gap-1 rounded-xl" onClick={() => handleSupport(amt)}>
                <span className="text-sm font-bold">{amt}</span>
                <TimgadCoin size={14} />
              </Button>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground">سيتم خصم المبلغ من رصيدك في المحفظة فوراً.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="sm:max-w-[600px] h-[100dvh] sm:h-[95vh] p-0 border-none bg-background gap-0 overflow-hidden flex flex-col [&>button]:hidden">
          <CommentsDialog postId={post.id} postAuthorId={post.authorId} post={post} onClose={() => setIsCommentsOpen(false)} currentUserProfile={currentUserProfile} />
        </DialogContent>
      </Dialog>
    </>
  );
}
