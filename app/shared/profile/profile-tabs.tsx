'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/app/shared/profile/profile-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserCard } from "../users/user-card";

interface ProfileTabsProps {
  user: {
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
  };
  isCurrentUser: boolean;
}

export function ProfileTabs({ user, isCurrentUser }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        {isCurrentUser && <TabsTrigger value="edit">Edit Profile</TabsTrigger>}
        <TabsTrigger value="network">Network</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">About</h3>
              <p className="text-muted-foreground">{user.bio || 'No bio added yet.'}</p>
            </div>
            {user.role === 'student' && (
              <>
                <div>
                  <h3 className="font-semibold">Education</h3>
                  <p className="text-muted-foreground">Batch of {user.batch_year}</p>
                  <p className="text-muted-foreground">{user.department}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Links</h3>
                  <div className="space-y-2">
                    {user.github_url && (
                      <a href={user.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block">
                        GitHub
                      </a>
                    )}
                    {user.linkedin_url && (
                      <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block">
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
            {user.role === 'alumni' && (
              <>
                <div>
                  <h3 className="font-semibold">Work</h3>
                  <p className="text-muted-foreground">{user.current_position} at {user.current_company}</p>
                  <p className="text-muted-foreground">{user.experience_years} years of experience</p>
                </div>
                <div>
                  <h3 className="font-semibold">Education</h3>
                  <p className="text-muted-foreground">Graduated in {user.graduation_year}</p>
                  <p className="text-muted-foreground">{user.department}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Links</h3>
                  <div className="space-y-2">
                    {user.linkedin_url && (
                      <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block">
                        LinkedIn
                      </a>
                    )}
                    {user.portfolio_url && (
                      <a href={user.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block">
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
            <div>
              <h3 className="font-semibold">Skills</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.skills?.map((skill: string) => (
                  <span key={skill} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </TabsContent>

      {isCurrentUser && (
        <TabsContent value="edit">
          <ProfileForm user={user} />
        </TabsContent>
      )}

      <TabsContent value="network">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Your Network</h3>
            {/* Network content will go here */}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 