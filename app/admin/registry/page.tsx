import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RegistryTable } from "./registry-table";

export const dynamic = 'force-dynamic';

async function getRegistryData() {
    const cookieStore = cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data, error } = await supabase
        .from('college_registry')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching registry:', error);
        return [];
    }

    return data;
}

export default async function RegistryPage() {
    const registryData = await getRegistryData();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">College Registry</h1>
                <p className="text-muted-foreground">
                    View all verified college members (Students & Alumni)
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Members</CardTitle>
                    <CardDescription>
                        List of all roll numbers and details belonging to the college.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RegistryTable initialData={registryData || []} />
                </CardContent>
            </Card>
        </div>
    );
}
