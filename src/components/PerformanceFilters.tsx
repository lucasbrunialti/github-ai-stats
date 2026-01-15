"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PerformanceFiltersProps {
  developers: { id: string; username: string }[];
  organizations: { id: string; name: string }[];
  selectedDeveloper: string | null;
  selectedOrg: string | null;
  fromDate: Date | undefined;
  toDate: Date | undefined;
  onDeveloperChange: (developer: string | null) => void;
  onOrgChange: (org: string | null) => void;
  onFromDateChange: (date: Date | undefined) => void;
  onToDateChange: (date: Date | undefined) => void;
}

export function PerformanceFilters({
  developers,
  organizations,
  selectedDeveloper,
  selectedOrg,
  fromDate,
  toDate,
  onDeveloperChange,
  onOrgChange,
  onFromDateChange,
  onToDateChange,
}: PerformanceFiltersProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Organization Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Organization</label>
        <Select
          value={selectedOrg || "all"}
          onValueChange={(value) =>
            onOrgChange(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Organizations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.name}>
                {org.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Developer Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Developer</label>
        <Select
          value={selectedDeveloper || "all"}
          onValueChange={(value) =>
            onDeveloperChange(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Developers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Developers</SelectItem>
            {developers.map((dev) => (
              <SelectItem key={dev.id} value={dev.username}>
                {dev.username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* From Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">From Date</label>
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !fromDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fromDate ? format(fromDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fromDate}
              onSelect={(date) => {
                onFromDateChange(date);
                setFromOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* To Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">To Date</label>
        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !toDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {toDate ? format(toDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={toDate}
              onSelect={(date) => {
                onToDateChange(date);
                setToOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Clear Filters */}
      <Button
        variant="ghost"
        onClick={() => {
          onDeveloperChange(null);
          onOrgChange(null);
          onFromDateChange(undefined);
          onToDateChange(undefined);
        }}
        className="text-gray-500"
      >
        Clear Filters
      </Button>
    </div>
  );
}
