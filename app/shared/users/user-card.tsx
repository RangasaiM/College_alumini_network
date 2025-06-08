'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface UserCardProps {
  user: {
    id: string;
    name: string;
    role: string;
    department?: string;
    current_company?: string;
    current_position?: string;
    avatar_url?: string;
    skills?: string[];
  };
  actions?: ReactNode;
}

export function UserCard({ user, actions }: UserCardProps) {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-semibold">{user.name}</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{user.role}</Badge>
            {user.department && (
              <Badge variant="outline">{user.department}</Badge>
            )}
          </div>
          {user.current_company && (
            <p className="text-sm text-muted-foreground">
              {user.current_position ? `${user.current_position} at ` : ''}{user.current_company}
            </p>
          )}
        </div>
      </div>
      {user.skills && user.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {user.skills.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      )}
      {actions && <div className="flex justify-end">{actions}</div>}
    </div>
  );
} 