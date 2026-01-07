"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  Building2,
  AlertTriangle,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Activity,
} from "lucide-react";
import { cn, formatDuration, getCourtNameForRecording } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  recordingsApi,
  type Recording,
  type Court,
  type Courtroom,
  type User,
} from "@/services/api";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showUploadProgress } from "@/components/ui/upload-progress";

const AddRecordingModal = dynamic(
  () =>
    import("./recording/AddRecordingModal").then((m) => m.AddRecordingModal),
  {
    ssr: false,
    loading: () => null,
  }
);

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddRecordingOpen, setIsAddRecordingOpen] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>("");

  // Debounce search query for better UX
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    }
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
      setCurrentPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // --- Queries ---

  // 1. Recordings (Main List - for when there's no search)
  const {
    data: recordingsData,
    isLoading: isRecordingsLoading,
    isError: isRecordingsError,
    error: recordingsError,
    refetch: refetchRecordings,
    isRefetching: isRecordingsRefetching,
  } = useQuery({
    queryKey: [
      "recordings",
      user?.role,
      (user as any)?.district,
      (user as any)?.province,
      (user as any)?.region,
    ],
    queryFn: async () => {
      const role = user?.role;
      if (
        ["station_magistrate", "resident_magistrate"].includes(role || "") &&
        (user as any)?.district
      ) {
        return await recordingsApi.getRecordingsByDistrict(
          (user as any).district as string
        );
      } else if (role === "provincial_magistrate" && (user as any)?.province) {
        return await recordingsApi.getRecordingsByProvince(
          (user as any).province as string
        );
      } else if (role === "regional_magistrate" && (user as any)?.region) {
        return await recordingsApi.getRecordingsByRegion(
          (user as any).region as string
        );
      } else {
        const res = await recordingsApi.getRecordingsPaginated({
          limit: 100,
          offset: 0,
          sort_by: "date_stamp",
          sort_dir: "desc",
        });
        return res.items;
      }
    },
    enabled: !!user && !debouncedSearchQuery, // Only fetch when no search query
  });

  // 2. Server-side Search Query (searches entire database)
  const {
    data: searchResultsData,
    isLoading: isSearchLoading,
    isError: isSearchError,
    error: searchError,
  } = useQuery({
    queryKey: ["recordings-search", debouncedSearchQuery, currentPage, pageSize],
    queryFn: async () => {
      const res = await recordingsApi.getRecordingsPaginated({
        q: debouncedSearchQuery,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        sort_by: "date_stamp",
        sort_dir: "desc",
      });
      return res;
    },
    enabled: !!user && !!debouncedSearchQuery, // Only fetch when there's a search query
  });

  // 3. Stats: Total Recordings (Count only)

  const { data: totalRecordingsCount } = useQuery({
    queryKey: ["stats", "totalRecordings"],
    queryFn: async () => {
      const res = await recordingsApi.getRecordingsPaginated({ limit: 1 });
      return res.total;
    },
    staleTime: 5 * 60 * 1000,
  });

  // 3. Stats: Active Users
  const { data: usersList } = useQuery({
    queryKey: ["stats", "users"],
    queryFn: () => recordingsApi.getUsers(),
    staleTime: 10 * 60 * 1000,
  });

  // 4. Stats: Active Courts
  const { data: courtsList } = useQuery({
    queryKey: ["stats", "courts"],
    queryFn: () => recordingsApi.getCourts(),
    staleTime: 15 * 60 * 1000,
  });

  // 5. Courtrooms (for mapping names)
  const { data: courtroomsList } = useQuery({
    queryKey: ["courtrooms"],
    queryFn: () => recordingsApi.getCourtrooms(),
    staleTime: 15 * 60 * 1000,
  });

  // --- Derived State ---

  // Use search results when searching, otherwise use regular recordings
  const isActiveSearch = !!debouncedSearchQuery;
  const recordings = useMemo(() => {
    if (isActiveSearch && searchResultsData) {
      return searchResultsData.items || [];
    }
    return recordingsData || [];
  }, [isActiveSearch, searchResultsData, recordingsData]);

  const courts = useMemo(() => courtsList || [], [courtsList]);
  const courtrooms = useMemo(() => courtroomsList || [], [courtroomsList]);

  // When searching server-side, we don't need to filter locally
  const paginatedRecordings = useMemo(() => {
    if (isActiveSearch) {
      // Server already handles pagination and filtering
      return recordings;
    }
    // Local pagination for non-search view
    const startIndex = (currentPage - 1) * pageSize;
    return recordings.slice(startIndex, startIndex + pageSize);
  }, [isActiveSearch, recordings, currentPage, pageSize]);

  // Total count and pages - from server when searching
  const totalCount = isActiveSearch
    ? (searchResultsData?.total || 0)
    : recordings.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Combined loading states
  const isLoading = isActiveSearch ? isSearchLoading : isRecordingsLoading;
  const hasError = isActiveSearch ? isSearchError : isRecordingsError;
  const errorObj = isActiveSearch ? searchError : recordingsError;

  // Stats Card Data
  const stats = [
    {
      title: "Total Recordings",
      value: totalRecordingsCount?.toLocaleString() || "...",
      icon: FileText,
      description: "Audio recordings",
      trend: "+12%",
      trendUp: true,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Active Users",
      value: usersList?.length.toString() || "...",
      icon: Users,
      description: "Registered users",
      trend: "+5%",
      trendUp: true,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
    {
      title: "Active Courts",
      value: courtsList?.length.toString() || "...",
      icon: Building2,
      description: "Connected courts",
      trend: "Stable",
      trendUp: true,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ];

  // --- Handlers ---

  const handleRecordingClick = (recordingId: number) => {
    router.push(`/recordings/${recordingId}`);
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    return now.toLocaleString("default", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1B4D3E]">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of court recording activities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-muted-foreground shadow-sm border">
            <Calendar className="h-4 w-4" />
            {getCurrentMonthYear()}
          </div>
          <Button
            onClick={() => setIsAddRecordingOpen(true)}
            className="rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-[#1B4D3E] hover:bg-[#153e32]"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Recording
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            className="border-none shadow-md hover:shadow-lg transition-all duration-300 group"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="flex items-center mt-2 text-xs">
                {stat.trendUp ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span
                  className={
                    stat.trendUp ? "text-green-600" : "text-red-600"
                  }
                >
                  {stat.trend}
                </span>
                <span className="text-muted-foreground ml-2">
                  {stat.description}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Recent Recordings Section */}
      <Card className="border-none shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold text-[#1B4D3E]">
                Recent Recordings
              </CardTitle>
              <CardDescription>
                Manage and view latest court summaries
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-gray-100"
                onClick={() => refetchRecordings()}
                disabled={isRecordingsRefetching}
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4 text-muted-foreground",
                    isRecordingsRefetching && "animate-spin"
                  )}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="relative flex-1">
              {isSearching ? (
                <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1B4D3E] animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              )}
              <Input
                placeholder="Search case number, title, court, date, status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:border-[#1B4D3E] focus:ring-[#1B4D3E] rounded-lg"
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
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[110px] bg-white rounded-lg">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 rows</SelectItem>
                <SelectItem value="10">10 rows</SelectItem>
                <SelectItem value="20">20 rows</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Alert */}
          {hasError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {(errorObj as Error)?.message ||
                  "Failed to load recordings"}
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
                {(isLoading || isSearching) ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td colSpan={7} className="py-4 px-4">
                        <div className="relative overflow-hidden h-8 bg-gray-200 rounded">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedRecordings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p>No recordings found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedRecordings.map((recording, index) => (
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
                        {getCourtNameForRecording(recording, courts, courtrooms) || "Unknown"}
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
                                  : "bg-gray-100 text-gray-600"
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
          {!isLoading && paginatedRecordings.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} recordings
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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



      <AddRecordingModal
        isOpen={isAddRecordingOpen}
        onClose={() => setIsAddRecordingOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["recordings"] });
          queryClient.invalidateQueries({ queryKey: ["stats"] });
        }}
        courts={courts}
        courtrooms={courtrooms}
        onUploadStart={(fileName) => {
          setCurrentFileName(fileName);
          showUploadProgress(fileName, 0);
        }}
        onUploadProgress={(progress) => {
          showUploadProgress(currentFileName, progress);
        }}
        onUploadComplete={() => {
          showUploadProgress(currentFileName, 100);
          setTimeout(() => {
            setCurrentFileName("");
          }, 2000);
        }}
      />
    </div >
  );
}
