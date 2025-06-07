interface BaseUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'alumni' | 'admin';
  department: string;
  bio?: string;
  is_approved: boolean;
}

interface StudentUser extends BaseUser {
  role: 'student';
  batch_year: number;
  github_url?: string;
  leetcode_url?: string;
  codechef_url?: string;
  codeforces_url?: string;
  linkedin_url?: string;
  skills?: string[];
}

interface AlumniUser extends BaseUser {
  role: 'alumni';
  graduation_year: number;
  current_company?: string;
  current_position?: string;
  experience_years?: number;
  is_mentorship_available: boolean;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  skills?: string[];
}

interface AdminUser extends BaseUser {
  role: 'admin';
  position: string;
}

type User = StudentUser | AlumniUser | AdminUser;

export type { User, BaseUser, StudentUser, AlumniUser, AdminUser }; 