
"use client"

import { useState, useRef } from 'react';
import { Image as ImageIcon, X, Hash, Loader2, Link as LinkIcon, Sparkles, AlertCircle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, increment } from 'firebase/firestore';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

interface CreatePostProps {
  onSuccess?: () => void;
}

export default function CreatePost({ onSuccess }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isAdPost, setIsAdPost] = useState(false);
  const [adLink, setAdLink] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userRef);

  const isAdmin = profile?.role === 'admin';
  const isVerified = profile?.verificationType === 'blue' || profile?.verificationType === 'gold' || isAdmin;
  
  const charLimit = isVerified ? 1500 : 400;
  const imageLimit = 3; 
  const AD_POST_COST = 100;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (mediaUrls.length + files.length > imageLimit) {
      toast({ variant: "destructive", description: `يمكنك رفع ${imageLimit} صور كحد أقصى.` });
      return;
    }

    setIsUploading(true);
    try {
      const newUrls = [...mediaUrls];
      const compressionOptions = { maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true };
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedFile = await imageCompression(file, compressionOptions);
        const url = await uploadImageToCloudinary(compressedFile);
        newUrls.push(url);
      }
      setMediaUrls(newUrls);
    } catch (error: any) {
      toast({ variant: "destructive", description: "فشل رفع الصور." });
    } finally { setIsUploading(false); }
  };

  const handlePost = async () => {
    if (isPosting) return;
    if (!content.trim() && mediaUrls.length === 0) return;
    if (content.length > charLimit) return toast({ variant: "destructive", description: `تجاوزت الحد (${charLimit} حرف).` });
    
    if (isAdPost) {
      if (!adLink.trim()) return toast({ variant: "destructive", description: "يرجى إضافة رابط الإعلان." });
      if ((profile?.coins || 0) < AD_POST_COST) return toast({ variant: "destructive", description: `تحتاج إلى ${AD_POST_COST} عملة لنشر إعلان.` });
    } else {
      const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
      if (urlRegex.test(content)) return toast({ variant: "destructive", title: "مخالفة السياسة", description: "يمنع وضع الروابط الخارجية إلا في المنشورات الإعلانية المدفوعة (100 عملة)." });
    }

    if (!db || !user) return;

    setIsPosting(true);
    try {
      if (isAdPost) {
        updateDocumentNonBlocking(doc(db, 'users', user.uid), { coins: increment(-AD_POST_COST) });
        addDocumentNonBlocking(collection(db, 'platform_revenue'), { type: 'ad_creation', amount: 30, fromUserId: user.uid, createdAt: serverTimestamp() });
      }

      const postData: any = {
        content: content.trim(), 
        authorId: user.uid, 
        authorName: profile?.username || 'مستكشف تيمقاد',
        authorAvatar: profile?.profilePictureUrl || '', 
        createdAt: serverTimestamp(),
        likesCount: 0, commentsCount: 0, repostsCount: 0, viewsCount: 0, bookmarksCount: 0, reportsCount: 0,
        hashtags: content.match(/#[^\s#]+/g) || [], 
        mediaUrls: mediaUrls,
        authorVerificationType: profile?.verificationType || 'none',
        isAdPost: isAdPost,
        adLink: isAdPost ? adLink : null,
        remainingAdBudget: isAdPost ? 70 : 0, // 70 coins go to users
        boostFactor: 1.0
      };

      await addDocumentNonBlocking(collection(db, 'posts'), postData);
      toast({ title: isAdPost ? "تم نشر إعلانك بنجاح! 🚀" : "تم النشر بنجاح في تيمقاد!" });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({ variant: "destructive", title: "فشل النشر" });
    } finally { setIsPosting(false); }
  };

  return (
    <div className="flex flex-col bg-background w-full h-full overflow-hidden text-right">
      <div className="flex items-center justify-between px-4 py-1 border-b h-10 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <Button variant="ghost" size="sm" onClick={onSuccess} className="h-7 w-7 p-0 rounded-full"><X size={18} /></Button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-[10px] text-primary uppercase tracking-widest leading-none">{isAdPost ? 'منشور إعلاني ممول' : 'منشور جديد'}</span>
          <span className={cn("text-[7px] font-bold mt-0.5", content.length > charLimit * 0.9 ? "text-destructive" : "text-muted-foreground")}>{content.length} / {charLimit}</span>
        </div>
        <Button onClick={handlePost} disabled={isUploading || isPosting || (content.length === 0 && mediaUrls.length === 0)} className={cn("h-7 px-4 rounded-full font-bold text-[10px]", isAdPost ? "bg-accent text-white" : "bg-primary text-white")}>
          {isPosting ? <Loader2 className="h-3 w-3 animate-spin" /> : isAdPost ? `دفع ونشر (100)` : 'نشر'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 border border-primary/10">
            <AvatarImage src={profile?.profilePictureUrl} /><AvatarFallback>{profile?.username?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pt-1 space-y-4">
            <Textarea placeholder="ماذا يدور في ذهنك يا بطل تيمقاد؟" className="min-h-[100px] resize-none border-none p-0 text-sm focus-visible:ring-0 text-right font-medium" value={content} onChange={(e) => setContent(e.target.value)} autoFocus />
            
            {isAdPost && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-accent">
                  <LinkIcon size={14} />
                  <label className="text-[10px] font-bold uppercase">رابط الإعلان الخارجي</label>
                </div>
                <Input placeholder="https://example.com" className="bg-secondary/30 border-none h-9 text-xs" value={adLink} onChange={e => setAdLink(e.target.value)} />
                <p className="text-[8px] text-muted-foreground italic">سيتم خصم 100 عملة: 70 للمشاهدين و30 للمنصة.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {mediaUrls.map((url, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border shadow-sm aspect-square">
              <img src={url} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={() => setMediaUrls(mediaUrls.filter((_, idx) => idx !== i))} className="absolute top-1 left-1 bg-black/60 text-white p-1 rounded-full"><X size={12} /></button>
            </div>
          ))}
          {isUploading && <div className="aspect-square bg-secondary/30 rounded-xl flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}
        </div>
      </div>

      <div className="border-t bg-background/95 p-3 space-y-3">
        <div className="flex items-center justify-between bg-accent/5 p-2 rounded-xl border border-accent/10">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", isAdPost ? "bg-accent text-white" : "bg-secondary text-muted-foreground")}>
              <Coins size={16} />
            </div>
            <div className="flex flex-col">
              <Label htmlFor="ad-mode" className="text-xs font-bold cursor-pointer">تحويل لمنشور إعلاني</Label>
              <span className="text-[8px] text-muted-foreground">تفعيل الروابط الخارجية (تكلفة: 100 عملة)</span>
            </div>
          </div>
          <Switch id="ad-mode" checked={isAdPost} onCheckedChange={setIsAdPost} />
        </div>

        <div className="flex flex-col gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="flex-1 h-9 rounded-xl gap-2 font-bold text-[10px]" onClick={() => fileInputRef.current?.click()} disabled={isUploading || mediaUrls.length >= imageLimit}>
              <ImageIcon size={16} className="text-primary" />
              <span>{`رفع صور (${mediaUrls.length}/${imageLimit})`}</span>
            </Button>
            <Button variant="secondary" className="h-9 w-9 rounded-xl p-0 flex items-center justify-center" onClick={() => setContent(content + ' #')}><Hash size={18} /></Button>
          </div>
        </div>
        <input type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handleFileChange} />
      </div>
    </div>
  );
}
