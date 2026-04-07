import { AdminJobNavigation } from '@/components/navigation/job-navigation';
import { getUserDetails } from '@/lib/supabase/auth-helpers';

export default async function AdminJobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserDetails();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <AdminJobNavigation />
        {children}
      </div>
    </div>
  );
}