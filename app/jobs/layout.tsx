import { JobNavigation } from '@/components/navigation/job-navigation';
import { getUserDetails } from '@/lib/supabase/auth-helpers';
import { Sidebar } from '@/components/layout/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default async function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserDetails();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4">
          <JobNavigation />
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={user.role as "student" | "alumni" | "admin"} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-semibold">
              Jobs Board
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto py-8 px-4">
            <JobNavigation />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}