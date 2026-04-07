'use client';

import { useState } from 'react';
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { ThumbsUp, MessageSquare, Trash2, Globe } from "lucide-react";
import Link from 'next/link';
import { toast } from "sonner";
import { Comments } from "@/app/shared/posts/comments";

interface PostCardProps {
    post: any;
    currentUserId: string | null;
    onDelete?: (postId: string) => void;
    disableProfileLink?: boolean;
}

export function PostCard({ post: initialPost, currentUserId, onDelete, disableProfileLink = false }: PostCardProps) {
    const [post, setPost] = useState(initialPost);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [isExpandedText, setIsExpandedText] = useState(false);
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLike = async () => {
        if (!currentUserId) return;

        // Optimistic update
        const newHasLiked = !post.has_liked;
        const newCount = post.likes_count + (newHasLiked ? 1 : -1);

        setPost(prev => ({
            ...prev,
            has_liked: newHasLiked,
            likes_count: newCount
        }));

        if (newHasLiked) {
            await supabase
                .from('likes')
                .insert([{ post_id: post.id, user_id: currentUserId }]);
        } else {
            await supabase
                .from('likes')
                .delete()
                .match({ post_id: post.id, user_id: currentUserId });
        }
    };

    const handleDelete = async () => {
        if (currentUserId !== post.user.id) {
            toast.error("You can only delete your own posts");
            return;
        }

        try {
            // Delete interactions first (cascade usually handles this but good to be safe/explicit if cascade missing)
            await supabase.from('likes').delete().match({ post_id: post.id });
            await supabase.from('comments').delete().match({ post_id: post.id });

            const { error } = await supabase.from('posts').delete().match({ id: post.id });
            if (error) throw error;

            toast.success("Post deleted successfully");
            if (onDelete) onDelete(post.id);
        } catch (error) {
            console.error('Error deleting post:', error);
            toast.error("Failed to delete post");
        }
    };

    return (
        <Card className="overflow-hidden border border-border/60 shadow-sm">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        {disableProfileLink ? (
                            <Avatar className="h-10 w-10 border border-border/50">
                                <AvatarImage src={post.user.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/5 text-primary">{post.user.name[0]}</AvatarFallback>
                            </Avatar>
                        ) : (
                            <Link href={`/profile/${post.user.id}`}>
                                <Avatar className="h-10 w-10 cursor-pointer border border-border/50">
                                    <AvatarImage src={post.user.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/5 text-primary">{post.user.name[0]}</AvatarFallback>
                                </Avatar>
                            </Link>
                        )}
                        <div>
                            {disableProfileLink ? (
                                <h4 className="font-semibold text-sm">
                                    {post.user.name}
                                </h4>
                            ) : (
                                <Link href={`/profile/${post.user.id}`}>
                                    <h4 className="font-semibold text-sm hover:underline cursor-pointer">
                                        {post.user.name}
                                    </h4>
                                </Link>
                            )}
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px] sm:max-w-md">
                                {post.user.role === 'admin'
                                    ? (post.user.current_position || "Administrator")
                                    : (post.user.current_position ? `${post.user.current_position} at ${post.user.current_company}` : post.user.role)
                                }
                            </p>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 mt-0.5">
                                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                <span>•</span>
                                <Globe className="h-3 w-3" />
                            </div>
                        </div>
                    </div>
                    {currentUserId === post.user.id && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive -mr-2"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {post.content && (
                    <div className="px-4 pb-3">
                        {(() => {
                            const lines = post.content.split('\n');
                            const isLongText = post.content.length > 150;
                            const isManyLines = lines.length > 2;
                            const shouldShowSeeMore = isLongText || isManyLines;

                            let displayedContent = post.content;
                            if (shouldShowSeeMore && !isExpandedText) {
                                let preview = lines.slice(0, 2).join('\n');
                                if (preview.length > 150) {
                                    preview = preview.slice(0, 150);
                                }
                                displayedContent = `${preview}...`;
                            }

                            return (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                    {displayedContent}
                                    {shouldShowSeeMore && (
                                        <button
                                            onClick={() => setIsExpandedText(!isExpandedText)}
                                            className="text-muted-foreground hover:text-primary font-medium ml-1 hover:underline focus:outline-none text-xs"
                                        >
                                            {isExpandedText ? " show less" : " see more"}
                                        </button>
                                    )}
                                </p>
                            );
                        })()}
                    </div>
                )}

                {post.image_url && (
                    <div className="relative w-full bg-muted/20 border-y border-border/50">
                        <img
                            src={post.image_url}
                            alt="Post image"
                            className="w-full object-cover max-h-[600px]"
                        />
                    </div>
                )}

                {/* Stats Bar */}
                {(post.likes_count > 0 || post.comments_count > 0) && (
                    <div className="px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 h-4">
                            {post.likes_count > 0 && (
                                <>
                                    <div className="bg-primary/10 rounded-full p-0.5"><ThumbsUp className="h-2.5 w-2.5 text-primary fill-primary" /></div>
                                    <span className="hover:text-primary hover:underline cursor-pointer">{post.likes_count}</span>
                                </>
                            )}
                        </div>
                        <div className="hover:text-primary hover:underline cursor-pointer">
                            {post.comments_count > 0 && <span>{post.comments_count} comments</span>}
                        </div>
                    </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="px-2 py-1 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`flex-1 gap-2 hover:bg-muted/50 rounded-md transition-colors h-10 ${post.has_liked ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={handleLike}
                    >
                        <ThumbsUp className={`h-4 w-4 ${post.has_liked ? 'fill-current' : ''}`} />
                        <span className="font-medium">Like</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 gap-2 text-muted-foreground hover:bg-muted/50 rounded-md transition-colors h-10"
                        onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                    >
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-medium">Comment</span>
                    </Button>
                </div>
            </CardContent>

            {
                isCommentsOpen && (
                    <div className="bg-muted/5 border-t">
                        <Comments
                            postId={post.id}
                            isExpanded={true}
                            onToggle={() => setIsCommentsOpen(!isCommentsOpen)}
                            onCommentCountChange={(count) => setPost(prev => ({ ...prev, comments_count: count }))}
                        />
                    </div>
                )
            }
        </Card >
    );
}
