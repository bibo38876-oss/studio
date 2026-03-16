
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, useDoc, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function GroupChatPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const groupRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'groups', id);
  }, [firestore, id]);

  const { data: group, isLoading: isGroupLoading } = useDoc(groupRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'groups', id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [firestore, id]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  // تحسين التمرير التلقائي ليكون سلساً
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!user || user.isAnonymous) {
      router.push('/login');
      return;
    }
    if (!message.trim() || !firestore || !id) return;

    const content = message.trim();
    setMessage(''); // مسح المدخل فوراً لتحسين الاستجابة (Optimistic feel)

    addDocumentNonBlocking(collection(firestore, 'groups', id, 'messages'), {
      content: content,
      senderId: user.uid,
      senderName: user.displayName || 'مستخدم تواصل',
      createdAt: serverTimestamp(),
    });
  };

  if (isGroupLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Group Header - فائق النحافة */}
      <div className="fixed top-7 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b flex items-center gap-3 p-2 h-10 container max-w-xl mx-auto">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 rounded-full">
          <ChevronRight size={20} />
        </Button>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="h-7 w-7 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
            <Users size={14} />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-[11px] font-bold text-primary leading-tight truncate">{group?.name}</span>
            <span className="text-[8px] text-muted-foreground">دردشة جماعية</span>
          </div>
        </div>
      </div>

      {/* Chat Area - مع تحسين المسافات */}
      <main 
        className="flex-1 overflow-y-auto pt-20 pb-20 px-4 container max-w-xl mx-auto flex flex-col gap-3 scroll-smooth" 
        ref={scrollRef}
      >
        {isMessagesLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg: any) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] ${isMe ? 'self-end' : 'self-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
              >
                {!isMe && <span className="text-[8px] text-muted-foreground mb-0.5 ml-1">{msg.senderName}</span>}
                <div className={`px-4 py-2 text-xs leading-relaxed shadow-sm ${isMe ? 'bg-primary text-white rounded-l-xl rounded-tr-xl' : 'bg-card border text-foreground rounded-r-xl rounded-tl-xl'}`}>
                  {msg.content}
                </div>
                <span className="text-[7px] text-muted-foreground mt-1 px-1">
                  {msg.createdAt?.toDate ? formatDistanceToNow(msg.createdAt.toDate(), { locale: ar }) : 'الآن'}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <p className="text-[10px] text-muted-foreground font-medium">ابدأ الدردشة في هذه المجموعة!</p>
          </div>
        )}
      </main>

      {/* Message Input - ثابت وأنيق */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t p-2 container max-w-xl mx-auto h-12">
        <div className="flex gap-2 items-center bg-secondary/50 rounded-full px-4 h-full group focus-within:bg-secondary transition-colors">
          <Input 
            placeholder="اكتب رسالة..." 
            className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs h-full placeholder:text-muted-foreground/50"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className={`h-8 w-8 rounded-full transition-all duration-300 ${message.trim() ? 'text-primary scale-110' : 'text-muted-foreground opacity-50'}`}
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
