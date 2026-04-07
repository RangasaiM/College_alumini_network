'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Briefcase, Search, FileText, UserCheck } from 'lucide-react';

const jobNavItems = [
  {
    title: 'Browse Jobs',
    href: '/jobs',
    icon: Search,
  },
  {
    title: 'Post Opportunity',
    href: '/jobs/post',
    icon: Briefcase,
  },
  {
    title: 'My Applications',
    href: '/jobs/my-applications',
    icon: FileText,
  },
];

export function JobNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {jobNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminJobNavigation() {
  const pathname = usePathname();

  const adminNavItems = [
    ...jobNavItems,
    {
      title: 'Admin Dashboard',
      href: '/admin/jobs',
      icon: UserCheck,
    },
  ];

  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}