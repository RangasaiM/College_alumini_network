export type JobType = 'internship' | 'full-time' | 'part-time' | 'contract';
export type JobLocation = 'remote' | 'onsite' | 'hybrid';
export type EligibilityType = 'student' | 'alumni' | 'both';
export type ApplicationStatus = 'applied' | 'shortlisted' | 'rejected' | 'selected';

export interface JobPost {
  id: string;
  title: string;
  company_name: string;
  job_type: JobType;
  location: JobLocation;
  required_skills: string[];
  description: string;
  eligibility: EligibilityType;
  application_deadline?: string;
  posted_by: string;
  posted_by_profile?: {
    name: string;
    role: 'admin' | 'alumni';
    current_company?: string;
    avatar_url?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  application_count?: number;
  has_applied?: boolean;
}

export interface JobApplication {
  id: string;
  job_post_id: string;
  applicant_id: string;
  applicant_profile?: {
    name: string;
    email: string;
    role: 'student' | 'alumni';
    department?: string;
    batch_year?: number;
    graduation_year?: number;
    avatar_url?: string;
  };
  job_post?: {
    title: string;
    company_name: string;
    job_type: JobType;
    location: JobLocation;
    description: string;
  };
  resume_url: string;
  cover_message?: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface JobFilterOptions {
  job_type?: JobType;
  location?: JobLocation;
  skills?: string[];
  eligibility?: EligibilityType;
  search?: string;
  posted_by?: 'admin' | 'alumni';
}

export interface CreateJobPostData {
  title: string;
  company_name: string;
  job_type: JobType;
  location: JobLocation;
  required_skills: string[];
  description: string;
  eligibility: EligibilityType;
  application_deadline?: Date | string;
}

export interface ApplyToJobData {
  job_post_id: string;
  resume_url: string;
  cover_message?: string;
}

export interface UpdateApplicationStatusData {
  application_id: string;
  status: ApplicationStatus;
}