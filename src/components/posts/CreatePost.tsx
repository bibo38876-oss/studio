
"use client"

import { useState, useRef } from 'react';
import { Image as ImageIcon, X, Hash, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';

interface CreatePostProps {
  onSuccess?: () => void;
}

export default function CreatePost({ onSuccess }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userRef);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newMediaUrls: string[] = [...mediaUrls];
    let loadedCount = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          newMediaUrls.push(reader.result);
        }
        loadedCount++;
        if (loadedCount === files.length) {
          setMediaUrls(newMediaUrls);
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePost = () => {
    if (!content.trim() && mediaUrls.length === 0) return;
    if (!db || !user) return;

    const postData = {
      content: content.trim(),
      authorId: user.uid,
      authorName: profile?.username || 'مستخدم تواصل',
      authorAvatar: profile?.profilePictureUrl || '',
      createdAt: serverTimestamp(),
      likesCount: 0,
      commentsCount: 0,
      hashtags: content.match(/#[^\s#]+/g) || [],
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : null,
      mediaType: mediaUrls.length > 0 ? 'image' : null,
      email: user.email,
    };

    addDocumentNonBlocking(collection(db, 'posts'), postData);

    toast({ title: "تم النشر!", description: "تم نشر منشورك بنجاح." });
    if (onSuccess) onSuccess();
  };

  const removeImage = (index: number) => {
    setMediaUrls(mediaUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col bg-background w-full h-full animate-in slide-in-from-bottom duration-300 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0 z-20">
        <Button variant="ghost" size="sm" onClick={onSuccess} className="h-8 w-8 rounded-full p-0">
          <X size={18} />
        </Button>
        <span className="font-bold text-xs text-primary">منشور جديد</span>
        <Button 
          onClick={handlePost} 
          disabled={(!content.trim() && mediaUrls.length === 0) || isUploading} 
          className="h-7 bg-primary text-white px-5 rounded-full font-bold text-[10px]"
        >
          نشر
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9 rounded-none">
            <AvatarImage src={profile?.profilePictureUrl} alt={profile?.username} />
            <AvatarFallback>{profile?.username?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea 
              placeholder="ماذا يدور في ذهنك؟" 
              className="min-h-[120px] resize-none border-none focus-visible:ring-0 p-0 text-md bg-transparent placeholder:text-muted-foreground/40"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative w-full group bg-secondary/20">
                <img src={url} alt="Preview" className="w-full h-auto block" />
                <button 
                  onClick={() => removeImage(i)}
                  className="absolute top-2 left-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {isUploading && (
          <div className="flex items-center justify-center py-4 gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" />
            جاري تحضير الصور...
          </div>
        )}
      </div>

      <div className="border-t bg-background p-2 pb-safe">
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 flex-col h-12 gap-1 text-muted-foreground hover:text-primary hover:bg-transparent"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <ImageIcon size={18} />
            <span className="text-[8px]">معرض الصور</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 flex-col h-12 gap-1 text-muted-foreground hover:text-primary hover:bg-transparent"
            onClick={() => {
              if(!content.includes('#')) {
                setContent(content + ' #');
              }
            }}
          >
            <Hash size={18} />
            <span className="text-[8px]">وسم</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
