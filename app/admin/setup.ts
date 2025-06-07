import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function setupAdmin() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    try {
        // Update password for the admin user
        const { data, error } = await supabase.auth.admin.updateUserById(
            'id_of_admin_user', // You'll need to get this from the database
            { password: 'Admin@123' }
        );

        if (error) {
            console.error('Error updating admin password:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error in setupAdmin:', error);
        return { success: false, error };
    }
} 