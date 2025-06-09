'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import MyPosts from '@/app/profile/my-posts';

interface AlumniProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  graduation_year: number | null;
  current_position: string | null;
  company: string | null;
  location: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
}

export default function AlumniProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<AlumniProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [currentPosition, setCurrentPosition] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchProfile();
  }, [params.id]);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to view profiles');
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      setProfile(profile);
      setName(profile.name || '');
      setBio(profile.bio || '');
      setGraduationYear(profile.graduation_year?.toString() || '');
      setCurrentPosition(profile.current_position || '');
      setCompany(profile.company || '');
      setLocation(profile.location || '');
      setLinkedinUrl(profile.linkedin_url || '');
      setGithubUrl(profile.github_url || '');
      setWebsiteUrl(profile.website_url || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to update your profile');
        return;
      }

      let avatarUrl = profile?.avatar_url;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from('users')
        .update({
          name,
          bio,
          avatar_url: avatarUrl,
          graduation_year: graduationYear ? parseInt(graduationYear) : null,
          current_position: currentPosition,
          company,
          location,
          linkedin_url: linkedinUrl,
          github_url: githubUrl,
          website_url: websiteUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        name,
        bio,
        avatar_url: avatarUrl || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
        current_position: currentPosition,
        company,
        location,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        website_url: websiteUrl
      } : null);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt={profile.name} />
                  ) : profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                  ) : (
                    <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                {isEditing && (
                  <div className="flex flex-col items-center space-y-2">
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                        Change Avatar
                      </div>
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currentPosition">Current Position</Label>
                    <Input
                      id="currentPosition"
                      value={currentPosition}
                      onChange={(e) => setCurrentPosition(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl">GitHub URL</Label>
                    <Input
                      id="githubUrl"
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Save</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setName(profile.name || '');
                        setBio(profile.bio || '');
                        setGraduationYear(profile.graduation_year?.toString() || '');
                        setCurrentPosition(profile.current_position || '');
                        setCompany(profile.company || '');
                        setLocation(profile.location || '');
                        setLinkedinUrl(profile.linkedin_url || '');
                        setGithubUrl(profile.github_url || '');
                        setWebsiteUrl(profile.website_url || '');
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Name</h3>
                    <p className="text-muted-foreground">{profile.name}</p>
                  </div>
                  {profile.bio && (
                    <div>
                      <h3 className="font-medium">Bio</h3>
                      <p className="text-muted-foreground">{profile.bio}</p>
                    </div>
                  )}
                  {profile.graduation_year && (
                    <div>
                      <h3 className="font-medium">Graduation Year</h3>
                      <p className="text-muted-foreground">{profile.graduation_year}</p>
                    </div>
                  )}
                  {profile.current_position && (
                    <div>
                      <h3 className="font-medium">Current Position</h3>
                      <p className="text-muted-foreground">{profile.current_position}</p>
                    </div>
                  )}
                  {profile.company && (
                    <div>
                      <h3 className="font-medium">Company</h3>
                      <p className="text-muted-foreground">{profile.company}</p>
                    </div>
                  )}
                  {profile.location && (
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p className="text-muted-foreground">{profile.location}</p>
                    </div>
                  )}
                  {profile.linkedin_url && (
                    <div>
                      <h3 className="font-medium">LinkedIn</h3>
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.linkedin_url}
                      </a>
                    </div>
                  )}
                  {profile.github_url && (
                    <div>
                      <h3 className="font-medium">GitHub</h3>
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.github_url}
                      </a>
                    </div>
                  )}
                  {profile.website_url && (
                    <div>
                      <h3 className="font-medium">Website</h3>
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.website_url}
                      </a>
                    </div>
                  )}
                  {params.id === (await supabase.auth.getSession()).data.session?.user.id && (
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <MyPosts />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 