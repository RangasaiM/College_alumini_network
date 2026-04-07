"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Autoplay from "embla-carousel-autoplay";

interface Announcement {
    id: string;
    title: string;
    content: string;
    images: string[] | null;
    created_at: string;
}

interface AnnouncementsCarouselProps {
    announcements: Announcement[];
}

export function AnnouncementsCarousel({ announcements }: AnnouncementsCarouselProps) {
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    if (!announcements.length) {
        return (
            <div className="text-center py-6">
                <p className="text-muted-foreground">No announcements yet.</p>
            </div>
        );
    }

    return (
        <>
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 4000,
                    }),
                ]}
                className="w-full"
            >
                <CarouselContent className="">
                    {announcements.map((announcement) => (
                        <CarouselItem key={announcement.id} className="basis-full">
                            <div
                                className="relative aspect-[21/9] md:aspect-[3/1] w-full overflow-hidden rounded-xl cursor-pointer group"
                                onClick={() => setSelectedAnnouncement(announcement)}
                            >
                                {announcement.images && announcement.images.length > 0 ? (
                                    <Image
                                        src={announcement.images[0]}
                                        alt={announcement.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary/40" />
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                <div className="absolute bottom-0 left-0 p-6 md:p-8 text-white w-full">
                                    <h3 className="text-xl md:text-3xl font-bold mb-2 line-clamp-1 group-hover:underline decoration-2 underline-offset-4">
                                        {announcement.title}
                                    </h3>

                                    <p className="text-xs md:text-sm text-white/70 font-medium bg-black/30 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                                        {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {announcements.length > 1 && (
                    <div className="hidden md:block">
                        <CarouselPrevious className="left-4 bg-black/20 hover:bg-black/40 text-white border-white/20" />
                        <CarouselNext className="right-4 bg-black/20 hover:bg-black/40 text-white border-white/20" />
                    </div>
                )}
            </Carousel>

            <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">{selectedAnnouncement?.title}</DialogTitle>
                        <DialogDescription>
                            Posted {selectedAnnouncement && formatDistanceToNow(new Date(selectedAnnouncement.created_at), { addSuffix: true })}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {selectedAnnouncement?.images && selectedAnnouncement.images.length > 0 && (
                            <Carousel className="w-full">
                                <CarouselContent>
                                    {selectedAnnouncement.images.map((image, index) => (
                                        <CarouselItem key={index}>
                                            <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                                                <Image
                                                    src={image}
                                                    alt={`${selectedAnnouncement.title} - Image ${index + 1}`}
                                                    fill
                                                    className="object-contain bg-black/5"
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {selectedAnnouncement.images.length > 1 && (
                                    <>
                                        <CarouselPrevious className="left-2" />
                                        <CarouselNext className="right-2" />
                                    </>
                                )}
                            </Carousel>
                        )}

                        <div className="whitespace-pre-wrap text-foreground">
                            {selectedAnnouncement?.content}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
