
"use client"

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, limit, serverTimestamp, doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, ChevronRight, ShieldCheck, ImageIcon, CheckCircle2, Wallet } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import TimgadLogo from '@/components/ui/Logo';

function SupportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialPackage = searchParams.get('package');
  const initialAmount = searchParams.get('amount');
  const initialPrice = searchParams.get('price');

  const WALLET_ADDRESS = "dgb1q7wzxlvnuv8py8vxpy8vxpy8vxpy8vxpy8vxp"; // عنوان محفظة DGB تجريبي

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'support_chats', user.uid, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );
  }, [firestore, user?.uid]);

  const { data: messages, isLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (initialPackage && user && messages && messages.length === 0) {
      handleSendMessage(`أريد شراء باقة: ${initialPackage} (${initialAmount} عملة ذهبية) بسعر ${initialPrice}`);
    }
  }, [initialPackage, user, messages]);

  const handleSendMessage = async (text: string, mediaUrl: string | null = null, isAuto = false) => {
    if (!user || !firestore) return;
    const content = text.trim();
    if (!content && !mediaUrl) return;

    addDocumentNonBlocking(collection(firestore, 'support_chats', user.uid, 'messages'), {
      content,
      mediaUrl,
      senderId: user.uid,
      senderName: user.displayName || 'مستكشف تيمقاد',
      senderAvatar: user.photoURL || '',
      isAdmin: false,
      createdAt: serverTimestamp(),
    });

    if (!isAuto && (content.includes('شراء') || content.includes('باقة'))) {
      setTimeout(() => {
        addDocumentNonBlocking(collection(firestore, 'support_chats', user.uid, 'messages'), {
          content: `أهلاً بك! لإتمام العملية، يرجى تحويل مبلغ DGB إلى العنوان التالي عبر فاست باي:\n\n${WALLET_ADDRESS}\n\nبعد التحويل، ارفع صورة الوصل هنا.`,
          senderId: 'admin_system',
          senderName: 'إدارة تيمقاد',
          senderAvatar: '',
          isAdmin: true,
          createdAt: serverTimestamp(),
        });
      }, 1500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      handleSendMessage('لقد قمت برفع إثبات الدفع.', url);
      toast({ description: "تم رفع إثبات الدفع بنجاح." });
    } catch (error) {
      toast({ variant: "destructive", description: "فشل رفع الصورة." });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDirectPay = () => {
    window.location.href = `digibyte:${WALLET_ADDRESS}?amount=${initialPrice?.split(' ')[0] || 0}`;
    toast({ description: "جاري محاولة فتح تطبيق المحفظة..." });
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-primary p-2 h-12 flex items-center justify-between w-full max-w-[500px] shadow-lg">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white hover:bg-white/10 rounded-full h-8 w-8">
            <ChevronRight size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
              <TimgadLogo size={18} variant="white" />
            </div>
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-tight">مركز دعم تيمقاد</span>
              <span className="text-[8px] text-white/70 font-bold uppercase tracking-widest leading-none">الإدارة الرقمية</span>
            </div>
          </div>
        </div>
        {initialPackage && (
          <Button variant="outline" size="sm" className="h-7 text-[9px] bg-white/10 border-white/20 text-white hover:bg-white/20 gap-1.5" onClick={handleDirectPay}>
            <Wallet size={12} />
            دفع سريع
          </Button>
        )}
      </div>

      <main className="flex-1 overflow-y-auto pt-16 pb-20 px-4 container max-w-[500px] mx-auto flex flex-col gap-4 scroll-smooth" ref={scrollRef}>
        {messages && messages.length > 0 ? (
          messages.map((msg: any) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={`flex gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse self-end' : 'flex-row self-start'} animate-in fade-in duration-300`}>
                {!isMe && (
                  <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 border border-primary/20">
                    <TimgadLogo size={14} className="text-primary" />
                  </div>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[8px] font-bold text-primary mb-1 ml-1">الدعم الفني</span>}
                  <div className={`px-4 py-2 text-xs leading-relaxed shadow-sm break-words whitespace-pre-wrap ${isMe ? 'bg-primary text-white rounded-l-2xl rounded-tr-2xl' : 'bg-secondary/50 border text-foreground rounded-r-2xl rounded-tl-2xl'}`}>
                    {msg.content}
                    {msg.mediaUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border bg-black/5">
                        <img src={msg.mediaUrl} alt="Attachment" className="max-w-full h-auto" />
                      </div>
                    )}
                  </div>
                  <span className="text-[7px] text-muted-foreground mt-1 px-1">
                    {msg.createdAt?.toDate ? formatDistanceToNow(msg.createdAt.toDate(), { locale: ar }) : 'الآن'}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 opacity-40">
            <ShieldCheck size={32} className="mx-auto mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">تحدث مع الإدارة حول استفساراتك</p>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 bg-background border-t p-3 w-full max-w-[500px]">
        <div className="flex gap-2 items-center">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-secondary text-primary" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
          </Button>
          <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
          
          <div className="flex-1 bg-secondary/50 rounded-full px-4 h-10 flex items-center">
            <Input 
              placeholder="اكتب رسالة..." 
              className="flex-1 border-none bg-transparent focus-visible:ring-0 text-xs h-full p-0"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(message)}
            />
          </div>
          
          <Button variant="default" size="icon" className="h-9 w-9 rounded-full shadow-lg" onClick={() => { handleSendMessage(message); setMessage(''); }} disabled={!message.trim()}>
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <SupportContent />
    </Suspense>
  );
}
