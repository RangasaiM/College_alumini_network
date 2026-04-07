# Job & Internship Board Module

## Overview
A comprehensive job and internship board module for the College Alumni Network platform that connects students and alumni with career opportunities.

## Features

### User Roles
- **Admin**: Can post jobs, manage all applications, and moderate the board
- **Alumni**: Can post job/internship opportunities and manage their own posts
- **Student**: Can browse jobs and apply to eligible positions

### Job Posting Features
- Create job/internship posts with detailed information
- Specify job type (Internship, Full-time, Part-time, Contract)
- Set location (Remote, On-site, Hybrid)
- Define required skills
- Set eligibility criteria (Students only, Alumni only, Both)
- Add application deadlines
- Track application counts

### Browsing & Filtering
- Search by job title or company name
- Filter by:
  - Job type
  - Location
  - Skills
  - Eligibility
  - Posted by (Admin/Alumni)
- Pagination for better performance
- Responsive card-based layout

### Application System
- Students and alumni can apply to eligible positions
- Resume upload via URL (Google Drive, Dropbox, etc.)
- Optional cover messages
- Application status tracking:
  - Applied
  - Shortlisted
  - Rejected
  - Selected
- Prevent duplicate applications

### Admin Dashboard
- View all job posts and applications
- Manage job postings (edit/delete)
- Update application statuses
- Monitor platform activity

### User Dashboard
- Track personal applications
- View application status history
- Cancel pending applications
- Access submitted resumes

## Technical Implementation

### Database Schema
**Tables:**
- `job_posts` - Stores job/internship listings
- `job_applications` - Tracks user applications

**Custom Types:**
- `job_type` - internship, full-time, part-time, contract
- `job_location` - remote, onsite, hybrid
- `eligibility_type` - student, alumni, both
- `application_status` - applied, shortlisted, rejected, selected

### API Routes
- `GET /api/jobs` - Fetch job listings with filtering
- `POST /api/jobs` - Create new job post
- `GET /api/jobs/[id]` - Get specific job details
- `PUT /api/jobs/[id]` - Update job post
- `DELETE /api/jobs/[id]` - Delete job post
- `GET /api/job-applications` - Fetch applications
- `POST /api/job-applications` - Submit application
- `PUT /api/job-applications/[id]` - Update application status
- `DELETE /api/job-applications/[id]` - Cancel application

### Frontend Components
- **Pages:**
  - `/jobs` - Main job board listing
  - `/jobs/post` - Job posting form
  - `/jobs/[id]` - Individual job details
  - `/jobs/my-applications` - User's applications
  - `/admin/jobs` - Admin management dashboard

- **Components:**
  - Job cards with filtering
  - Application forms
  - Status management interfaces
  - Navigation components

### Security Features
- Row Level Security (RLS) policies
- Role-based access control
- User authentication required
- Authorization checks for all operations
- Data validation with Zod schemas

## Usage Instructions

### For Alumni/Admins (Posting Jobs):
1. Navigate to `/jobs/post`
2. Fill in job details:
   - Title and company name
   - Job type and location
   - Required skills (add using Enter or + button)
   - Detailed description
   - Eligibility criteria
   - Optional deadline
3. Submit the job post

### For Students/Alumni (Applying):
1. Browse jobs at `/jobs`
2. Use filters to narrow down opportunities
3. Click on job to view details
4. Click "Apply Now" if eligible
5. Provide resume URL and optional cover message
6. Track applications in "My Applications"

### For Admins (Management):
1. Access `/admin/jobs` dashboard
2. View all job posts and applications
3. Update application statuses
4. Moderate content as needed

## Validation Rules
- Job titles: 3-100 characters
- Company names: 2-100 characters
- Descriptions: 20-5000 characters
- At least one required skill
- Valid URLs for resume submissions
- Proper date formatting for deadlines

## Future Enhancements
- Email notifications for application updates
- Saved job searches
- Application tracking analytics
- Interview scheduling integration
- Company profile pages
- Salary range display
- Experience level filtering

## Dependencies
- Next.js 14
- React Hook Form
- Zod validation
- Supabase (database and auth)
- Tailwind CSS
- Shadcn/ui components
- Lucide React icons

This module provides a complete job board solution that encourages alumni engagement while helping students find career opportunities.