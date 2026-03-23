
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, MessageSquareText, Heart, Coffee } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import TimgadCoin from '@/components/ui/TimgadCoin';
import { HighPerformanceAd } from '@/components/ads/AadsUnit';

export default function CommentsDialog({ postId, postAuthorId, post, onClose, currentUserProfile }: any) {
  const [text, setText] = useState('');
  const [isSupport, setIsSupport] = useState(false);
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const commentsQuery = useMemoFirebase(() => (firestore && postId) ? query(collection(firestore, 'posts', postId, 'comments'), orderBy('createdAt', 'asc')) : null, [firestore, postId]);
  const { data: comments, isLoading } = useCollection(commentsQuery);

  const handleAdd = () => {
    if (!user || user.isAnonymous) return router.push('/login');
    if (!text.trim() || !firestore) return;
    const c = text.trim(); 
    setText('');
    addDocumentNonBlocking(collection(firestore, 'posts', postId, 'comments'), {
      authorId: user.uid, 
      authorName: currentUserProfile?.username || 'مستخدم', 
      authorAvatar: currentUserProfile?.profilePictureUrl || '', 
      authorVerificationType: currentUserProfile?.verificationType || 'none', 
      content: c, 
      createdAt: serverTimestamp()
    });
    updateDocumentNonBlocking(doc(firestore, 'posts', postId), { commentsCount: increment(1) });
  };

  const handleSupport = (amt: number) => {
    if ((currentUserProfile?.coins || 0) < amt) return toast({ variant: "destructive", description: "رصيد غير كافٍ." });
    const fee = amt * 0.1, net = amt - fee;
    updateDocumentNonBlocking(doc(firestore!, 'users', user!.uid), { coins: increment(-amt) });
    updateDocumentNonBlocking(doc(firestore!, 'users', postAuthorId), { coins: increment(net) });
    addDocumentNonBlocking(collection(firestore!, 'platform_revenue'), { type: 'support_fee', amount: fee, fromUserId: user!.uid, toUserId: postAuthorId, createdAt: serverTimestamp() });
    toast({ title: "شكراً! ☕️", description: `تم إرسال ${net.toFixed(1)} عملة للمبدع.` });
    setIsSupport(false);
  };

  return (
    <div className="flex flex-col h-full bg-background text-right relative overflow-hidden">
      <div className="flex items-center gap-3 p-2 border-b h-12 bg-background/95 sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full"><ChevronRight size={24} /></Button>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-primary">النقاش التفاعلي</span>
          <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Timgad Debate</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        <div className="p-4 border-b bg-primary/[0.02]">
          <div className="flex gap-3 mb-4 justify-end">
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1 justify-end">
                <VerifiedBadge type={post.authorVerificationType || 'none'} size={14} />
                <span className="text-xs font-bold text-primary">{post.authorName}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
            </div>
            <Avatar className="h-10 w-10 border border-primary/10"><AvatarImage src={post.authorAvatar} /><AvatarFallback>{post.authorName?.[0]}</AvatarFallback></Avatar>
          </div>
          <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap font-medium">{post.content}</p>
          <div className="flex items-center gap-6 border-t border-muted/10 pt-3">
            <div className="flex items-center gap-1.5 text-muted-foreground"><Heart size={18} /> <span className="text-[11px] font-bold">{post.likesCount || 0}</span></div>
            <div className="flex items-center gap-1.5 text-muted-foreground"><MessageSquareText size={18} /> <span className="text-[11px] font-bold">{post.commentsCount || 0}</span></div>
            <button onClick={() => setIsSupport(true)} className="flex items-center gap-1.5 text-amber-600 font-bold hover:scale-105 transition-transform"><Coffee size={18} /><span className="text-[10px]">دعم المبدع</span></button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : comments && comments.length > 0 ? (
            comments.map((c, i) => (
              <div key={c.id}>
                <div className="flex gap-3 justify-end group">
                  <div className="flex-1 flex flex-col items-end">
                    <div className="bg-secondary/30 p-3 rounded-2xl rounded-tr-none text-right w-fit max-w-[90%] shadow-sm">
                      <div className="flex justify-end gap-1.5 mb-1">
                        <VerifiedBadge type={c.authorVerificationType || 'none'} size={10} />
                        <span className="text-[10px] font-bold text-primary">{c.authorName}</span>
                      </div>
                      <p className="text-xs leading-relaxed">{c.content}</p>
                    </div>
                    <span className="text-[7px] text-muted-foreground mt-1 px-1">{c.createdAt?.toDate ? formatDistanceToNow(c.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
                  </div>
                  <Avatar className="h-8 w-8 border shadow-sm"><AvatarImage src={c.authorAvatar} /><AvatarFallback>{c.authorName?.[0]}</AvatarFallback></Avatar>
                </div>
                {/* إعلان الأداء العالي كل 5 تعليقات */}
                {(i + 1) % 5 === 0 && <HighPerformanceAd />}
              </div>
            ))
          ) : (
            <div className="text-center py-20 opacity-30 flex flex-col items-center gap-2">
              <MessageSquareText size={32} />
              <p className="text-[10px] font-bold">كن أول من يشارك في هذا النقاش الراقي!</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isSupport} onOpenChange={setIsSupport}>
        <DialogContent className="sm:max-w-[300px] text-center p-6 border-amber-200">
          <DialogTitle className="text-sm font-bold text-amber-700 mb-4 flex items-center justify-center gap-2">
            <Coffee size={18} /> دعم المبدع تيمقاد
          </DialogTitle>
          <div className="grid grid-cols-2 gap-3">
            {[3, 7, 10, 20].map(a => (
              <Button key={a} variant="outline" className="h-14 flex flex-col gap-1 border-amber-100 hover:bg-amber-50" onClick={() => handleSupport(a)}>
                <span className="text-sm font-bold">{a}</span>
                <TimgadCoin size={14} />
              </Button>
            ))}
          </div>
          <p className="text-[8px] text-muted-foreground mt-4 italic">تقتطع المنصة 10% كرسوم صيانة تقنية.</p>
        </DialogContent>
      </Dialog>

      {/* شريط الإدخال الثابت المصلح */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-background/95 backdrop-blur-md z-[60] pb-[env(safe-area-inset-bottom)]">
        <div className="flex gap-2 items-center bg-secondary/60 rounded-full px-4 h-11 border border-primary/5 focus-within:border-primary/20 transition-all">
          <Input 
            placeholder="اكتب تعليقك الراقي..." 
            className="flex-1 border-none bg-transparent text-xs text-right p-0 focus-visible:ring-0 placeholder:text-muted-foreground/50" 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAdd()} 
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleAdd} 
            disabled={!text.trim()} 
            className={cn("transition-all duration-300", text.trim() ? "text-primary scale-110" : "text-muted-foreground opacity-40")}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
