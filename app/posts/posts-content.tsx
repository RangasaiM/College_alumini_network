'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Trash2, Image as ImageIcon, ThumbsUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Comments } from '@/app/shared/posts/comments';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

export default function PostsContent() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUserId(session.user.id);
          console.log('Current user ID:', session.user.id);
        }

        // First fetch posts
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (postsError) {
          console.error('Error fetching posts:', postsError);
          throw postsError;
        }

        // Then fetch user data for each post
        const userIds = Array.from(new Set(posts.map(post => post.user_id)));
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .in('id', userIds);

        if (usersError) {
          console.error('Error fetching users:', usersError);
          throw usersError;
        }

        // Fetch likes and comments
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id, user_id')
          .in('post_id', posts.map(p => p.id));

        const { data: commentsData } = await supabase
          .from('comments')
          .select('post_id')
          .in('post_id', posts.map(p => p.id));

        console.log('Raw posts data:', posts);
        console.log('Users data:', users);
        console.log('Fetched likes:', likesData);
        console.log('Fetched comments:', commentsData);

        const processedPosts = posts.map(post => {
          const user = users?.find(u => u.id === post.user_id);
          const postLikes = likesData?.filter(like => like.post_id === post.id) || [];
          const postComments = commentsData?.filter(comment => comment.post_id === post.id) || [];
          
          return {
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            updated_at: post.updated_at,
            image_url: post.image_url,
            user: {
              id: user?.id || '',
              name: user?.name || null,
              avatar_url: user?.avatar_url || null
            },
            likes_count: postLikes.map(like => ({ count: like.user_id === currentUserId ? 1 : 0 })),
            comments_count: postComments.map(comment => ({ count: 1 })),
            has_liked: postLikes.some(like => like.user_id === currentUserId),
            user_id: post.user_id
          };
        });

        console.log('Processed posts:', processedPosts);
        setPosts(processedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [supabase, currentUserId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !imageFile) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to create a post');
        return;
      }
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
      const { data: post, error } = await supabase
        .from('posts')
        .insert([
          {
            content: newPost.trim(),
            user_id: session.user.id,
            image_url: imageUrl,
          }
        ])
        .select(`
          *,
          user:users(id, name, avatar_url),
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .single();
      if (error) throw error;
      setPosts(prev => [{
        ...post,
        likes_count: [{ count: 0 }],
        comments_count: [{ count: 0 }],
        has_liked: false,
        user_id: session.user.id
      }, ...prev]);
      setNewPost('');
      setImageFile(null);
      setImagePreview(null);
      toast.success('Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to like posts');
        return;
      }

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.has_liked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ post_id: postId, user_id: session.user.id });

        if (error) throw error;

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, likes_count: [{ count: p.likes_count[0].count - 1 }], has_liked: false }
            : p
        ));
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: session.user.id }]);

        if (error) throw error;

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, likes_count: [{ count: p.likes_count[0].count + 1 }], has_liked: true }
            : p
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

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
    return <div>Loading...</div>;
  }

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex items-center gap-4">
              <label htmlFor="image-upload" className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-primary">
                <ImageIcon className="h-5 w-5" />
                <span>Add Image</span>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <Button onClick={handleCreatePost} disabled={!newPost.trim() && !imageFile}>
                Post
              </Button>
            </div>
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-[300px] rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4 mt-6">
        <h2 className="text-xl font-bold mb-4">All Posts</h2>
        {posts.length === 0 ? (
          <div className="text-center text-muted-foreground">No posts yet. Be the first to post!</div>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    {post.user.avatar_url ? (
                      <AvatarImage src={post.user.avatar_url} alt={post.user.name?.toString() || ''} />
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
                {currentUserId === post.user.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
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
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 text-sm ${
                      post.has_liked ? "text-blue-500" : "text-gray-500"
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    {getCount(post.likes_count)}
                  </button>
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
    </div>
  );
} 