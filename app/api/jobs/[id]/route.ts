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
      .from('job_posts')
      .select(`
        *,
        posted_by_profile:users(id, name, role, current_company, avatar_url),
        job_applications(count)
      `)
      .eq('id', params.id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Job post not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching job post:', error);
      return NextResponse.json(
        { error: 'Failed to fetch job post' },
        { status: 500 }
      );
    }

    // Check if user has already applied
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_post_id', params.id)
      .eq('applicant_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      ...data,
      application_count: data.job_applications?.[0]?.count || 0,
      job_applications: undefined,
      has_applied: !!existingApplication
    });

  } catch (error) {
    console.error('Error in GET /api/jobs/[id]:', error);
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

    // Check if user owns this post or is admin
    const { data: jobPost, error: postError } = await supabase
      .from('job_posts')
      .select('posted_by')
      .eq('id', params.id)
      .single();

    if (postError) {
      return NextResponse.json(
        { error: 'Job post not found' },
        { status: 404 }
      );
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (jobPost.posted_by !== user.id && userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const { data, error } = await supabase
      .from('job_posts')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating job post:', error);
      return NextResponse.json(
        { error: 'Failed to update job post' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in PUT /api/jobs/[id]:', error);
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

    // Check if user owns this post or is admin
    const { data: jobPost, error: postError } = await supabase
      .from('job_posts')
      .select('posted_by')
      .eq('id', params.id)
      .single();

    if (postError) {
      return NextResponse.json(
        { error: 'Job post not found' },
        { status: 404 }
      );
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (jobPost.posted_by !== user.id && userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('job_posts')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting job post:', error);
      return NextResponse.json(
        { error: 'Failed to delete job post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Job post deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/jobs/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}