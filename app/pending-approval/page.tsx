import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/auth-helpers";
import Link from "next/link";

export default async function PendingApprovalPage() {
  const supabase = createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { data: userData } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', session?.user?.id)
    .single();

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Approval Pending</CardTitle>
          <CardDescription>
            Your account is pending administrator approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Hello {userData?.full_name || userData?.email},
            </p>
            <p className="text-sm text-muted-foreground">
              Thank you for signing up! Your account is currently pending approval from our administrators.
              This helps us maintain the security and integrity of our alumni network.
            </p>
            <p className="text-sm text-muted-foreground">
              You will receive an email notification once your account has been approved.
              If you have any questions, please contact the administrator.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" asChild>
              <Link href="/auth/signout">Sign Out</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 