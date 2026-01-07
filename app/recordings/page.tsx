"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  MapPin,
  RefreshCw,
  FileText,
  Calendar as CalendarIcon,
  X,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDuration } from "@/lib/utils";
import {
  recordingsApi,
  type Recording,
  type Court,
  type Courtroom,
} from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function RecordingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Initialize state from URL params (preserves state when navigating back)
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams?.get("q") || "");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(searchParams?.get("court") || null);
  const [selectedCourtroom, setSelectedCourtroom] = useState<string | null>(searchParams?.get("courtroom") || null);
  const [pageSize, setPageSize] = useState(parseInt(searchParams?.get("size") || "10"));
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams?.get("page") || "1"));
  const [statusFilter, setStatusFilter] = useState(searchParams?.get("status") || "all");
  const [expandedCourts, setExpandedCourts] = useState<string[]>([]);
  const [alphabetFilter, setAlphabetFilter] = useState<string | null>(searchParams?.get("letter") || null);
  const [courtSearchQuery, setCourtSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: searchParams?.get("from") ? parseISO(searchParams.get("from")!) : undefined,
    to: searchParams?.get("to") ? parseISO(searchParams.get("to")!) : undefined,
  });

  // Update URL when state changes (for back button support)
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearchQuery) params.set("q", debouncedSearchQuery);
    if (selectedCourt) params.set("court", selectedCourt);
    if (selectedCourtroom) params.set("courtroom", selectedCourtroom);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (pageSize !== 10) params.set("size", pageSize.toString());
    if (alphabetFilter) params.set("letter", alphabetFilter);
    if (dateRange.from) params.set("from", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange.to) params.set("to", format(dateRange.to, "yyyy-MM-dd"));

    const newURL = params.toString() ? `/recordings?${params.toString()}` : "/recordings";
    window.history.replaceState(null, "", newURL);
  }, [debouncedSearchQuery, selectedCourt, selectedCourtroom, statusFilter, currentPage, pageSize, alphabetFilter, dateRange]);

  // Sync URL on state changes
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Debounce search query
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCourt, selectedCourtroom, statusFilter, dateRange, pageSize]);

  // --- TanStack Query Hooks ---

  // Courts
  const { data: courtsData } = useQuery({
    queryKey: ["courts"],
    queryFn: () => recordingsApi.getCourts(),
    staleTime: 15 * 60 * 1000,
  });

  // Courtrooms
  const { data: courtroomsData } = useQuery({
    queryKey: ["courtrooms"],
    queryFn: () => recordingsApi.getCourtrooms(),
    staleTime: 15 * 60 * 1000,
  });

  // All recordings (for court counts) - cached
  const { data: allRecordingsData, isLoading: isCountsLoading } = useQuery({
    queryKey: ["all-recordings-counts", user?.role, (user as any)?.district, (user as any)?.province, (user as any)?.region],
    queryFn: async () => {
      const role = user?.role;
      const params: any = {
        limit: 100000, // Get all for counting
        offset: 0,
      };
      if (["station_magistrate", "resident_magistrate"].includes(role || "") && (user as any)?.district) {
        params.district = (user as any).district;
      } else if (role === "provincial_magistrate" && (user as any)?.province) {
        params.province = (user as any).province;
      } else if (role === "regional_magistrate" && (user as any)?.region) {
        params.region = (user as any).region;
      }
      return await recordingsApi.getRecordingsPaginated(params);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Recordings with server-side search and filters
  const {
    data: recordingsResult,
    isLoading: isRecordingsLoading,
    isError: isRecordingsError,
    error: recordingsError,
    refetch: refetchRecordings,
    isRefetching: isRecordingsRefetching,
  } = useQuery({
    queryKey: [
      "recordings-page",
      debouncedSearchQuery,
      selectedCourt,
      selectedCourtroom,
      statusFilter,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      currentPage,
      pageSize,
      user?.role,
      (user as any)?.district,
      (user as any)?.province,
      (user as any)?.region,
    ],
    queryFn: async () => {
      const role = user?.role;
      const params: any = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        q: debouncedSearchQuery || undefined,
        court: selectedCourt || undefined,
        courtroom: selectedCourtroom || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        start_date: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        end_date: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        sort_by: "date_stamp",
        sort_dir: "desc",
      };

      // Role-based filtering
      if (["station_magistrate", "resident_magistrate"].includes(role || "") && (user as any)?.district) {
        params.district = (user as any).district;
      } else if (role === "provincial_magistrate" && (user as any)?.province) {
        params.province = (user as any).province;
      } else if (role === "regional_magistrate" && (user as any)?.region) {
        params.region = (user as any).region;
      }

      return await recordingsApi.getRecordingsPaginated(params);
    },
    enabled: !!user,
  });

  // --- Derived State ---
  const courts = useMemo(() => courtsData || [], [courtsData]);
  const courtrooms = useMemo(() => courtroomsData || [], [courtroomsData]);
  const recordings = recordingsResult?.items || [];
  const total = recordingsResult?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const isLoading = isRecordingsLoading || isSearching;

  // Get available alphabet letters from court names (only show letters that exist)
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    courts.forEach((court) => {
      const firstChar = court.court_name.charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstChar)) {
        letters.add(firstChar);
      } else {
        letters.add("#");
      }
    });
    return Array.from(letters).sort();
  }, [courts]);

  const filteredAndSortedCourts = useMemo(() => {
    return courts
      .filter((court) => {
        const matchesSearch = court.court_name
          .toLowerCase()
          .includes(courtSearchQuery.toLowerCase());
        const matchesAlphabet =
          !alphabetFilter || court.court_name.charAt(0).toUpperCase() === alphabetFilter;
        return matchesSearch && matchesAlphabet;
      })
      .sort((a, b) => a.court_name.localeCompare(b.court_name));
  }, [courts, courtSearchQuery, alphabetFilter]);

  // Calculate recording counts per court
  const courtRecordingCounts = useMemo(() => {
    const allRecordings = allRecordingsData?.items || [];
    const counts: Record<string, number> = {};
    allRecordings.forEach((rec) => {
      const courtName = rec.court || "";
      counts[courtName] = (counts[courtName] || 0) + 1;
    });
    return counts;
  }, [allRecordingsData]);

  // Total recordings count for "All Recordings"
  const totalRecordingsCount = allRecordingsData?.total || 0;

  // Check if any recording filters are active
  const hasActiveFilters =
    debouncedSearchQuery || statusFilter !== "all" || dateRange.from || dateRange.to;

  const toggleCourtExpansion = (courtId: string) => {
    setExpandedCourts((prev) =>
      prev.includes(courtId) ? prev.filter((id) => id !== courtId) : [...prev, courtId]
    );
  };

  const handleRecordingClick = (recordingId: number) => {
    router.push(`/recordings/${recordingId}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setStatusFilter("all");
    setDateRange({ from: undefined, to: undefined });
    setCurrentPage(1);
  };

  return (
    <div className="flex h-full">
      {/* Left Side - Courts Navigation */}
      <div className="w-72 bg-white border-r sticky top-0 h-screen flex flex-col shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-[#1B4D3E]">
          <h3 className="font-semibold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Courts & Courtrooms
            </span>
            <span className="text-sm font-normal opacity-80">
              ({isCountsLoading ? "..." : totalRecordingsCount.toLocaleString()})
            </span>
          </h3>
        </div>
        <div className="p-3 space-y-3 flex-1 overflow-hidden">
          {/* Court Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search courts..."
              value={courtSearchQuery}
              onChange={(e) => setCourtSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          {/* Alphabet Filter - Only show letters that exist in court names */}
          <ScrollArea className="h-10">
            <div className="flex gap-0.5">
              {availableLetters.map((letter) => (
                <Button
                  key={letter}
                  variant={alphabetFilter === letter ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-6 h-6 p-0 text-xs",
                    alphabetFilter === letter && "bg-[#1B4D3E] hover:bg-[#153e32]"
                  )}
                  onClick={() => setAlphabetFilter(alphabetFilter === letter ? null : letter)}
                >
                  {letter}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Courts List */}
          <ScrollArea className="flex-1 overflow-hidden">
            <div className="space-y-1 pr-2">
              {/* Show All Option */}
              <button
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-lg font-medium transition-all",
                  !selectedCourt && !selectedCourtroom
                    ? "bg-[#1B4D3E] text-white"
                    : "hover:bg-gray-100 text-gray-700"
                )}
                onClick={() => {
                  setSelectedCourt(null);
                  setSelectedCourtroom(null);
                }}
              >
                📋 All Recordings
                <span className="text-xs opacity-80 ml-2">({totalRecordingsCount.toLocaleString()})</span>
              </button>

              <div className="border-t my-2" />

              {filteredAndSortedCourts.map((court) => (
                <Collapsible
                  key={court.court_id}
                  open={expandedCourts.includes(court.court_id.toString())}
                  onOpenChange={() => toggleCourtExpansion(court.court_id.toString())}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all overflow-hidden",
                        selectedCourt === court.court_name && !selectedCourtroom
                          ? "bg-[#1B4D3E]/10 border-l-4 border-[#1B4D3E] text-[#1B4D3E] font-medium"
                          : "hover:bg-gray-100"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourt(court.court_name);
                        setSelectedCourtroom(null);
                      }}
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform shrink-0",
                          expandedCourts.includes(court.court_id.toString()) && "rotate-90"
                        )}
                      />
                      <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="flex-1 min-w-0 truncate text-left">{court.court_name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                        {isCountsLoading ? "..." : (courtRecordingCounts[court.court_name] || 0)}
                      </span>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="ml-6 space-y-1 mt-1">
                    {courtrooms
                      .filter((room) => room.court_id === court.court_id)
                      .map((room) => (
                        <button
                          key={room.courtroom_id}
                          onClick={() => {
                            setSelectedCourtroom(room.courtroom_name);
                            setSelectedCourt(court.court_name);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-sm rounded-lg transition-all",
                            selectedCourtroom === room.courtroom_name
                              ? "bg-[#1B4D3E]/10 border-l-4 border-[#1B4D3E] text-[#1B4D3E] font-medium"
                              : "hover:bg-gray-100 text-gray-600"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {room.courtroom_name}
                          </span>
                        </button>
                      ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right Side - Main Content */}
      <div className="flex-1 p-6 bg-gray-50/50 overflow-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E]">
                {selectedCourtroom
                  ? `${selectedCourtroom}`
                  : selectedCourt
                    ? `${selectedCourt}`
                    : "All Recordings"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {selectedCourt && !selectedCourtroom && `Court: ${selectedCourt} • `}
                {selectedCourtroom && `Courtroom: ${selectedCourtroom} in ${selectedCourt} • `}
                {total.toLocaleString()} recordings found
              </p>
            </div>
            <div className="flex items-center gap-2">
              {(selectedCourt || selectedCourtroom) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCourt(null);
                    setSelectedCourtroom(null);
                  }}
                  className="text-sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Court Filter
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetchRecordings()}
                disabled={isRecordingsRefetching}
                className="rounded-full"
              >
                <RefreshCw className={cn("h-4 w-4", isRecordingsRefetching && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>

        {/* Recordings Card */}
        <Card className="border-none shadow-md relative">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1B4D3E]">
                Recordings
              </CardTitle>
              {(isLoading || isRecordingsRefetching) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
                  <RefreshCw className="h-3 w-3 animate-spin text-[#1B4D3E]" />
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                {isSearching ? (
                  <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1B4D3E] animate-spin" />
                ) : (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
                <Input
                  placeholder="Search case number, title, judge..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal min-w-[200px] bg-white",
                      !dateRange.from && !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM d, yyyy")
                      )
                    ) : (
                      <span>Date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="transcription_failed">Transcription Failed</SelectItem>
                </SelectContent>
              </Select>

              {/* Page Size */}
              <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-[110px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="text-sm">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Error Alert */}
            {isRecordingsError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {(recordingsError as Error)?.message || "Failed to load recordings"}
                </AlertDescription>
              </Alert>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#1B4D3E] text-white">
                    <th className="text-left py-3 px-4 font-medium">Case Number</th>
                    <th className="text-left py-3 px-4 font-medium">Title</th>
                    <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Court</th>
                    <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Duration</th>
                    <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-center py-3 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td colSpan={7} className="py-4 px-4">
                          <div className="h-6 bg-gray-100 rounded animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : recordings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p>No recordings found</p>
                        {hasActiveFilters && (
                          <Button variant="link" onClick={clearFilters} className="mt-2">
                            Clear filters
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    recordings.map((recording, index) => (
                      <tr
                        key={recording.id}
                        className={`border-b border-gray-100 hover:bg-[#1B4D3E]/5 transition-colors cursor-pointer ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        onClick={() => handleRecordingClick(recording.id)}
                      >
                        <td className="py-3 px-4 font-medium text-[#1B4D3E]">
                          {recording.case_number}
                        </td>
                        <td className="py-3 px-4 text-gray-700 max-w-[200px] truncate">
                          {recording.title}
                        </td>
                        <td className="py-3 px-4 text-gray-500 hidden md:table-cell">
                          {recording.court || "Unknown"}
                        </td>
                        <td className="py-3 px-4 text-gray-500 hidden lg:table-cell">
                          {formatDuration(recording.duration)}
                        </td>
                        <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">
                          {new Date(recording.date_stamp).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 min-w-[120px]">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${recording.status === "completed" || recording.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : recording.status === "pending" || recording.status === "Pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : recording.status === "processing" || recording.status === "Processing"
                                  ? "bg-blue-100 text-blue-700"
                                  : recording.status?.includes("failed")
                                    ? "bg-red-100 text-red-700"
                                    : recording.status === "open" || recording.status === "Open"
                                      ? "bg-gray-100 text-gray-600"
                                      : "bg-gray-100 text-gray-700"
                              }`}
                            title={recording.status || "Open"}
                          >
                            {(recording.status || "Open").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-[#1B4D3E] hover:bg-[#153e32] text-white rounded-md text-xs px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecordingClick(recording.id);
                            }}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!isLoading && recordings.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} of {total.toLocaleString()} recordings
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-md"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center px-3 text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-md"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
