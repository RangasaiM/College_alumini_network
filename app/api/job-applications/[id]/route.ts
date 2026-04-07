import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getServerUserDetails } from '@/lib/supabase/auth-helpers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getServerUserDetails();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        job_post:job_posts(title, company_name, job_type, location, description),
        applicant_profile:users(name, email, role, department, batch_year, graduation_year, avatar_url)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching job application:', error);
      return NextResponse.json(
        { error: 'Failed to fetch application' },
        { status: 500 }
      );
    }

    // Check authorization: applicant, job owner, or admin
    const isAuthorized = 
      data.applicant_id === user.id ||
      user.role === 'admin' ||
      (await checkJobOwnership(supabase, data.job_post_id, user.id));

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in GET /api/job-applications/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getServerUserDetails();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Check if user can update this application
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select('job_post_id, applicant_id')
      .eq('id', params.id)
      .single();

    if (appError) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const isAuthorized = 
      application.applicant_id === user.id ||
      user.role === 'admin' ||
      (await checkJobOwnership(supabase, application.job_post_id, user.id));

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('job_applications')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job application:', error);
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in PUT /api/job-applications/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getServerUserDetails();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user owns this application
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select('applicant_id')
      .eq('id', params.id)
      .single();

    if (appError) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.applicant_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting job application:', error);
      return NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Application deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/job-applications/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check if user owns the job post
async function checkJobOwnership(supabase: any, jobId: string, userId: string): Promise<boolean> {
  const { data: jobPost } = await supabase
    .from('job_posts')
    .select('posted_by')
    .eq('id', jobId)
    .single();
  
  return jobPost?.posted_by === userId;
}