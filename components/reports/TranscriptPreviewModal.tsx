"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Copy,
  Download,
  FileText,
  Calendar,
  User,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  MessageSquare,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranscriptionAssignments } from "./TranscriptionAssignments";
import { TranscriptComments } from "./TranscriptComments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface RecordingTranscriptData {
  id: number;
  caseNumber: string;
  assignedTo: string;
  title: string;
  date: string;
  court: string;
  transcript: string;
  transcriptLength: number;
  wordCount: number;
  hasTranscript: boolean;
  transcriptStatus: "completed" | "in_progress" | "pending" | "review" | "none";
  lastModified?: string;
}

interface TranscriptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recording: RecordingTranscriptData | null;
}

export function TranscriptPreviewModal({
  isOpen,
  onClose,
  recording,
}: TranscriptPreviewModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedText, setHighlightedText] = useState("");
  const { user } = useAuth();

  if (!recording) return null;

  const handleCopyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(recording.transcript);
      toast.success("Transcript copied to clipboard");
    } catch (error) {
      console.error("Failed to copy transcript:", error);
      toast.error("Failed to copy transcript");
    }
  };

  const handleExportTranscript = () => {
    try {
      const content = `Case Number: ${recording.caseNumber}
Assigned To: ${recording.assignedTo}
Title: ${recording.title}
Date: ${new Date(recording.date).toLocaleDateString()}
Court: ${recording.court}
Word Count: ${recording.wordCount}
Transcript Progress: ${recording.transcriptStatus}

TRANSCRIPT:
${recording.transcript}`;

      const blob = new Blob([content], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transcript-${recording.caseNumber}-${
        new Date().toISOString().split("T")[0]
      }.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Transcript exported successfully");
    } catch (error) {
      console.error("Failed to export transcript:", error);
      toast.error("Failed to export transcript");
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "review":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "none":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    return text.replace(
      regex,
      '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
    );
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      const highlighted = highlightSearchTerm(recording.transcript, term);
      setHighlightedText(highlighted);
    } else {
      setHighlightedText("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-start">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <DialogTitle className="text-xl">
                  Transcript Preview
                </DialogTitle>
                <DialogDescription>
                  Case: {recording.caseNumber} - {recording.title}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Recording Details */}
        <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Date</p>
              <p className="text-sm text-muted-foreground">
                {new Date(recording.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Assigned To</p>
              <p
                className={`text-sm ${
                  recording.assignedTo === "Unassigned"
                    ? "text-muted-foreground italic"
                    : "text-foreground"
                }`}>
                {recording.assignedTo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Court</p>
              <p className="text-sm text-muted-foreground">{recording.court}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Word Count</p>
              <p className="text-sm text-muted-foreground">
                {recording.wordCount.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {recording.hasTranscript ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <div>
              <p className="text-sm font-medium">Transcript Progress</p>
              <Badge className={getProgressColor(recording.transcriptStatus)}>
                {recording.transcriptStatus.charAt(0).toUpperCase() +
                  recording.transcriptStatus.slice(1).replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 min-h-0 flex flex-col">
          <Tabs defaultValue="transcript" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger
                value="transcript"
                className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assignments
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" className="flex-1 min-h-0 flex flex-col mt-0">
              {/* Search and Actions */}
              <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 p-3 border-t">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search in transcript..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyTranscript}
                    className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportTranscript}
                    className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Transcript Content */}
              <div className="flex-1 min-h-[60vh] overflow-hidden border rounded-md">
                <ScrollArea className="h-full w-full">
                  <div className="p-2 pt-0 sm:p-3 sm:pt-0">
                    {recording.hasTranscript ? (
                      <div className="prose prose-sm max-w-none">
                        <div
                          className="whitespace-pre-wrap text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: highlightedText || recording.transcript,
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                          No Transcript Available
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          This recording does not have a transcript. The
                          transcript may be in progress or not yet generated for
                          this case.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="flex-1 min-h-0 flex flex-col mt-0">
              <div className="flex-1 min-h-[60vh] overflow-hidden border rounded-md">
                <ScrollArea className="h-full w-full">
                  <div className="p-2 pt-0 sm:p-3 sm:pt-0">
                    {user ? (
                      <TranscriptionAssignments
                        caseId={recording.id}
                        caseNumber={recording.caseNumber}
                        currentUser={user}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Please log in to view assignments</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 min-h-0 flex flex-col mt-0">
              <div className="flex-1 min-h-[60vh] overflow-hidden border rounded-md">
                <ScrollArea className="h-full w-full">
                  <div className="p-2 pt-0 sm:p-3 sm:pt-0">
                    {user ? (
                      <TranscriptComments
                        caseId={recording.id}
                        caseNumber={recording.caseNumber}
                        currentUser={user}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Please log in to view comments</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-between items-center p-3 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {recording.hasTranscript ? (
              <>
                {recording.wordCount.toLocaleString()} words •{" "}
                {recording.transcriptLength.toLocaleString()} characters
              </>
            ) : (
              "No transcript content available"
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
