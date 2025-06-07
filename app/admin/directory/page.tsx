export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { AdminDirectory } from "@/components/directory/admin-directory";
import { DirectoryLoading } from "@/components/directory/directory-loading";

export default function DirectoryPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">User Directory</h1>
      <Suspense fallback={<DirectoryLoading />}>
        <AdminDirectory />
      </Suspense>
    </div>
  );
} 