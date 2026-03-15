import Navbar from '@/components/layout/Navbar';
import LeftSidebar from '@/components/layout/LeftSidebar';
import RightSidebar from '@/components/layout/RightSidebar';
import PostCard from '@/components/posts/PostCard';
import { MOCK_POSTS } from '@/lib/mock-data';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-0 md:px-4 pt-10 flex gap-6">
        {/* Left column - Hidden on small screens */}
        <div className="hidden md:block w-64 pt-4 h-fit sticky top-14">
          <LeftSidebar />
        </div>

        {/* Middle column - Feed */}
        <div className="flex-1 w-full max-w-full md:max-w-2xl mx-auto">
          <div className="flex flex-col">
            {MOCK_POSTS.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Right column - Hidden on small screens */}
        <div className="hidden lg:block w-80 pt-4 h-fit sticky top-14">
          <RightSidebar />
        </div>
      </main>

      <Toaster />
    </div>
  );
}
