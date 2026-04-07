'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, Briefcase, GraduationCap, Mail, Phone, Calendar,
  Award, BookOpen, Link as LinkIcon, Github, Linkedin,
  Twitter, Globe, MessageSquare, UserPlus, FileText, Check, UserCheck, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { PostCard } from "@/app/shared/posts/post-card";
import { Separator } from "@/components/ui/separator";
import { ConnectionsView } from "@/components/connections/connections-view";
import { toast } from "sonner";

// ... (existing helper function)

interface UserProfileViewProps {
  user: any;
  currentUser: any;
  isOwnProfile?: boolean;
  connectionCount?: number;
}

export function UserProfileView({ user, currentUser, isOwnProfile = false, connectionCount = 0 }: UserProfileViewProps) {
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [connectionStatus, setConnectionStatus] = useState<'sent' | 'received' | 'pending' | 'accepted' | null>(null);

  useEffect(() => {
    const fetchConnectionStatus = async () => {
      if (!currentUser?.id || !user?.id) return;

      const { data } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq.${currentUser.id},receiver_id.eq.${user.id}),and(requester_id.eq.${user.id},receiver_id.eq.${currentUser.id})`)
        .single();

      if (data) {
        if (data.status === 'pending') {
          setConnectionStatus(data.requester_id === currentUser.id ? 'sent' : 'received');
        } else {
          setConnectionStatus(data.status);
        }
      }
    };

    fetchConnectionStatus();
  }, [currentUser?.id, user.id, supabase]);

  const handleConnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        toast.error('Please sign in to connect');
        return;
      }

      const { error } = await supabase
        .from('connections')
        .insert([
          {
            requester_id: session.user.id,
            receiver_id: user.id,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      toast.success('Connection request sent');
      setConnectionStatus('sent');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user?.id) return;

      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          user:users!posts_user_id_fkey(id, name, avatar_url, role, current_position, current_company)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (postsData) {
        const postIds = postsData.map(p => p.id);
        const { data: likesData } = await supabase.from('likes').select('post_id, user_id').in('post_id', postIds);
        const { data: commentsData } = await supabase.from('comments').select('post_id').in('post_id', postIds);

        const processed = postsData.map(post => ({
          ...post,
          user: post.user || {
            id: user.id,
            name: user.name,
            avatar_url: user.avatar_url,
            role: user.role,
            current_position: user.current_position,
            current_company: user.current_company
          },
          likes_count: likesData?.filter(l => l.post_id === post.id).length || 0,
          comments_count: commentsData?.filter(c => c.post_id === post.id).length || 0,
          has_liked: likesData?.some(l => l.post_id === post.id && l.user_id === currentUser?.id) || false
        }));
        setUserPosts(processed);
      }
    };

    fetchUserPosts();
  }, [user.id, currentUser?.id]);

  // Mock data for missing DB fields to demonstrate the UI
  const coverImage = "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop";
  const stats = {
    connections: connectionCount,
    posts: 0,
    views: 45
  };

  const experience = user.internships || [];
  const education = [
    {
      school: "ACE Engineering College, Ghatkesar",
      degree: "Bachelor of Technology",
      field: user.department || "Computer Science",
      start: user.graduation_year ? (user.graduation_year - 4).toString() : "2020",
      end: user.graduation_year || "2024"
    }
  ];

  const skills = user.skills || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">

      {/* Header Card - Hero Section */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {/* Cover Image */}
        <div className="h-48 md:h-64 w-full relative bg-muted">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          {isOwnProfile && (
            <Button variant="secondary" size="sm" className="absolute top-4 right-4 opacity-90 hover:opacity-100">
              Edit Cover
            </Button>
          )}
        </div>

        <div className="px-6 pb-6 relative">
          {/* Profile Header Content */}
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 mb-4 gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="rounded-full p-1.5 bg-card">
                <Avatar className="h-32 w-32 border-2 border-muted">
                  <AvatarImage src={user.avatar_url || ""} />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                    {user.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 mt-2 md:mt-0 md:mb-2 space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                {user.name}
                {user.role === 'alumni' && <Badge variant="secondary" className="text-xs">Alumni</Badge>}
                {user.role === 'admin' && <Badge variant="destructive" className="text-xs">Admin</Badge>}
              </h1>
              <p className="text-lg text-muted-foreground font-medium">
                {user.current_position ? `${user.current_position} at ${user.current_company}` : user.role === 'student' ? 'Student' : 'Professional'}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {user.department || 'N/A'}{user.graduation_year ? ` • ${user.graduation_year}` : ''}
                </div>
                <div className="text-primary font-medium hover:underline cursor-pointer">
                  {stats.connections} connections
                </div>
              </div>

              {user.bio && (
                <div className="mt-4 max-w-3xl">
                  <p className="text-muted-foreground/90 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                    {user.bio}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 md:mb-4">
              {isOwnProfile ? (
                <Button asChild>
                  <Link href={`/${user.role}/profile/edit`}>Edit Profile</Link>
                </Button>
              ) : (
                <>
                  {!connectionStatus ? (
                    <Button className="gap-2" onClick={handleConnect}>
                      <UserPlus className="h-4 w-4" /> Connect
                    </Button>
                  ) : connectionStatus === 'sent' ? (
                    <Button className="gap-2" disabled variant="secondary">
                      <Check className="h-4 w-4" /> Pending
                    </Button>
                  ) : connectionStatus === 'received' ? (
                    <Button className="gap-2" disabled variant="secondary">
                      Request Received
                    </Button>
                  ) : (
                    <Button className="gap-2" disabled variant="outline">
                      <UserCheck className="h-4 w-4" /> Connected
                    </Button>
                  )}

                  <Button variant="outline" className="gap-2">
                    <MessageSquare className="h-4 w-4" /> Message
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        {isOwnProfile && (
          <div className="flex items-center mb-6">
            <TabsList>
              <TabsTrigger value="profile">Overview</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
            </TabsList>
          </div>
        )}

        <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left Column (Main Details) */}
            <div className="md:col-span-2 space-y-6">



              {/* Education Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Education</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {education.map((edu, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{edu.school}</h3>
                        <p className="text-sm text-foreground/80">{edu.degree}, {edu.field}</p>
                        <p className="text-xs text-muted-foreground mt-1">{edu.start} - {edu.end}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Experience Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(user.current_company || user.current_position) && (
                    <div className="flex gap-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.current_position || "Position"}</h3>
                        <p className="text-sm text-foreground/80">{user.current_company || "Company"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Present</p>
                      </div>
                    </div>
                  )}

                  {user.internships && user.internships.length > 0 ? (
                    user.internships.map((exp: any, i: number) => (
                      <div key={i} className="flex gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{exp.position}</h3>
                          <p className="text-sm text-foreground/80">{exp.company}</p>
                          <p className="text-xs text-muted-foreground mt-1">{exp.duration}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    !user.current_company && !user.current_position && (
                      <p className="text-muted-foreground text-sm">No experience details listed.</p>
                    )
                  )}
                </CardContent>
              </Card>



              {/* Certifications (Mock/Future) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Licenses & Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  {user.certifications && user.certifications.length > 0 ? (
                    <div className="space-y-4">
                      {user.certifications.map((cert: any, i: number) => (
                        <CertificationItem key={i} cert={cert} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No certifications listed.</p>
                  )}
                </CardContent>
              </Card>

              {/* Activity / Posts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                    {userPosts.length > 0 ? (
                      userPosts.map(post => (
                        <div key={post.id} className="min-w-[320px] max-w-[320px] snap-center">
                          <PostCard
                            post={post}
                            currentUserId={currentUser?.id}
                            onDelete={(id: string) => setUserPosts(prev => prev.filter(p => p.id !== id))}
                            disableProfileLink={true}
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">No recent activity.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column (Sidebar) */}
            <div className="space-y-6">

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-md">Contact Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${user.email}`} className="hover:underline text-foreground">{user.email}</a>
                    </div>
                  )}
                  {user.mobile_number && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.mobile_number}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {user.github_url && (
                      <Button variant="ghost" size="icon" asChild title="GitHub">
                        <a href={user.github_url} target="_blank" rel="noreferrer"><Github className="h-5 w-5" /></a>
                      </Button>
                    )}
                    {user.linkedin_url && (
                      <Button variant="ghost" size="icon" asChild title="LinkedIn">
                        <a href={user.linkedin_url} target="_blank" rel="noreferrer"><Linkedin className="h-5 w-5 text-blue-700" /></a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-md">Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill: string, i: number) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1 font-normal text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills added yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Achievements / Coding Stats (Student specific) */}
              {(user.role === 'student' || user.leetcode_url || user.codechef_url || user.hackerrank_url || user.codeforces_url) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-md">Coding Profiles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {[
                      { key: 'leetcode_url', name: 'LeetCode', icon: 'https://cdn.simpleicons.org/leetcode/FFA116' },
                      { key: 'codechef_url', name: 'CodeChef', icon: 'https://cdn.simpleicons.org/codechef/5B4638' },
                      { key: 'hackerrank_url', name: 'HackerRank', icon: 'https://cdn.simpleicons.org/hackerrank/2EC866' },
                      { key: 'codeforces_url', name: 'Codeforces', icon: 'https://cdn.simpleicons.org/codeforces/1F8ACB' }
                    ].map((platform) => {
                      const url = user[platform.key];
                      if (!url) return null;
                      return (
                        <a key={platform.key} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-md transition-all group border border-transparent hover:border-border">
                          <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                            <img src={platform.icon} alt={platform.name} className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-medium flex-1">{platform.name}</span>
                          <LinkIcon className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                        </a>
                      );
                    })}

                    {!user.leetcode_url && !user.codechef_url && !user.hackerrank_url && !user.codeforces_url && (
                      <p className="text-sm text-muted-foreground px-2">No profiles linked yet.</p>
                    )}
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="connections" className="mt-0 focus-visible:outline-none">
            <div className="max-w-6xl mx-auto">
              <ConnectionsView currentUserId={currentUser?.id || user.id} currentUserRole={currentUser?.role || user.role || 'student'} />
            </div>
          </TabsContent>
        )}
      </Tabs>

    </div >
  );
}

function CertificationItem({ cert }: { cert: any }) {
  const content = (
    <div className="flex gap-4 group">
      <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
        <Award className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold flex items-center gap-2">
          {cert.name}
          {cert.url && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />}
        </h3>
        <p className="text-sm text-foreground/80">{cert.issuer}</p>
        <p className="text-xs text-muted-foreground mt-1">{cert.date}</p>
      </div>
    </div>
  );

  if (cert.url) {
    return (
      <a
        href={cert.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors cursor-pointer"
      >
        {content}
      </a>
    );
  }

  return <div className="p-2 -mx-2">{content}</div>;
}