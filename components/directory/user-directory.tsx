import { getServerSupabase } from "@/lib/supabase/auth-helpers";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface UserDirectoryProps {
  filterRole?: "student" | "alumni";
}

export async function UserDirectory({ filterRole }: UserDirectoryProps) {
  const supabase = getServerSupabase();
  
  // Get search parameters from URL
  let baseUrl = "http://localhost:3000";
  if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  }
  
  const url = new URL(baseUrl);
  if (process.env.NEXT_PUBLIC_SITE_PATH) {
    url.pathname = process.env.NEXT_PUBLIC_SITE_PATH;
  }
  
  const searchParams = url.searchParams;
  const query = searchParams.get("query");
  const year = searchParams.get("year");
  const skills = searchParams.get("skills")?.split(",").filter(Boolean);
  const role = searchParams.get("role") || filterRole;
  
  // Build query
  let dbQuery = supabase
    .from("users")
    .select("*")
    .eq("is_approved", true);
  
  // Apply filters
  if (role) {
    dbQuery = dbQuery.eq("role", role);
  }
  
  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,current_job.ilike.%${query}%`);
  }
  
  if (year) {
    if (role === "alumni") {
      dbQuery = dbQuery.eq("graduation_year", parseInt(year));
    } else {
      dbQuery = dbQuery.eq("batch_year", parseInt(year));
    }
  }
  
  // Execute query
  const { data: users, error } = await dbQuery;
  
  if (error) {
    console.error("Error fetching users:", error);
    return (
      <div className="text-center py-8">
        <p>Error loading directory. Please try again later.</p>
      </div>
    );
  }
  
  // Filter by skills if needed (client-side filtering since array fields are complex)
  let filteredUsers = users;
  if (skills && skills.length > 0) {
    filteredUsers = users.filter((user) => {
      if (!user.skills) return false;
      return skills.some((skill) => user.skills.includes(skill));
    });
  }
  
  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 flex justify-center">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-medium mb-1">No results found</h3>
        <p className="text-muted-foreground mb-4">
          Try adjusting your search or filters to find what you're looking for.
        </p>
        <Link href="?">
          <Button variant="outline">Clear All Filters</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {filteredUsers.map((user) => (
        <Card key={user.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback>
                  {user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {user.role === "alumni" 
                    ? `${user.current_job || "Alumni"} ${user.graduation_year ? `• ${user.graduation_year}` : ""}`
                    : `Student ${user.batch_year ? `• ${user.batch_year}` : ""}`}
                </p>
              </div>
            </div>
            
            {user.is_mentorship_available && (
              <Badge className="mt-3" variant="outline">
                Available for Mentorship
              </Badge>
            )}
            
            <div className="mt-4">
              {user.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.skills.slice(0, 3).map((skill: string) => (
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
              ) : (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <Button variant="outline" asChild>
              <Link href={`/profile/${user.id}`}>View Profile</Link>
            </Button>
            <Button variant="secondary" size="icon" asChild>
              <Link href={`/messages/new?recipient=${user.id}`}>
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">Message</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}