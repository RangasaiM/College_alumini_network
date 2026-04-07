"use client";

import { useState, useEffect } from "react";
import { Upload, X, User, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileImageUploadProps {
    currentImageUrl?: string | null;
    onImageUploaded: (url: string) => void;
}

export function ProfileImageUpload({ currentImageUrl, onImageUploaded }: ProfileImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Update preview if currentImageUrl props changes (and we don't have a local preview pending upload? No, trust prop)
    useEffect(() => {
        setPreviewUrl(currentImageUrl || null);
    }, [currentImageUrl]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;

            setUploading(true);
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            // Use a folder for organization, though not strictly required
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setPreviewUrl(publicUrl);
            onImageUploaded(publicUrl);
            toast.success("Profile photo updated");
        } catch (error: any) {
            console.error("Error uploading image:", error);
            toast.error("Error uploading image");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <Avatar className="h-32 w-32 cursor-pointer border-4 border-background shadow-xl">
                    <AvatarImage src={previewUrl || ""} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-muted">
                        <User className="h-12 w-12 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>

                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="h-8 w-8 text-white" />
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </div>
            </div>

            <div className="flex flex-col items-center">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="relative"
                    disabled={uploading}
                >
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                    {uploading ? "Uploading..." : "Change Photo"}
                </Button>
            </div>
        </div>
    );
}
