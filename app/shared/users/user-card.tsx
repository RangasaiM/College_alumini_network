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
    company?: string;
    avatar_url?: string;
    skills?: string[];
  };
  actions?: ReactNode;
}

export function UserCard({ user, actions }: UserCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url || ""} />
            <AvatarFallback>
              {user.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{user.name}</h3>
            <p className="text-sm text-muted-foreground">
              {user.role === "alumni" 
                ? `${user.company || "Alumni"}`
                : `Student ${user.department ? `• ${user.department}` : ""}`}
            </p>
          </div>
          {actions && (
            <div className="ml-auto">{actions}</div>
          )}
        </div>
        
        {user.skills && user.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-4">
            {user.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {user.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{user.skills.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 