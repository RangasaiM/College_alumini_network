"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  RotateCcw,
  Users,
  UserCheck,
  Clock,
  GraduationCap
} from "lucide-react";
import { format } from "date-fns";
import { ConnectionActions } from "@/components/shared/connection-actions";

const DEPARTMENT_OPTIONS = [
  "CSE",
  "ECE",
  "Mech",
  "EEE",
  "CSE(AI&ML)",
  "CSE(DS)",
  "CSE(IoT)",
  "Civil"
] as const;

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: string;
  is_approved: boolean;
  department?: string;
  gender?: string;
  graduation_year?: number;
  created_at: string;
}

interface UserDirectoryClientProps {
  initialUsers: User[];
}

export function UserDirectoryClient({ initialUsers }: UserDirectoryClientProps) {
  const router = useRouter();
  const [users] = useState<User[]>(initialUsers);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  // Derive unique values for filters
  const departments = DEPARTMENT_OPTIONS;

  const graduationYears = useMemo(() => {
    const years = new Set(users.map(u => u.graduation_year).filter(Boolean));
    return Array.from(years).sort((a, b) => (b as number) - (a as number));
  }, [users]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.is_approved).length,
      pending: users.filter(u => !u.is_approved).length,
      alumni: users.filter(u => u.role === 'alumni').length
    };
  }, [users]);

  // Filter Logic
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchQuery ||
        (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesDept = deptFilter === "all" || user.department === deptFilter;

      const matchesYear = yearFilter === "all" || user.graduation_year?.toString() === yearFilter;

      const matchesGender = genderFilter === "all" || user.gender === genderFilter;

      return matchesSearch && matchesRole && matchesDept && matchesYear && matchesGender;
    });
  }, [users, searchQuery, roleFilter, deptFilter, yearFilter, genderFilter]);

  const resetFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setDeptFilter("all");
    setYearFilter("all");
    setGenderFilter("all");
  };

  const handleRowClick = (userId: string) => {
    console.log("Navigating to profile:", userId);
    if (!userId) {
      console.error("User ID is missing!");
      return;
    }
    router.push(`/profile/${userId}`);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Registered on platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Approved accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumni Network</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alumni}</div>
            <p className="text-xs text-muted-foreground">Verified alumni</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex flex-1 items-center gap-2 min-w-[300px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-[300px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Role" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="alumni">Alumni</SelectItem>
            </SelectContent>
          </Select>

          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept as string} value={dept as string}>
                  {dept as string}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Grad Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {graduationYears.map((year) => (
                <SelectItem key={year as number} value={year?.toString() as string}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchQuery || roleFilter !== "all" || deptFilter !== "all" || yearFilter !== "all" || genderFilter !== "all") && (
            <Button variant="ghost" size="icon" onClick={resetFilters} title="Reset Filters">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>User Profile</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Joined Date</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found matching the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(user.id)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{user.name || "N/A"}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{user.department || "-"}</span>
                      {user.graduation_year && (
                        <span className="text-xs text-muted-foreground">Class of {user.graduation_year}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm capitalize">{user.gender || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.is_approved ? "default" : "secondary"}
                      className={`
                        ${user.is_approved ? "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-yellow-200"}
`}
                    >
                      {user.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ConnectionActions userId={user.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
} 