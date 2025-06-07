import DashboardLayout from "@/components/layout/dashboard-layout";

export default function AdminMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="admin">{children}</DashboardLayout>;
} 