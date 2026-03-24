
"use client"

import { useState, useEffect, useRef, useMemo } from 'react';
import { Heart, MessageCircle, Bookmark, BarChart3, MoreHorizontal, Trash2, AlertTriangle, Rocket, Coffee, ExternalLink, TrendingUp, ShieldCheck, Loader2, CheckCircle2, Coins } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useFirebase, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, increment, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CommentsDialog from "./CommentsDialog";
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import TimgadCoin from '@/components/ui/TimgadCoin';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { motion, AnimatePresence } from 'framer-motion';

export default function PostCard({ post, currentUserProfile }: any) {
  const { user, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isBoostOpen, setIsBoostOpen] = useState(false);
  const [isAdRewardOpen, setIsAdRewardOpen] = useState(false);
  const [rewardTimer, setRewardTimer] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captcha, setCaptcha] = useState({ q: '', a: 0 });
  const [answer, setAnswer] = useState('');
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

  const adRewardRef = useMemoFirebase(() => (firestore && user?.uid && post.isAdPost) ? doc(firestore, 'posts', post.id, 'adClicks', user.uid) : null, [firestore, post.id, user?.uid, post.isAdPost]);
  const { data: alreadyRewarded } = useDoc(adRewardRef);

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
    if (!firestore || !currentUserProfile) return;
    if ((currentUserProfile?.coins || 0) < amt) return toast({ variant: "destructive", description: "رصيد غير كافٍ." });
    
    const fee = amt * 0.1, net = amt - fee;
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { coins: increment(-amt) });
    updateDocumentNonBlocking(doc(firestore, 'users', post.authorId), { coins: increment(net) });
    addDocumentNonBlocking(collection(firestore, 'platform_revenue'), { type: 'support_fee', amount: fee, fromUserId: user.uid, toUserId: post.authorId, createdAt: serverTimestamp() });
    setDocumentNonBlocking(doc(firestore, 'users', post.authorId, 'supporters', user.uid), { userId: user.uid, username: currentUserProfile.username, avatar: currentUserProfile.profilePictureUrl || '', totalAmount: increment(amt), lastSupportedAt: serverTimestamp() }, { merge: true });
    addDocumentNonBlocking(collection(firestore, 'users', post.authorId, 'notifications'), { type: 'support', fromUserId: user.uid, fromUsername: currentUserProfile.username, amount: net, postId: post.id, createdAt: serverTimestamp(), read: false });
    toast({ title: "تم الدعم! ☕️", description: `أرسلت ${net.toFixed(1)} عملة.` });
    setIsSupportOpen(false);
  };

  const handleBoost = (amt: number, factor: number) => {
    if (!firestore || !user) return;
    if ((currentUserProfile?.coins || 0) < amt) return toast({ variant: "destructive", description: "رصيدك غير كافٍ للترويج." });
    
    updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { coins: increment(-amt) });
    updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { promoted: true, boostFactor: factor });
    addDocumentNonBlocking(collection(firestore, 'platform_revenue'), { type: 'post_promotion', amount: amt, fromUserId: user.uid, createdAt: serverTimestamp() });
    toast({ title: "تم تعزيز المنشور! 🚀", description: `الآن سيظهر منشورك لشريحة أكبر من المستخدمين.` });
    setIsBoostOpen(false);
  };

  const handleVisitAd = () => {
    if (alreadyRewarded) return window.open(post.adLink, '_blank');
    window.open(post.adLink, '_blank');
    setIsAdRewardOpen(true);
    setRewardTimer(7);
    const interval = setInterval(() => {
      setRewardTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          const n1 = Math.floor(Math.random() * 9) + 1, n2 = Math.floor(Math.random() * 9) + 1;
          setCaptcha({ q: `${n1} + ${n2}`, a: n1 + n2 });
          setShowCaptcha(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const verifyAdCaptcha = () => {
    if (!firestore || !user || !adRewardRef) return;
    if (parseInt(answer) === captcha.a) {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { coins: increment(0.7) });
      updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { remainingAdBudget: increment(-0.7) });
      setDocumentNonBlocking(adRewardRef, { clickedAt: serverTimestamp() }, { merge: true });
      toast({ title: "تمت إضافة المكافأة! 💰", description: "حصلت على 0.7 عملة لزيارة الموقع الممول." });
      setIsAdRewardOpen(false);
      setShowCaptcha(false);
    } else {
      toast({ variant: "destructive", description: "إجابة خاطئة." });
    }
  };

  const content = useMemo(() => {
    const text = expanded || post.content.length <= 180 ? post.content : post.content.slice(0, 180) + "...";
    return text.split(/(#[^\s#]+)/g).map((p: string, i: number) => p.startsWith('#') ? <span key={i} className="text-accent font-bold">{p}</span> : p);
  }, [post.content, expanded]);

  return (
    <>
      <Card ref={cardRef} className={cn("border-none shadow-none rounded-none bg-card border-b-[0.5px] border-muted/10 hover:bg-muted/5 transition-all cursor-pointer", post.promoted && "bg-primary/[0.03] border-r-2 border-r-accent")} onClick={() => setIsCommentsOpen(true)}>
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-1">
            {post.isAdPost && <div className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-1 ml-2"><ShieldCheck size={10} /> ممول</div>}
            {post.promoted && !post.isAdPost && <div className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[8px] font-bold flex items-center gap-1 ml-2"><Rocket size={10} /> مروج</div>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <DropdownMenuItem className="text-xs gap-2 font-bold text-accent" onClick={(e) => { e.stopPropagation(); setIsBoostOpen(true); }}>
                    <TrendingUp size={14} /> ترويج المنشور
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-xs" onClick={(e) => { e.stopPropagation(); if(firestore) updateDocumentNonBlocking(doc(firestore, 'posts', post.id), { reportsCount: increment(1) }); }}>
                  <AlertTriangle size={14} /> إبلاغ
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(isOwner || isAdmin) && (
                  <DropdownMenuItem className="text-xs text-destructive" onClick={(e) => { e.stopPropagation(); if(firestore) deleteDocumentNonBlocking(doc(firestore, 'posts', post.id)); }}>
                    <Trash2 size={14} /> حذف
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
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
          
          {post.isAdPost && (
            <div className="mt-4 p-3 bg-accent/5 border border-accent/10 rounded-xl flex items-center justify-between" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-accent rounded-full flex items-center justify-center text-white shadow-lg shadow-accent/20"><ExternalLink size={18} /></div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-accent">رابط المعلن المعتمد</span>
                  <span className="text-[8px] text-muted-foreground italic">اضغط للزيارة وتحصيل المكافأة</span>
                </div>
              </div>
              <Button size="sm" className="h-8 rounded-full bg-accent hover:bg-accent/90 text-white font-bold text-[10px] gap-2" onClick={handleVisitAd}>
                {alreadyRewarded ? "زيارة الموقع" : "زيارة واربح (0.7)"}
              </Button>
            </div>
          )}

          {post.mediaUrls?.length > 0 && (
            <div className="mt-3 relative" onClick={e => e.stopPropagation()}>
              <Carousel className="w-full" opts={{ direction: 'rtl', align: 'start' }}>
                <CarouselContent className="-mr-1">
                  {post.mediaUrls.map((u: string, i: number) => (
                    <CarouselItem key={i} className="pr-1">
                      <div className="rounded-xl overflow-hidden border aspect-square relative shadow-sm bg-muted/20">
                        <img src={u} className="absolute inset-0 w-full h-full object-cover" alt={`Post image ${i + 1}`} loading="lazy" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {post.mediaUrls.length > 1 && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-2">
                    <CarouselPrevious className="pointer-events-auto h-8 w-8 rounded-full bg-black/20 text-white border-none backdrop-blur-md static translate-y-0" />
                    <CarouselNext className="pointer-events-auto h-8 w-8 rounded-full bg-black/20 text-white border-none backdrop-blur-md static translate-y-0" />
                  </div>
                )}
              </Carousel>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 py-3 border-t border-muted/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={e => { e.stopPropagation(); if(!firestore || !user) return; if(liked) deleteDocumentNonBlocking(likeRef!); else setDocumentNonBlocking(likeRef!, {createdAt: serverTimestamp()}, {merge:true}); updateDocumentNonBlocking(doc(firestore, 'posts', post.id), {likesCount: increment(liked?-1:1)}); }} className={cn("flex items-center gap-1.5", liked ? "text-red-500" : "text-muted-foreground")}><Heart size={18} className={liked?"fill-current":""} /><span className="text-[11px] font-bold">{post.likesCount || 0}</span></button>
            <div className="flex items-center gap-1.5 text-muted-foreground"><MessageCircle size={18} /><span className="text-[11px] font-bold">{post.commentsCount || 0}</span></div>
            <button onClick={e => { e.stopPropagation(); setIsSupportOpen(true); }} className="flex items-center gap-1.5 text-amber-600 font-bold"><Coffee size={18} /><span className="text-[10px]">دعم</span></button>
            <div className="flex items-center gap-1.5 text-muted-foreground"><BarChart3 size={18} /><span className="text-[11px] font-bold">{post.viewsCount || 0}</span></div>
          </div>
          <button onClick={e => { e.stopPropagation(); if(!firestore || !user) return; if(bookmarked) deleteDocumentNonBlocking(bookmarkRef!); else setDocumentNonBlocking(bookmarkRef!, {...post, createdAt: serverTimestamp()}, {merge:true}); updateDocumentNonBlocking(doc(firestore, 'posts', post.id), {bookmarksCount: increment(bookmarked?-1:1)}); }} className={cn(bookmarked?"text-blue-500":"text-muted-foreground")}><Bookmark size={18} className={bookmarked?"fill-current":""} /></button>
        </CardFooter>
      </Card>

      <Dialog open={isBoostOpen} onOpenChange={setIsBoostOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 text-right">
          <DialogHeader><DialogTitle className="text-lg font-bold flex items-center gap-2 justify-end text-primary"><TrendingUp size={20} /> ترويج المنشور في تيمقاد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground">اختر الباقة المناسبة لزيادة فرصة ظهور منشورك في قسم "لك" لجميع المستخدمين.</p>
            <div className="grid gap-3">
              {[
                { amt: 15, f: 1.1, label: "باقة البرونز", desc: "تعزيز 10% للظهور" },
                { amt: 30, f: 1.5, label: "باقة الفضة", desc: "تعزيز 50% للظهور" },
                { amt: 100, f: 2.0, label: "باقة الذهب", desc: "مضاعفة الظهور (100%)" }
              ].map(b => (
                <button key={b.amt} className="flex items-center justify-between p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-right" onClick={() => handleBoost(b.amt, b.f)}>
                  <div className="flex flex-col"><span className="text-sm font-bold text-primary">{b.label}</span><span className="text-[10px] text-muted-foreground">{b.desc}</span></div>
                  <div className="flex items-center gap-1.5 font-bold text-primary"><span>{b.amt}</span><TimgadCoin size={16} /></div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAdRewardOpen} onOpenChange={setIsAdRewardOpen}>
        <DialogContent className="sm:max-w-[350px] text-center p-8 bg-background border-accent/30 rounded-2xl">
          <AnimatePresence mode="wait">
            {!showCaptcha ? (
              <motion.div key="timer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto text-accent border-2 border-accent/20">
                  <span className="text-3xl font-mono font-bold">{rewardTimer}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-md font-bold text-primary">جاري التحقق من الزيارة...</h3>
                  <p className="text-xs text-muted-foreground">ابقَ في الموقع لمدة 7 ثوانٍ لضمان احتساب المكافأة.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="captcha" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-center gap-2 text-accent">
                  <ShieldCheck size={24} />
                  <h3 className="text-md font-bold">أثبت أنك إنسان</h3>
                </div>
                <p className="text-4xl font-mono font-bold text-primary tracking-widest">{captcha.q} = ؟</p>
                <div className="flex gap-2 max-w-[200px] mx-auto">
                  <Input type="number" className="text-center font-bold text-xl h-12 bg-secondary/50 border-none" value={answer} onChange={e => setAnswer(e.target.value)} />
                  <Button onClick={verifyAdCaptcha} className="bg-accent hover:bg-accent/90 text-white font-bold h-12 px-6">تحقق</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="sm:max-w-[300px] text-center p-6"><DialogTitle className="text-sm font-bold text-primary mb-4">دعم المبدع</DialogTitle><div className="grid grid-cols-2 gap-3">{[3, 7, 10, 20].map(a => <Button key={a} variant="outline" className="h-14 flex flex-col gap-1" onClick={() => handleSupport(a)}><span className="text-sm font-bold">{a}</span><TimgadCoin size={14} /></Button>)}</div><p className="text-[8px] text-muted-foreground mt-4 italic">عمولة المنصة 10%.</p></DialogContent>
      </Dialog>
      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}><DialogContent className="sm:max-w-[600px] h-[100dvh] sm:h-[90vh] p-0 border-none flex flex-col [&>button]:hidden"><DialogTitle className="sr-only">تعليقات</DialogTitle><CommentsDialog post={post} postId={post.id} postAuthorId={post.authorId} currentUserProfile={currentUserProfile} onClose={() => setIsCommentsOpen(false)} /></DialogContent></Dialog>
    </>
  );
}
