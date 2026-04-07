"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface RegistryTableProps {
    initialData: any[];
}

export function RegistryTable({ initialData }: RegistryTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const filteredData = initialData.filter((item) => {
        const matchesSearch =
            item.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = roleFilter === "all" || item.role?.toLowerCase() === roleFilter.toLowerCase();

        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Roll Number, Name or Email"
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="alumni">Alumni</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Roll Number</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>DOB</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Graduation Year</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">
                                    No records found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <TableRow key={item.roll_number}>
                                    <TableCell className="font-medium">{item.roll_number}</TableCell>
                                    <TableCell>{item.full_name}</TableCell>
                                    <TableCell>{item.email || "-"}</TableCell>
                                    <TableCell>{item.department || "-"}</TableCell>
                                    <TableCell>{item.gender || "-"}</TableCell>
                                    <TableCell>
                                        {item.date_of_birth
                                            ? new Date(item.date_of_birth).toLocaleDateString()
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.role === "student" ? "default" : "secondary"}>
                                            <span className="capitalize">{item.role}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{item.graduation_year}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="text-sm text-muted-foreground">
                Showing {filteredData.length} of {initialData.length} records
            </div>
        </div>
    );
}
