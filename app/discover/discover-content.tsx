'use client';

import { useState, useEffect } from 'react';
import { UserCard } from '@/shared/users/user-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';

interface User {
  id: string;
  name: string;
  role: string;
  department?: string;
  current_company?: string;
  current_position?: string;
  avatar_url?: string;
  skills?: string[];
}

export function DiscoverContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to view users');
        return;
      }

      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', session.user.id);

      if (error) throw error;

      // Extract unique departments and companies
      const uniqueDepartments = Array.from(new Set(users.map(user => user.department).filter(Boolean)));
      const uniqueCompanies = Array.from(new Set(users.map(user => user.current_company).filter(Boolean)));

      setDepartments(uniqueDepartments);
      setCompanies(uniqueCompanies);
      setUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to connect with users');
        return;
      }

      const { error } = await supabase
        .from('connections')
        .insert([
          {
            requester_id: session.user.id,
            receiver_id: userId,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      toast.success('Connection request sent');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.current_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.current_position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || user.department === departmentFilter;
    const matchesCompany = !companyFilter || user.current_company === companyFilter;
    return matchesSearch && matchesDepartment && matchesCompany;
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <Input
          placeholder="Search by name, company, or position..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Companies</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company} value={company}>
                {company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            actions={
              <Button
                variant="outline"
                onClick={() => handleConnect(user.id)}
              >
                Connect
              </Button>
            }
          />
        ))}
      </div>
    </div>
  );
} 