import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserProfile {
    id: string;
    name: string;
    role: string;
    avatar_url: string | null;
    department?: string | null;
    current_position?: string | null;
    current_company?: string | null;
    bio?: string | null;
}

interface UserListItemProps {
    user: UserProfile;
    action?: React.ReactNode;
    onClick?: () => void;
    hideRole?: boolean;
}

export function UserListItem({ user, action, onClick, hideRole }: UserListItemProps) {
    return (
        <div
            className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={onClick}
        >
            <Link href={`/profile/${user.id}`}>
                <Avatar className="h-14 w-14 border">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/5 text-primary text-lg">
                        {user.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
                <div className="flex flex-col">
                    <Link href={`/profile/${user.id}`} className="hover:underline decoration-primary/50 underline-offset-4 w-fit">
                        <h3 className="font-semibold text-base leading-tight">
                            {user.name}
                        </h3>
                    </Link>
                    {!hideRole && (
                        <p className="text-sm text-foreground/80 mt-1 line-clamp-1">
                            {user.role === 'admin'
                                ? (user.current_position || 'Administrator')
                                : (user.current_position
                                    ? `${user.current_position} at ${user.current_company || ''}`
                                    : (user.role === 'student' ? 'Student' : 'Alumni'))
                            }
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {user.bio || user.department || 'Bio N/A'}
                    </p>
                </div>
            </div>

            {action && (
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    {action}
                </div>
            )}
        </div>
    );
}
