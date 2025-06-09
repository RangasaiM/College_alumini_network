'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2, ThumbsUp, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  likes_count: number | { count: number }[];
  comments_count: number | { count: number }[];
  has_liked: boolean;
}

function getCount(count: number | { count: number }[]): number {
  if (Array.isArray(count)) {
    const firstItem = count[0];
    if (firstItem && typeof firstItem === 'object' && 'count' in firstItem) {
      return firstItem.count;
    }
  }
  return typeof count === 'number' ? count : 0;
}

export default function MyPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('You must be logged in to view your posts');
          return;
        }

        setCurrentUserId(session.user.id);

        // Fetch user's posts
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Fetch user data
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (userError) throw userError;

        // Fetch likes and comments
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id, user_id')
          .in('post_id', posts.map(p => p.id));

        const { data: commentsData } = await supabase
          .from('comments')
          .select('post_id')
          .in('post_id', posts.map(p => p.id));

        const processedPosts = posts.map(post => {
          const postLikes = likesData?.filter(like => like.post_id === post.id) || [];
          const postComments = commentsData?.filter(comment => comment.post_id === post.id) || [];
          
          return {
            ...post,
            user: {
              id: user.id,
              name: user.name,
              avatar_url: user.avatar_url
            },
            likes_count: postLikes.map(like => ({ count: like.user_id === session.user.id ? 1 : 0 })),
            comments_count: postComments.map(comment => ({ count: 1 })),
            has_liked: postLikes.some(like => like.user_id === session.user.id)
          };
        });

        setPosts(processedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load your posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyPosts();
  }, [supabase]);

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  if (isLoading) {
    return <div>Loading your posts...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">My Posts</h2>
      {posts.length === 0 ? (
        <div className="text-center text-muted-foreground">You haven't posted anything yet.</div>
      ) : (
        posts.map((post) => (
          <Card key={post.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <Avatar>
                  {post.user.avatar_url ? (
                    <AvatarImage src={post.user.avatar_url} alt={post.user.name} />
                  ) : (
                    <AvatarFallback>{post.user.name?.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">{post.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeletePost(post.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{post.content}</p>
              {post.image_url && (
                <div className="mt-4">
                  <img
                    src={post.image_url}
                    alt="Post image"
                    loading="lazy"
                    width={800}
                    height={400}
                    className="max-h-[400px] rounded-lg object-cover w-full"
                  />
                </div>
              )}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <ThumbsUp className="h-4 w-4" />
                  {getCount(post.likes_count)}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MessageSquare className="h-4 w-4" />
                  {getCount(post.comments_count)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
} 