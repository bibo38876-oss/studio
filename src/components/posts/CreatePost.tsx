
"use client"

import { useState, useRef } from 'react';
import { Image as ImageIcon, X, Hash, Loader2, Camera, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { cn } from '@/lib/utils';
import imageCompression from 'browser-image-compression';

interface CreatePostProps {
  onSuccess?: () => void;
}

export default function CreatePost({ onSuccess }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
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
  const imageLimit = 3; // متاح للجميع الآن رفع 3 صور

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (mediaUrls.length + files.length > imageLimit) {
      toast({ 
        variant: "destructive", 
        description: `يمكنك رفع ${imageLimit} صور كحد أقصى.` 
      });
      return;
    }

    setIsUploading(true);
    try {
      const newUrls = [...mediaUrls];
      const compressionOptions = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // ضغط الصورة قبل الرفع
        const compressedFile = await imageCompression(file, compressionOptions);
        const url = await uploadImageToCloudinary(compressedFile);
        newUrls.push(url);
      }
      setMediaUrls(newUrls);
      toast({ description: "تم ضغط ورفع الصور بنجاح ✨" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "خطأ في المعالجة", description: error.message });
    } finally { 
      setIsUploading(false); 
    }
  };

  const handlePost = async () => {
    if (isPosting) return;
    if (!content.trim() && mediaUrls.length === 0) return;
    if (content.length > charLimit) return toast({ variant: "destructive", description: `تجاوزت الحد (${charLimit} حرف).` });
    
    // منع الروابط الخارجية
    const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
    if (urlRegex.test(content)) {
      return toast({ 
        variant: "destructive", 
        title: "مخالفة السياسة", 
        description: "عذراً، يمنع وضع الروابط الخارجية في المنشورات للحفاظ على أمان المجتمع." 
      });
    }

    if (!db || !user) return;

    setIsPosting(true);
    try {
      const postData: any = {
        content: content.trim(), 
        authorId: user.uid, 
        authorName: profile?.username || 'مستكشف تيمقاد',
        authorAvatar: profile?.profilePictureUrl || '', 
        createdAt: serverTimestamp(),
        likesCount: 0, 
        commentsCount: 0, 
        repostsCount: 0, 
        viewsCount: 0,
        bookmarksCount: 0,
        reportsCount: 0,
        hashtags: content.match(/#[^\s#]+/g) || [], 
        mediaUrls: mediaUrls,
        authorVerificationType: profile?.verificationType || 'none'
      };

      await addDocumentNonBlocking(collection(db, 'posts'), postData);
      toast({ title: "تم النشر بنجاح في تيمقاد!" });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({ variant: "destructive", title: "فشل النشر", description: "حدث خطأ غير متوقع." });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex flex-col bg-background w-full h-full overflow-hidden text-right">
      <div className="flex items-center justify-between px-4 py-1 border-b h-10 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <Button variant="ghost" size="sm" onClick={onSuccess} className="h-7 w-7 p-0 rounded-full">
          <X size={18} />
        </Button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-[10px] text-primary uppercase tracking-widest text-center leading-none">منشور جديد</span>
          <span className={cn("text-[7px] font-bold mt-0.5", content.length > charLimit * 0.9 ? "text-destructive" : "text-muted-foreground")}>
            {content.length} / {charLimit}
          </span>
        </div>
        <Button onClick={handlePost} disabled={isUploading || isPosting || (content.length === 0 && mediaUrls.length === 0)} className="h-7 bg-primary text-white px-4 rounded-full font-bold text-[10px]">
          {isPosting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'نشر'}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 border border-primary/10">
            <AvatarImage src={profile?.profilePictureUrl} />
            <AvatarFallback>{profile?.username?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pt-1">
            <Textarea placeholder="ماذا يدور في ذهنك يا بطل تيمقاد؟" className="min-h-[120px] resize-none border-none p-0 text-sm focus-visible:ring-0 text-right font-medium" value={content} onChange={(e) => setContent(e.target.value)} autoFocus />
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

      <div className="border-t bg-background/95 p-2">
        <div className="flex flex-col gap-2 max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="flex-1 h-9 rounded-xl gap-2 font-bold text-[10px]" onClick={() => fileInputRef.current?.click()} disabled={isUploading || mediaUrls.length >= imageLimit}>
              <ImageIcon size={16} className="text-primary" />
              <span>{`رفع صور (${mediaUrls.length}/${imageLimit})`}</span>
            </Button>
            <Button variant="secondary" className="h-9 w-9 rounded-xl p-0 flex items-center justify-center" onClick={() => setContent(content + ' #')}>
              <Hash size={18} />
            </Button>
          </div>
          <p className="text-[8px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <Sparkles size={10} className="text-accent" />
            يتم ضغط الصور تلقائياً لسرعة النشر
          </p>
        </div>
        <input type="file" accept="image/*" multiple hidden ref={fileInputRef} onChange={handleFileChange} />
      </div>
    </div>
  );
}
