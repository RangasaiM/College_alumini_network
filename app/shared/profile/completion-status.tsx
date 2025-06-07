'use client';

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface ProfileField {
  name: string;
  isComplete: boolean;
}

interface CompletionStatusProps {
  role: 'student' | 'alumni' | 'admin';
  profileData: any;
}

export function CompletionStatus({ role, profileData }: CompletionStatusProps) {
  const commonFields: ProfileField[] = [
    { name: 'Name', isComplete: !!profileData.name },
    { name: 'Department', isComplete: !!profileData.department },
    { name: 'Bio', isComplete: !!profileData.bio },
    { name: 'Skills', isComplete: !!(profileData.skills && profileData.skills.length > 0) },
  ];

  const studentFields: ProfileField[] = [
    ...commonFields,
    { name: 'Batch Year', isComplete: !!profileData.batch_year },
    { name: 'Expected Graduation', isComplete: !!profileData.graduation_year },
    { name: 'GitHub Profile', isComplete: !!profileData.github_url },
    { name: 'LinkedIn Profile', isComplete: !!profileData.linkedin_url },
  ];

  const alumniFields: ProfileField[] = [
    ...commonFields,
    { name: 'Current Company', isComplete: !!profileData.current_company },
    { name: 'Current Position', isComplete: !!profileData.current_position },
    { name: 'Years of Experience', isComplete: !!profileData.years_of_experience },
    { name: 'Location', isComplete: !!profileData.location },
    { name: 'LinkedIn Profile', isComplete: !!profileData.linkedin_url },
  ];

  const fields = role === 'student' ? studentFields : alumniFields;
  const completedFields = fields.filter(field => field.isComplete).length;
  const completionPercentage = (completedFields / fields.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Profile Completion
          <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
            {Math.round(completionPercentage)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={completionPercentage} className="h-2" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {fields.map((field, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              {field.isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={field.isComplete ? "text-muted-foreground" : "font-medium"}>
                {field.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 