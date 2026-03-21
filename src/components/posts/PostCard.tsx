
"use client"

import { useState, useEffect, useRef, useMemo } from 'react';
import { Heart, MessageCircle, Bookmark, BarChart3, MoreHorizontal, Trash2, AlertTriangle, Rocket, Coffee } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, increment, serverTimestamp, arrayUnion } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import CommentsDialog from "./CommentsDialog";
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function PostCard({ post, currentUserProfile }: any) {
  const { user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const viewed = useRef(false);
  
  const isOwner = user?.uid === post.authorId;
  const isAdmin = user?.email === 'adelbenmaza8@gmail.com';

  const authorRef = useMemoFirebase(() => (firestore && post.authorId) ? doc(firestore, 'users', post.authorId) : null, [firestore, post.authorId]);
  const { data: author } = useDoc(authorRef);

  const likeRef = useMemoFirebase(() => (firestore && user?.uid) ? doc(firestore, 'posts', post.id, 'likes', user.uid) : null, [firestore, post.id, user?.uid]);
  const { data: liked } = useDoc(likeRef);

  const bookmarkRef = useMemoFirebase(() => (firestore && user?.uid) ? doc(firestore, 'users', user.uid, 'bookmarks', post.id) : null, [firestore, post.id, user?.uid]);
  const { data: bookmarked } = useDoc(bookmarkRef);

  useEffect(() => {
    if (!firestore || !post.id || viewed.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !viewed.current) {
        viewed.current = true;
        updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { viewsCount: increment(1) });
      }
    }, { threshold: 0.1 });
    if (cardRef.current) obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, [firestore, post.id]);

  const handleSupport = (amt: number) => {
    if (!user || user.isAnonymous) return router.push('/login');
    if ((currentUserProfile?.coins || 0) < amt) return toast({ variant: "destructive", description: "رصيد غير كافٍ." });
    
    const fee = amt * 0.1, net = amt - fee;
    updateDocumentNonBlocking(doc(firestore!, 'users', user.uid), { coins: increment(-amt) });
    updateDocumentNonBlocking(doc(firestore!, 'users', post.authorId), { coins: increment(net) });
    addDocumentNonBlocking(collection(firestore!, 'platform_revenue'), { type: 'support_fee', amount: fee, fromUserId: user.uid, toUserId: post.authorId, createdAt: serverTimestamp() });
    setDocumentNonBlocking(doc(firestore!, 'users', post.authorId, 'supporters', user.uid), { userId: user.uid, username: currentUserProfile.username, avatar: currentUserProfile.profilePictureUrl, totalAmount: increment(amt), lastSupportedAt: serverTimestamp() }, { merge: true });
    addDocumentNonBlocking(collection(firestore!, 'users', post.authorId, 'notifications'), { type: 'support', fromUserId: user.uid, fromUsername: currentUserProfile.username, amount: net, postId: post.id, createdAt: serverTimestamp(), read: false });
    
    toast({ title: "تم الدعم! ☕️", description: `أرسلت ${net.toFixed(1)} عملة.` });
    setIsSupportOpen(false);
  };

  const content = useMemo(() => {
    const text = expanded || post.content.length <= 180 ? post.content : post.content.slice(0, 180) + "...";
    return text.split(/(#[^\s#]+)/g).map((p: string, i: number) => p.startsWith('#') ? <span key={i} className="text-accent font-bold">{p}</span> : p);
  }, [post.content, expanded]);

  return (
    <>
      <Card ref={cardRef} className={cn("border-none shadow-none rounded-none bg-card border-b-[0.5px] border-muted/10 hover:bg-muted/5 transition-all cursor-pointer", post.promoted && "bg-primary/5")} onClick={() => setIsCommentsOpen(true)}>
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-1">
            {post.promoted && <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-1 ml-2"><Rocket size={10} /> مروج</div>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end"><DropdownMenuItem className="text-xs" onClick={() => updateDocumentNonBlocking(doc(firestore!, 'posts', post.id), { reportsCount: increment(1) })}><AlertTriangle size={14} /> إبلاغ</DropdownMenuItem>{(isOwner || isAdmin) && <DropdownMenuItem className="text-xs text-destructive" onClick={() => deleteDocumentNonBlocking(doc(firestore!, 'posts', post.id))}><Trash2 size={14} /> حذف</DropdownMenuItem>}</DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Link href={`/profile/${post.authorId}`} className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
            <div className="text-right"><div className="flex items-center gap-1 justify-end"><VerifiedBadge type={author?.verificationType || 'none'} size={14} /><span className="text-xs font-bold text-primary">{author?.username || post.authorName}</span></div><span className="text-[9px] text-muted-foreground">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { locale: ar }) : 'الآن'}</span></div>
            <Avatar className="h-10 w-10 border border-primary/10"><AvatarImage src={author?.profilePictureUrl || post.authorAvatar} /><AvatarFallback>{(author?.username || post.authorName)?.[0]}</AvatarFallback></Avatar>
          </Link>
        </CardHeader>
        <CardContent className="px-4 py-1 text-right">
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{content}</div>
          {post.content.length > 180 && <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }} className="text-accent text-[10px] font-bold mt-1">{expanded ? "عرض أقل" : "إقرأ المزيد"}</button>}
          {post.mediaUrls?.length > 0 && (
            <div className="mt-3 relative" onClick={e => e.stopPropagation()}>
              <Carousel className="w-full" opts={{ direction: 'rtl' }}>
                <CarouselContent>{post.mediaUrls.map((u: string, i: number) => <CarouselItem key={i}><div className="rounded-xl overflow-hidden border aspect-square relative"><img src={u} className="absolute inset-0 w-full h-full object-cover" /></div></CarouselItem>)}</CarouselContent>
                {post.mediaUrls.length > 1 && <><CarouselPrevious className="right-2 h-8 w-8" /><CarouselNext className="left-2 h-8 w-8" /></>}
              </Carousel>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 py-3 border-t border-muted/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={e => { e.stopPropagation(); if(liked) deleteDocumentNonBlocking(likeRef!); else setDocumentNonBlocking(likeRef!, {createdAt: serverTimestamp()}, {merge:true}); updateDocumentNonBlocking(doc(firestore!, 'posts', post.id), {likesCount: increment(liked?-1:1)}); }} className={cn("flex items-center gap-1.5", liked ? "text-red-500" : "text-muted-foreground")}><Heart size={18} className={liked?"fill-current":""} /><span className="text-[11px] font-bold">{post.likesCount || 0}</span></button>
            <div className="flex items-center gap-1.5 text-muted-foreground"><MessageCircle size={18} /><span className="text-[11px] font-bold">{post.commentsCount || 0}</span></div>
            <button onClick={e => { e.stopPropagation(); setIsSupportOpen(true); }} className="flex items-center gap-1.5 text-amber-600 font-bold"><Coffee size={18} /><span className="text-[10px]">دعم</span></button>
            <div className="flex items-center gap-1.5 text-muted-foreground"><BarChart3 size={18} /><span className="text-[11px] font-bold">{post.viewsCount || 0}</span></div>
          </div>
          <button onClick={e => { e.stopPropagation(); if(bookmarked) deleteDocumentNonBlocking(bookmarkRef!); else setDocumentNonBlocking(bookmarkRef!, {...post, createdAt: serverTimestamp()}, {merge:true}); updateDocumentNonBlocking(doc(firestore!, 'posts', post.id), {bookmarksCount: increment(bookmarked?-1:1)}); }} className={cn(bookmarked?"text-blue-500":"text-muted-foreground")}><Bookmark size={18} className={bookmarked?"fill-current":""} /></button>
        </CardFooter>
      </Card>

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="sm:max-w-[300px] text-center p-6"><DialogTitle className="text-sm font-bold text-primary mb-4">دعم المبدع</DialogTitle><div className="grid grid-cols-2 gap-3">{[3, 7, 10, 20].map(a => <Button key={a} variant="outline" className="h-14 flex flex-col gap-1" onClick={() => handleSupport(a)}><span className="text-sm font-bold">{a}</span><TimgadCoin size={14} /></Button>)}</div><p className="text-[9px] text-muted-foreground mt-4 italic">عمولة المنصة 10%.</p></DialogContent>
      </Dialog>
      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}><DialogContent className="sm:max-w-[600px] h-[100dvh] sm:h-[90vh] p-0 border-none flex flex-col [&>button]:hidden"><DialogTitle className="sr-only">تعليقات</DialogTitle><CommentsDialog post={post} postId={post.id} postAuthorId={post.authorId} currentUserProfile={currentUserProfile} onClose={() => setIsCommentsOpen(false)} /></DialogContent></Dialog>
    </>
  );
}
