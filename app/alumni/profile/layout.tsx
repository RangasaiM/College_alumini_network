import DashboardLayout from "@/components/layout/dashboard-layout";

export default function AlumniProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout role="alumni">{children}</DashboardLayout>;
} 