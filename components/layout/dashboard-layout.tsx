"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import { UserProfileHeader } from "./user-profile-header";
import {
  Users,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  MessageSquare,
  Search,
  Home,
  Settings,
  UserPlus,
  BarChart3,
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "student" | "alumni" | "admin";
}

export default function DashboardLayout({
  children,
  role,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase } = useSupabase();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Generate navigation links based on role
  const navLinks = [
    {
      href: `/${role}/dashboard`,
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: `/${role}/profile`,
      label: "Profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      href: `/${role}/directory`,
      label: "Directory",
      icon: <Search className="h-5 w-5" />,
    },
    {
      href: `/${role}/messages`,
      label: "Messages",
      icon: <MessageSquare className="h-5 w-5" />,
    },
  ];

  // Add admin-specific links
  if (role === "admin") {
    navLinks.push(
      {
        href: "/admin/pending-approvals",
        label: "Pending Approvals",
        icon: <UserPlus className="h-5 w-5" />,
      },
      {
        href: "/admin/announcements",
        label: "Announcements",
        icon: <Bell className="h-5 w-5" />,
      },
      {
        href: "/admin/analytics",
        label: "Analytics",
        icon: <BarChart3 className="h-5 w-5" />,
      }
    );
  }

  // Add settings link
  navLinks.push({
    href: `/${role}/settings`,
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
  });

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile header */}
      <header className="md:hidden border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <span className="text-xl font-bold">AlumniConnect</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 border-r border-border bg-card transition-transform md:relative md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-primary"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="text-xl font-bold">AlumniConnect</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          <nav className="flex-1 overflow-auto p-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-border p-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="hidden md:flex items-center justify-between gap-4 p-4 border-b border-border">
          <UserProfileHeader />
          <ThemeToggle />
        </div>
        <div className="flex-1 p-4 md:p-6 overflow-auto">{children}</div>
      </main>
    </div>
  );
}