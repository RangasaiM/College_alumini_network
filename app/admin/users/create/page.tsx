'use client';

import { CreateAdminForm } from '../../../components/forms/create-admin-form';

export default function CreateAdminPage() {
    return (
        <div className="container mx-auto py-10">
            <div className="max-w-md mx-auto">
                <div className="space-y-6">
                    <div className="space-y-2 text-center">
                        <h1 className="text-3xl font-bold">Create Admin User</h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Create a new administrator account
                        </p>
                    </div>
                    <CreateAdminForm />
                </div>
            </div>
        </div>
    );
} 