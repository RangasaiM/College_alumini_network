import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center gap-2">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading content...</p>
        </div>
    );
}
