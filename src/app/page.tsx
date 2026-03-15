import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import CreatePost from '@/components/posts/CreatePost';
import PostCard from '@/components/posts/PostCard';
import { MOCK_POSTS } from '@/lib/mock-data';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 md:py-8 flex gap-6">
        {/* Left column - User profile and navigation shortcuts */}
        <LeftSidebar />

        {/* Middle column - Feed */}
        <div className="flex-1 max-w-2xl">
          <CreatePost />
          
          <div className="space-y-4">
            {MOCK_POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Right column - Trending and suggestions */}
        <RightSidebar />
      </main>

      <Toaster />
    </div>
  );
}
