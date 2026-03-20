
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, useDoc, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

export default function ChatPage() {
  const params = useParams();
  const targetUserId = params?.id as string;
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const targetUserRef = useMemoFirebase(() => {
    if (!firestore || !targetUserId) return null;
    return doc(firestore, 'users', targetUserId);
  }, [firestore, targetUserId]);

  const { data: targetUser, isLoading: isUserLoading } = useDoc(targetUserRef);

  // توليد معرف فريد للمحادثة بين الطرفين (Chat ID)
  const chatId = user && targetUserId 
    ? [user.uid, targetUserId].sort().join('_') 
    : null;

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(
      collection(firestore, 'direct_chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
  }, [firestore, chatId]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!user || !firestore || !chatId || !message.trim()) return;

    const content = message.trim();
    setMessage('');

    addDocumentNonBlocking(collection(firestore, 'direct_chats', chatId, 'messages'), {
      content,
      senderId: user.uid,
      senderName: user.displayName || 'مستكشف تيمقاد',
      createdAt: serverTimestamp(),
    });
  };

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b p-2 h-12 flex items-center justify-between container max-w-xl mx-auto">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
            <ChevronRight size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={targetUser?.profilePictureUrl} />
              <AvatarFallback>{targetUser?.username?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1 leading-tight">
                <VerifiedBadge type={targetUser?.verificationType || 'none'} size={12} />
                <span className="text-xs font-bold text-primary">{targetUser?.username}</span>
              </div>
              <span className="text-[8px] text-green-600 font-bold">نشط الآن</span>
            </div>
          </div>
        </div>
        <ShieldCheck size={18} className="text-primary/20" />
      </div>

      <main className="flex-1 overflow-y-auto pt-16 pb-20 px-4 container max-w-xl mx-auto flex flex-col gap-4 scroll-smooth" ref={scrollRef}>
        {isMessagesLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg: any) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={`flex gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse self-end' : 'flex-row self-start'} animate-in fade-in duration-300`}>
                <div className={`px-4 py-2 text-xs leading-relaxed shadow-sm break-words ${isMe ? 'bg-primary text-white rounded-l-2xl rounded-tr-2xl' : 'bg-secondary/50 border text-foreground rounded-r-2xl rounded-tl-2xl'}`}>
                  {msg.content}
                </div>
                <span className="text-[7px] text-muted-foreground mt-auto mb-1 opacity-50">
                  {msg.createdAt?.toDate ? formatDistanceToNow(msg.createdAt.toDate(), { locale: ar }) : 'الآن'}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 opacity-40">
            <p className="text-[10px] font-bold">المحادثة مشفرة تماماً. ابدأ الدردشة الآن!</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t p-2 container max-w-xl mx-auto h-12">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-full">
          <Input 
            placeholder="اكتب رسالتك..." 
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs h-full p-0"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("h-8 w-8 rounded-full transition-colors", message.trim() ? "text-primary" : "text-muted-foreground")}
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
