"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface DirectorySearchProps {
  filterRole?: "student" | "alumni";
}

export function DirectorySearch({ filterRole }: DirectorySearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("query") || "");
  const [skill, setSkill] = useState(searchParams.get("skill") || "");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    searchParams.get("skills")?.split(",").filter(Boolean) || []
  );
  const [graduationYear, setGraduationYear] = useState(
    searchParams.get("year") || ""
  );

  // Available skills - in a real app, this might come from the database
  const availableSkills = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "Machine Learning",
    "Data Science",
    "Cloud Computing",
    "DevOps",
    "UI/UX Design",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new URLSearchParams
    const params = new URLSearchParams();
    
    // Add search parameters if they exist
    if (searchTerm) params.set("query", searchTerm);
    if (graduationYear) params.set("year", graduationYear);
    if (selectedSkills.length > 0) params.set("skills", selectedSkills.join(","));
    
    // If we're filtering by role, add that parameter
    if (filterRole) params.set("role", filterRole);
    
    // Navigate with the new parameters
    router.push(`${pathname}?${params.toString()}`);
  };
  
  const handleAddSkill = () => {
    if (skill && !selectedSkills.includes(skill)) {
      const newSkills = [...selectedSkills, skill];
      setSelectedSkills(newSkills);
      setSkill("");
    }
  };
  
  const handleRemoveSkill = (skillToRemove: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skillToRemove));
  };
  
  const handleClearFilters = () => {
    setSearchTerm("");
    setSkill("");
    setSelectedSkills([]);
    setGraduationYear("");
    router.push(pathname);
  };

  return (
    <div>
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search by name or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              {filterRole === "alumni" ? "Graduation Year" : "Batch Year"}
            </label>
            <Input
              type="number"
              placeholder="e.g. 2020"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">
              Skills
            </label>
            <div className="flex gap-2">
              <Select value={skill} onValueChange={setSkill}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a skill" />
                </SelectTrigger>
                <SelectContent>
                  {availableSkills.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddSkill}
                disabled={!skill}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        
        {(selectedSkills.length > 0 || searchTerm || graduationYear) && (
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Active Filters:</label>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClearFilters}
                className="text-xs h-auto py-1"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedSkills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleRemoveSkill(s)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {s}</span>
                  </Button>
                </Badge>
              ))}
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                </Badge>
              )}
              {graduationYear && (
                <Badge variant="secondary" className="gap-1">
                  Year: {graduationYear}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => setGraduationYear("")}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Clear year</span>
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}