'use client';

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ProfileAvatar({ avatarUrl, name, size = 'md', className = '' }: ProfileAvatarProps) {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24',
    xl: 'h-32 w-32'
  };

  const getFallbackInitials = (name?: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {avatarUrl ? (
        <AvatarImage
          src={avatarUrl}
          alt={name || 'Profile picture'}
          className="object-cover"
        />
      ) : (
        <AvatarFallback className="bg-muted">
          {name ? (
            <span className="text-muted-foreground font-medium">
              {getFallbackInitials(name)}
            </span>
          ) : (
            <User className="h-6 w-6 text-muted-foreground" />
          )}
        </AvatarFallback>
      )}
    </Avatar>
  );
} 