import { z } from 'zod';

// User Profile Schemas
export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['student', 'alumni', 'admin']),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  skills: z.array(z.string()).optional(),
  github_url: z.string().url('Invalid URL').optional().nullable(),
  linkedin_url: z.string().url('Invalid URL').optional().nullable(),
  portfolio_url: z.string().url('Invalid URL').optional().nullable(),
});

export const studentProfileSchema = profileSchema.extend({
  batch_year: z.number().min(2000).max(new Date().getFullYear()),
  roll_number: z.string().min(1, 'Roll number is required'),
  leetcode_url: z.string().url('Invalid URL').optional().nullable(),
  codechef_url: z.string().url('Invalid URL').optional().nullable(),
  codeforces_url: z.string().url('Invalid URL').optional().nullable(),
});

export const alumniProfileSchema = profileSchema.extend({
  graduation_year: z.number().min(2000).max(new Date().getFullYear()),
  current_company: z.string().optional(),
  current_role: z.string().optional(),
  experience_years: z.number().min(0).optional(),
  is_mentorship_available: z.boolean().optional(),
});

// Connection Schemas
export const connectionSchema = z.object({
  requester_id: z.string().uuid(),
  receiver_id: z.string().uuid(),
  message: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'rejected']),
});

// Message Schemas
export const messageSchema = z.object({
  from_user_id: z.string().uuid(),
  to_user_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
  attachments: z.array(z.string().url()).optional(),
});

// Announcement Schemas
export const announcementSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(5000),
  type: z.enum(['general', 'event', 'opportunity']),
  target_roles: z.array(z.enum(['student', 'alumni', 'all'])),
  expires_at: z.date().optional(),
});

// Search Schemas
export const searchSchema = z.object({
  query: z.string().min(1).max(100),
  filters: z.object({
    role: z.enum(['student', 'alumni', 'all']).optional(),
    skills: z.array(z.string()).optional(),
    graduation_year: z.number().optional(),
    current_company: z.string().optional(),
  }).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional(),
});

// Job Board Schemas
export const jobPostSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters').max(100, 'Job title must be less than 100 characters'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters').max(100, 'Company name must be less than 100 characters'),
  job_type: z.enum(['internship', 'full-time', 'part-time', 'contract']),
  location: z.enum(['remote', 'onsite', 'hybrid']),
  required_skills: z.array(z.string()).min(1, 'At least one skill is required'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000, 'Description must be less than 5000 characters'),
  eligibility: z.enum(['student', 'alumni', 'both']),
  application_deadline: z.union([z.string(), z.date()]).optional(),
});

export const jobApplicationSchema = z.object({
  job_post_id: z.string().uuid(),
  resume_url: z.string().url('Invalid resume URL'),
  cover_message: z.string().max(1000, 'Cover message must be less than 1000 characters').optional(),
});

export const jobFilterSchema = z.object({
  job_type: z.enum(['internship', 'full-time', 'part-time', 'contract']).optional(),
  location: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  skills: z.array(z.string()).optional(),
  eligibility: z.enum(['student', 'alumni', 'both']).optional(),
  search: z.string().optional(),
  posted_by: z.enum(['admin', 'alumni']).optional(),
});

// API Response Types
export type ProfileResponse = z.infer<typeof profileSchema>;
export type StudentProfileResponse = z.infer<typeof studentProfileSchema>;
export type AlumniProfileResponse = z.infer<typeof alumniProfileSchema>;
export type ConnectionResponse = z.infer<typeof connectionSchema>;
export type MessageResponse = z.infer<typeof messageSchema>;
export type AnnouncementResponse = z.infer<typeof announcementSchema>;
export type SearchResponse = z.infer<typeof searchSchema>;
export type JobPostResponse = z.infer<typeof jobPostSchema>;
export type JobApplicationResponse = z.infer<typeof jobApplicationSchema>;
export type JobFilterResponse = z.infer<typeof jobFilterSchema>; 