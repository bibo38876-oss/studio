
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, MessageSquareText, Heart, Coffee } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import TimgadCoin from '@/components/ui/TimgadCoin';
import { AadsUnitBanner } from '@/components/ads/AadsUnit';

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
    const c = text.trim(); setText('');
    addDocumentNonBlocking(collection(firestore, 'posts', postId, 'comments'), {
      authorId: user.uid, authorName: currentUserProfile?.username || 'مستخدم', authorAvatar: currentUserProfile?.profilePictureUrl || '', authorVerificationType: currentUserProfile?.verificationType || 'none', content: c, createdAt: serverTimestamp()
    });
    updateDocumentNonBlocking(doc(firestore, 'posts', postId), { commentsCount: increment(1) });
  };

  const handleSupport = (amt: number) => {
    if ((currentUserProfile?.coins || 0) < amt) return toast({ variant: "destructive", description: "رصيد غير كافٍ." });
    const fee = amt * 0.1, net = amt - fee;
    updateDocumentNonBlocking(doc(firestore!, 'users', user!.uid), { coins: increment(-amt) });
    updateDocumentNonBlocking(doc(firestore!, 'users', postAuthorId), { coins: increment(net) });
    addDocumentNonBlocking(collection(firestore!, 'platform_revenue'), { type: 'support_fee', amount: fee, fromUserId: user!.uid, toUserId: postAuthorId, createdAt: serverTimestamp() });
    toast({ title: "شكراً! ☕️", description: `تم إرسال ${net.toFixed(1)} عملة.` });
    setIsSupport(false);
  };

  return (
    <div className="flex flex-col h-full bg-background text-right">
      <div className="flex items-center gap-3 p-2 border-b h-10 bg-background/95 sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full"><ChevronRight size={20} /></Button>
        <span className="text-[11px] font-bold text-primary">النقاش التفاعلي</span>
      </div>
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 border-b bg-muted/5">
          <div className="flex gap-3 mb-4 justify-end">
            <div className="flex flex-col text-right"><div className="flex items-center gap-1 justify-end"><VerifiedBadge type={post.authorVerificationType || 'none'} size={14} /><span className="text-xs font-bold text-primary">{post.authorName}</span></div><span className="text-[10px] text-muted-foreground">{post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { locale: ar }) : 'الآن'}</span></div>
            <Avatar className="h-10 w-10 border border-primary/10"><AvatarImage src={post.authorAvatar} /><AvatarFallback>{post.authorName?.[0]}</AvatarFallback></Avatar>
          </div>
          <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap font-medium">{post.content}</p>
          <div className="flex items-center gap-6 border-t border-muted/10 pt-3">
            <div className="flex items-center gap-1.5 text-muted-foreground"><Heart size={18} /> <span className="text-[11px] font-bold">{post.likesCount || 0}</span></div>
            <div className="flex items-center gap-1.5 text-muted-foreground"><MessageSquareText size={18} /> <span className="text-[11px] font-bold">{post.commentsCount || 0}</span></div>
            <button onClick={() => setIsSupport(true)} className="flex items-center gap-1.5 text-amber-600 font-bold"><Coffee size={18} /><span className="text-[10px]">دعم</span></button>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {isLoading ? <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : comments?.map((c, i) => (
            <div key={c.id}>
              <div className="flex gap-3 justify-end group">
                <div className="flex-1 flex flex-col items-end">
                  <div className="bg-secondary/20 p-3 rounded-2xl rounded-tr-none text-right w-fit max-w-[90%]"><div className="flex justify-end gap-1.5 mb-1"><VerifiedBadge type={c.authorVerificationType || 'none'} size={10} /><span className="text-[10px] font-bold text-primary">{c.authorName}</span></div><p className="text-xs leading-relaxed">{c.content}</p></div>
                  <span className="text-[7px] text-muted-foreground mt-1 px-1">{c.createdAt?.toDate ? formatDistanceToNow(c.createdAt.toDate(), { locale: ar }) : 'الآن'}</span>
                </div>
                <Avatar className="h-8 w-8 border"><AvatarImage src={c.authorAvatar} /><AvatarFallback>{c.authorName?.[0]}</AvatarFallback></Avatar>
              </div>
              {(i + 1) % 5 === 0 && <div className="my-4"><AadsUnitBanner /></div>}
            </div>
          ))}
        </div>
      </div>
      <Dialog open={isSupport} onOpenChange={setIsSupport}><DialogContent className="sm:max-w-[300px] text-center p-6"><DialogTitle className="text-sm font-bold mb-4">دعم المبدع</DialogTitle><div className="grid grid-cols-2 gap-3">{[3, 7, 10, 20].map(a => <Button key={a} variant="outline" className="h-14 flex flex-col gap-1" onClick={() => handleSupport(a)}><span className="text-sm font-bold">{a}</span><TimgadCoin size={14} /></Button>)}</div></DialogContent></Dialog>
      <div className="p-3 border-t bg-background sticky bottom-0"><div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-10"><Input placeholder="أضف تعليقك..." className="flex-1 border-none bg-transparent text-xs text-right p-0" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} /><Button variant="ghost" size="icon" onClick={handleAdd} disabled={!text.trim()} className="text-primary"><Send size={16} /></Button></div></div>
    </div>
  );
}
