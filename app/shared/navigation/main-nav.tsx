import Link from 'next/link';

export function MainNav() {
  return (
    <nav className="flex items-center space-x-6">
      <Link
        href="/dashboard"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Dashboard
      </Link>
      <Link
        href="/discover"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Discover
      </Link>
      <Link
        href="/connections"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        My Network
      </Link>
      <Link
        href="/messages"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Messages
      </Link>
      <Link
        href="/announcements"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Announcements
      </Link>
    </nav>
  );
} 