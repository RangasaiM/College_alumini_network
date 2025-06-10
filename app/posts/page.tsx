"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from 'framer-motion';
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, MessageSquare, Image as ImageIcon, Send, Search, Users2, Trash2 } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { Comments } from "@/app/shared/posts/comments";

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string | null;
    role: string;
    current_position?: string;
    current_company?: string;
  };
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
}

interface User {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  current_position?: string;
  current_company?: string;
  department?: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
        return;
      }
      setCurrentUserId(session.user.id);
    };
    checkSession();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const fetchPosts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const { data: postsData, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:users(id, name, avatar_url, role, current_position, current_company)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }

    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id, user_id');

    const { data: commentsData } = await supabase
      .from('comments')
      .select('post_id');

    const processedPosts = postsData.map(post => {
      const postLikes = likesData?.filter(like => like.post_id === post.id) || [];
      const postComments = commentsData?.filter(comment => comment.post_id === post.id) || [];
      
      return {
        ...post,
        likes_count: postLikes.length,
        comments_count: postComments.length,
        has_liked: postLikes.some(like => like.user_id === session.user.id)
      };
    });

    setPosts(processedPosts);
    setIsLoading(false);
  };

  const searchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, avatar_url, role, current_position, current_company, department')
      .or(`name.ilike.%${searchQuery}%, department.ilike.%${searchQuery}%, current_company.ilike.%${searchQuery}%`)
      .limit(5);

    if (error) {
      console.error('Error searching users:', error);
      return;
    }

    setSearchResults(data);
    setShowSearchResults(true);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;

    try {
      setIsUploading(true);
      
      // Use 'post_images' as the bucket name to match Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message === 'Bucket not found') {
          toast.error('Storage bucket not configured. Please contact administrator.');
        } else {
          toast.error('Failed to upload image: ' + uploadError.message);
        }
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post_images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image: ' + (error.message || 'Unknown error'));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && !selectedImage) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let imageUrl = null;
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl && !newPost.trim()) return; // Don't create post if image upload failed and no text
    }

    const { error } = await supabase
      .from('posts')
      .insert([
        {
          content: newPost,
          user_id: session.user.id,
          image_url: imageUrl
        }
      ]);

    if (error) {
      console.error('Error creating post:', error);
      return;
    }

    setNewPost('');
    setSelectedImage(null);
    setImagePreview(null);
    fetchPosts();
  };

  const handleLike = async (postId: string, hasLiked: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (hasLiked) {
      await supabase
        .from('likes')
        .delete()
        .match({ post_id: postId, user_id: session.user.id });
    } else {
      await supabase
        .from('likes')
        .insert([{ post_id: postId, user_id: session.user.id }]);
    }

    fetchPosts();
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleCommentCountChange = (postId: string, count: number) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments_count: count
        };
      }
      return post;
    }));
  };

  const handleDeletePost = async (postId: string, userId: string) => {
    if (currentUserId !== userId) {
      toast.error("You can only delete your own posts");
      return;
    }

    try {
      // First, delete all likes for this post
      await supabase
        .from('likes')
        .delete()
        .match({ post_id: postId });

      // Delete all comments for this post
      await supabase
        .from('comments')
        .delete()
        .match({ post_id: postId });

      // Delete the post itself
      const { error } = await supabase
        .from('posts')
        .delete()
        .match({ id: postId });

      if (error) throw error;

      // Remove the post from local state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error("Failed to delete post");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container max-w-2xl mx-auto py-6 px-4 sm:px-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-12"
            />
          </div>
          {showSearchResults && searchResults.length > 0 && (
            <Card className="absolute w-full mt-2 z-50 shadow-lg">
              <CardContent className="p-2">
                {searchResults.map((user) => (
                  <Link 
                    key={user.id} 
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg transition-colors"
                    onClick={() => setShowSearchResults(false)}
                  >
                    <Avatar className="h-10 w-10">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.name} />
                      ) : (
                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.role === 'student' ? user.department : `${user.current_position} at ${user.current_company}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Post */}
        <Card className="border-none shadow-md">
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
            {imagePreview && (
              <div className="relative mb-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-60 rounded-lg object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                >
                  ×
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                  onChange={handleImageSelect}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={isUploading}
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={(!newPost.trim() && !selectedImage) || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Post'}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <Link href={`/alumni/profile/${post.user.id}`}>
                        <Avatar className="h-10 w-10 cursor-pointer">
                          <AvatarImage src={post.user.avatar_url || undefined} />
                          <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <Link href={`/alumni/profile/${post.user.id}`}>
                          <h4 className="font-semibold hover:underline cursor-pointer">
                            {post.user.name}
                          </h4>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{post.user.role}</span>
                          {post.user.current_position && (
                            <>
                              <span>•</span>
                              <span>{post.user.current_position}</span>
                            </>
                          )}
                          {post.user.current_company && (
                            <>
                              <span>•</span>
                              <span>{post.user.current_company}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {/* Only show delete button for current user's posts */}
                    {currentUserId === post.user.id && (
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeletePost(post.id, post.user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="whitespace-pre-wrap mb-4">{post.content}</p>
                  {post.image_url && (
                    <div className="relative w-full mb-4">
                      <img
                        src={post.image_url}
                        alt="Post image"
                        className="w-full rounded-lg object-cover max-h-[500px]"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-2 ${post.has_liked ? 'text-red-500 hover:text-red-600' : ''}`}
                      onClick={() => handleLike(post.id, post.has_liked)}
                    >
                      <ThumbsUp className={`h-4 w-4 ${post.has_liked ? 'fill-current' : ''}`} />
                      {post.likes_count > 0 && post.likes_count}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {post.comments_count > 0 && post.comments_count}
                    </Button>
                  </div>
                </CardContent>
                {expandedComments.includes(post.id) && (
                  <Comments
                    postId={post.id}
                    isExpanded={true}
                    onToggle={() => toggleComments(post.id)}
                    onCommentCountChange={(count) => handleCommentCountChange(post.id, count)}
                  />
                )}
              </Card>
            </motion.div>
          ))}
          {!isLoading && posts.length === 0 && (
            <Card className="border-none shadow-md p-8 text-center">
              <Users2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No posts yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to share something with your network!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 