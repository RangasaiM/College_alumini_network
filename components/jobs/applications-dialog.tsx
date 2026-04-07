'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobApplication, ApplicationStatus } from '@/app/types/jobs';
import { Loader2, ExternalLink, FileText } from 'lucide-react';

interface ApplicationsDialogProps {
    jobId: string;
    jobTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApplicationsDialog({
    jobId,
    jobTitle,
    open,
    onOpenChange,
}: ApplicationsDialogProps) {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && jobId) {
            fetchApplications();
        }
    }, [open, jobId]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/job-applications?job_id=${jobId}`);
            if (!response.ok) throw new Error('Failed to fetch applications');
            const data = await response.json();
            setApplications(data.data);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: ApplicationStatus) => {
        switch (status) {
            case 'applied':
                return 'bg-blue-100 text-blue-800';
            case 'shortlisted':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'selected':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const updateStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
        try {
            const response = await fetch(`/api/job-applications/${applicationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                setApplications(apps =>
                    apps.map(app =>
                        app.id === applicationId ? { ...app, status: newStatus } : app
                    )
                );
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Applications for {jobTitle}</DialogTitle>
                    <DialogDescription>
                        View and manage candidates who have applied for this position.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : applications.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        No applications received yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Education</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Resume</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {applications.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{app.applicant_profile?.name}</p>
                                            <p className="text-xs text-muted-foreground">{app.applicant_profile?.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <p>{app.applicant_profile?.department}</p>
                                            <p className="text-xs text-muted-foreground">Batch {app.applicant_profile?.batch_year || app.applicant_profile?.graduation_year}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={getStatusColor(app.status)}>
                                            {app.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <a
                                            href={app.resume_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-blue-600 hover:underline text-sm"
                                        >
                                            <FileText className="h-4 w-4 mr-1" />
                                            View
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {app.status === 'applied' && (
                                                <>
                                                    <Button size="sm" variant="outline" onClick={() => updateStatus(app.id, 'shortlisted')}>Shortlist</Button>
                                                    <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, 'rejected')}>Reject</Button>
                                                </>
                                            )}
                                            {app.status === 'shortlisted' && (
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(app.id, 'selected')}>Select</Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
        </Dialog>
    );
}
