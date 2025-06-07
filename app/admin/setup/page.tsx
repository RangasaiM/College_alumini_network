'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminSetup() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSetup = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/admin/setup', {
                method: 'POST',
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to setup admin user');
            }

            toast({
                title: 'Success',
                description: 'Admin user has been created successfully.',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to setup admin user',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="mx-auto max-w-md space-y-6 p-6">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold">Admin Setup</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Create admin user with email: rangasaimangalagiri@gmail.com
                    </p>
                </div>
                <Button
                    className="w-full"
                    onClick={handleSetup}
                    disabled={isLoading}
                >
                    {isLoading ? 'Setting up...' : 'Create Admin User'}
                </Button>
            </div>
        </div>
    );
} 