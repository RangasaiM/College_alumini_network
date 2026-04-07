"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploadProps {
    onImagesUploaded: (urls: string[]) => void;
    maxImages?: number;
}

export function ImageUpload({ onImagesUploaded, maxImages = 5 }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!e.target.files || e.target.files.length === 0) return;

            setUploading(true);
            const files = Array.from(e.target.files);

            if (previewUrls.length + files.length > maxImages) {
                toast.error(`You can only upload up to ${maxImages} images`);
                setUploading(false);
                return;
            }

            const uploadedUrls: string[] = [];
            const newPreviewUrls: string[] = [];

            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('announcement-images')
                    .upload(filePath, file);

                if (uploadError) {
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('announcement-images')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
                newPreviewUrls.push(publicUrl);
            }

            const updatedUrls = [...previewUrls, ...uploadedUrls];
            setPreviewUrls(updatedUrls);
            onImagesUploaded(updatedUrls);
            toast.success("Images uploaded successfully");
        } catch (error: any) {
            console.error("Error uploading images:", error);
            toast.error("Error uploading images");
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        const updatedUrls = previewUrls.filter((_, i) => i !== index);
        setPreviewUrls(updatedUrls);
        onImagesUploaded(updatedUrls);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    variant="outline"
                    disabled={uploading || previewUrls.length >= maxImages}
                    className="relative"
                >
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        onChange={handleUpload}
                        disabled={uploading || previewUrls.length >= maxImages}
                    />
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Images"}
                </Button>
                <p className="text-sm text-muted-foreground">
                    {previewUrls.length}/{maxImages} images
                </p>
            </div>

            {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previewUrls.map((url, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                            <Image
                                src={url}
                                alt={`Uploaded image ${index + 1}`}
                                fill
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
