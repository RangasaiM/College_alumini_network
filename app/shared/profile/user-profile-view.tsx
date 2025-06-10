'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectButton } from "@/app/shared/users/connect-button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, GraduationCap, Briefcase, Link as LinkIcon, UserCheck, UserMinus, ThumbsUp, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'alumni' | 'admin';
  department?: string;
  batch_year?: number;
  graduation_year?: number;
  current_company?: string;
  current_position?: string;
  experience_years?: number;
  bio?: string;
  skills?: string[];
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  avatar_url?: string;
  location?: string;
}

interface RawPost {
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
}

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
  likes_count: number;
  comments_count: number;
  has_liked: boolean;
}

export default function UserProfileView({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUserId(session.user.id);

          // Check connection status
          const { data: connectionData } = await supabase
            .from('connections')
            .select('*')
            .or(`and(requester_id.eq.${session.user.id},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${session.user.id})`)
            .single();

          if (connectionData) {
            setConnectionStatus(connectionData.status);
          } else {
            setConnectionStatus('none');
          }
        }

        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        setUser(userData);

        // Fetch user's posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            user:users(id, name, avatar_url)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Fetch likes and comments for each post
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id, user_id')
          .in('post_id', postsData.map(p => p.id));

        const { data: commentsData } = await supabase
          .from('comments')
          .select('post_id')
          .in('post_id', postsData.map(p => p.id));

        const processedPosts: Post[] = (postsData as RawPost[]).map(post => {
          const postLikes = likesData?.filter(like => like.post_id === post.id) || [];
          const postComments = commentsData?.filter(comment => comment.post_id === post.id) || [];
          
          return {
            ...post,
            likes_count: postLikes.length,
            comments_count: postComments.length,
            has_liked: likesData?.some(like => like.post_id === post.id && like.user_id === session?.user.id) || false
          };
        });

        setPosts(processedPosts);
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Error loading profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, supabase]);

  const handleRemoveConnection = async () => {
    if (!currentUserId || !user) return;
    
    try {
      setIsLoadingAction(true);
      const { error } = await supabase
        .from('connections')
        .delete()
        .or(`and(requester_id.eq.${currentUserId},receiver_id.eq.${userId}),and(requester_id.eq.${userId},receiver_id.eq.${currentUserId})`);

      if (error) throw error;

      setConnectionStatus('none');
      toast.success('Connection removed successfully');
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.error('Failed to remove connection');
    } finally {
      setIsLoadingAction(false);
    }
  };

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  const renderConnectionButton = () => {
    if (currentUserId === user.id) return null;

    switch (connectionStatus) {
      case 'accepted':
        return (
          <Button
            variant="outline"
            onClick={handleRemoveConnection}
            disabled={isLoadingAction}
            className="space-x-2"
          >
            <UserCheck className="h-4 w-4" />
            <span>Connected</span>
          </Button>
        );
      case 'pending':
        return (
          <Button variant="outline" disabled className="space-x-2">
            <Badge variant="secondary">Request Pending</Badge>
          </Button>
        );
      case 'none':
        return <ConnectButton userId={user.id} userName={user.name} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container py-6 space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="relative overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-primary/80 to-primary/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/10" />
            </div>
            <CardContent className="relative -mt-24 space-y-4 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6">
                <Avatar className="h-32 w-32 border-4 border-background ring-2 ring-primary/50 mx-auto sm:mx-0">
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                  ) : (
                    <AvatarFallback className="text-4xl">{user.name?.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="mt-4 sm:mt-0 text-center sm:text-left flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold">{user.name}</h1>
                  <p className="text-xl text-muted-foreground mt-1">
                    {user.current_position} {user.current_company && `at ${user.current_company}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 justify-center sm:justify-start text-sm text-muted-foreground">
                    {user.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    {user.department && (
                      <div className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        <span>{user.department}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 flex justify-center">
                  {renderConnectionButton()}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - About and Details */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-6 w-1 bg-primary rounded-full" />
                  About
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {user.bio || 'No bio added yet.'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-6 w-1 bg-primary rounded-full" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.role === 'alumni' ? (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Building2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{user.current_company}</p>
                        <p className="text-sm text-muted-foreground">{user.current_position}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <p>{user.experience_years} years of experience</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Batch of {user.batch_year}</p>
                      <p className="text-sm text-muted-foreground">{user.department}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-6 w-1 bg-primary rounded-full" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {user.skills?.map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary"
                      className="px-3 py-1 hover:bg-secondary/80 transition-colors"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {(!user.skills || user.skills.length === 0) && (
                    <p className="text-muted-foreground">No skills added yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-6 w-1 bg-primary rounded-full" />
                  Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.linkedin_url && (
                  <a
                    href={user.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors p-2 rounded-md hover:bg-secondary/50"
                  >
                    <LinkIcon className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {user.github_url && (
                  <a
                    href={user.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors p-2 rounded-md hover:bg-secondary/50"
                  >
                    <LinkIcon className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {user.portfolio_url && (
                  <a
                    href={user.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors p-2 rounded-md hover:bg-secondary/50"
                  >
                    <LinkIcon className="h-4 w-4" />
                    Portfolio
                  </a>
                )}
                {(!user.linkedin_url && !user.github_url && !user.portfolio_url) && (
                  <p className="text-muted-foreground">No links added yet.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Posts and Activity */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="h-6 w-1 bg-primary rounded-full" />
                  Posts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {posts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-lg font-medium">No posts yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentUserId === user.id 
                        ? "Share your thoughts and experiences with your network!"
                        : `${user.name} hasn't posted anything yet.`}
                    </p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id} className="border-none shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12 ring-2 ring-background">
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
                        <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt="Post image"
                            className="rounded-lg max-h-96 w-full object-cover hover:opacity-95 transition-opacity cursor-pointer"
                          />
                        )}
                        <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
                          <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{Number(post.likes_count) || 0} likes</span>
                          </div>
                          <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                            <MessageSquare className="h-4 w-4" />
                            <span>{Number(post.comments_count) || 0} comments</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 