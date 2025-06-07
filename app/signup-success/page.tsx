import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Account Created Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Thank you for signing up! Please check your email to verify your account.
          </p>
          <div className="space-y-2">
            <p className="font-medium">What happens next?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. Click the verification link in your email</li>
              <li>2. Wait for admin approval of your account</li>
              <li>3. Once approved, you can sign in and access the platform</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/signin">
            <Button variant="outline">
              Return to Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
} 