
"use client"

import { useState } from 'react';
import { Sparkles, Image as ImageIcon, X, Loader2, Hash, Wand2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { aiPostEnhancer } from '@/ai/flows/ai-post-enhancer';
import { aiImageGenerator } from '@/ai/flows/ai-image-generator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, addDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import Image from 'next/image';

interface CreatePostProps {
  onSuccess?: () => void;
}

export default function CreatePost({ onSuccess }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<{ hashtags: string[], summary: string } | null>(null);
  const { toast } = useToast();
  const { firestore } = useFirestore();
  const { user } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc(userRef);

  const handleEnhance = async () => {
    if (!content.trim()) return;
    setIsEnhancing(true);
    try {
      const result = await aiPostEnhancer({ postContent: content });
      setAiSuggestions(result);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء تحسين المنشور." });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!content.trim()) {
      toast({ title: "تنبيه", description: "اكتب شيئاً أولاً ليتمكن الذكاء الاصطناعي من تخيل الصورة!" });
      return;
    }
    setIsGeneratingImage(true);
    try {
      const result = await aiImageGenerator({ prompt: content });
      setGeneratedImage(result.imageUrl);
      toast({ title: "تم!", description: "تم توليد صورة فنية لمنشورك." });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل توليد الصورة. حاول مرة أخرى." });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePost = () => {
    if (!content.trim() || !firestore || !user) return;

    const postData = {
      content,
      authorId: user.uid,
      authorName: profile?.username || 'مستخدم تواصل',
      authorAvatar: profile?.profilePictureUrl || '',
      createdAt: serverTimestamp(),
      likesCount: 0,
      hashtags: aiSuggestions?.hashtags || [],
      mediaUrl: generatedImage || null,
      mediaType: generatedImage ? 'image' : null,
    };

    addDocumentNonBlocking(collection(firestore, 'posts'), postData);

    toast({ title: "تم النشر!", description: "تم نشر منشورك بنجاح." });
    if (onSuccess) onSuccess();
  };

  return (
    <div className="flex flex-col bg-background w-full h-full animate-in slide-in-from-bottom duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0 z-20">
        <Button variant="ghost" size="sm" onClick={onSuccess} className="h-8 w-8 rounded-full p-0">
          <X size={18} />
        </Button>
        <span className="font-bold text-xs">إنشاء منشور</span>
        <Button 
          onClick={handlePost} 
          disabled={!content.trim() || isGeneratingImage} 
          className="h-7 bg-primary text-white px-5 rounded-full font-bold text-[10px]"
        >
          نشر
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-background">
        <div className="flex gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.profilePictureUrl} alt={profile?.username} />
            <AvatarFallback>{profile?.username?.[0] || 'ت'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea 
              placeholder="بماذا تفكر؟..." 
              className="min-h-[120px] resize-none border-none focus-visible:ring-0 p-0 text-md bg-transparent placeholder:text-muted-foreground/40"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        
        {generatedImage && (
          <div className="relative group rounded-none overflow-hidden aspect-square w-full bg-muted">
            <Image src={generatedImage} alt="Generated content" fill className="object-cover" />
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-2 left-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setGeneratedImage(null)}
            >
              <X size={14} />
            </Button>
          </div>
        )}

        {aiSuggestions && (
          <div className="bg-secondary/50 border border-muted p-3 space-y-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                <Wand2 size={12} className="text-accent" />
                اقتراحات الذكاء الاصطناعي
              </span>
            </div>
            <p className="text-[11px] text-foreground/70 leading-relaxed italic">"{aiSuggestions.summary}"</p>
            <div className="flex flex-wrap gap-1">
              {aiSuggestions.hashtags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="bg-accent/10 text-accent text-[9px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 w-full text-[9px] font-bold" 
              onClick={() => {
                setContent(`${content}\n\n${aiSuggestions.hashtags.join(' ')}`);
                setAiSuggestions(null);
              }}
            >
              إضافة الهاشتاجات
            </Button>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="border-t bg-background p-2 pb-safe">
        <div className="flex items-center justify-around">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-1 flex-col h-12 gap-1 text-muted-foreground hover:text-primary hover:bg-transparent"
          >
            <ImageIcon size={18} />
            <span className="text-[8px]">معرض الصور</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 flex-col h-12 gap-1 hover:bg-transparent ${isGeneratingImage ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
            onClick={handleGenerateImage}
            disabled={isGeneratingImage || !content.trim()}
          >
            {isGeneratingImage ? <Loader2 size={18} className="animate-spin" /> : <Palette size={18} />}
            <span className="text-[8px]">توليد صورة AI</span>
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 flex-col h-12 gap-1 hover:bg-transparent ${isEnhancing ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            onClick={handleEnhance}
            disabled={isEnhancing || !content.trim()}
          >
            {isEnhancing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            <span className="text-[8px]">تحسين ذكي</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
