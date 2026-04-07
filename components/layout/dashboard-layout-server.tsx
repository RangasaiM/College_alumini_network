import DashboardLayout from './dashboard-layout';

interface DashboardLayoutServerProps {
  children: React.ReactNode;
  role: "student" | "alumni" | "admin";
}

export default async function DashboardLayoutServer({
  children,
  role,
}: DashboardLayoutServerProps) {
  return <DashboardLayout role={role}>{children}</DashboardLayout>;
}