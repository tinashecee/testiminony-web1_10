import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { recordingsApi } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import type { Court, Courtroom } from "@/services/api";
import { UploadProgress } from "@/components/ui/upload-progress";
import { auditLogger } from "@/services/auditService";
import { useAuth } from "@/contexts/AuthContext";

interface AddRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  courts: Court[];
  courtrooms: Courtroom[];
  onUploadStart: (fileName: string) => void;
  onUploadProgress: (progress: number) => void;
  onUploadComplete: () => void;
}

export function AddRecordingModal({ isOpen, onClose, onSuccess, courts, courtrooms, onUploadStart, onUploadProgress, onUploadComplete }: AddRecordingModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [formData, setFormData] = useState({
    caseNumber: "",
    title: "",
    date: "",
    court: "",
    courtroom: "",
    judge: "",
    audioFile: null as File | null,
  });

  const filteredCourtrooms = courtrooms.filter(
    (room) => room.court_id === parseInt(selectedCourt)
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const allowedTypes = [
        'audio/wav',
        'audio/mpeg',
        'audio/mp3',
        'audio/mp4',
        'audio/x-m4a',
        'audio/aac',
        'audio/x-aac',
        'audio/m4a'
      ];
      
      const allowedExtensions = ['.wav', '.mp3', '.m4a'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid audio file (WAV, MP3, or M4A)",
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file size (optional - 100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 100MB",
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      setFormData((prev) => ({ ...prev, audioFile: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.audioFile) {
      toast({
        title: "Error",
        description: "Please select an audio file",
        variant: "destructive",
      });
      return;
    }

    try {
      onClose(); // Close modal immediately
      onUploadStart(formData.audioFile.name);
      
      const data = new FormData();
      data.append("case_number", formData.caseNumber);
      data.append("title", formData.title);
      data.append("date_stamp", formData.date);
      data.append("court", formData.court);
      data.append("courtroom", formData.courtroom);
      data.append("judge_name", formData.judge);
      data.append("audio_file", formData.audioFile);

      // Simulate upload progress (replace with actual upload progress when available)
      let currentProgress = 0;
      const uploadInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 10, 90);
        onUploadProgress(currentProgress);
      }, 500);

      await recordingsApi.addRecording(data);
      
      // Log recording upload event
      if (user?.email) {
        const fileExtension = formData.audioFile.name.toLowerCase().substring(formData.audioFile.name.lastIndexOf('.'));
        auditLogger.custom({
          user: user.email,
          action: 'Upload Recording',
          resource: 'Recording Management',
          details: `Uploaded recording: ${formData.title} (${formData.caseNumber}) - File: ${formData.audioFile.name} (${fileExtension.toUpperCase()})`,
          severity: 'medium',
          category: 'recording_management',
        });
      }
      
      clearInterval(uploadInterval);
      onUploadProgress(100);
      onUploadComplete();
      
      toast({
        title: "Success",
        description: "Recording added successfully",
      });
      
      onSuccess();
      setFormData({
        caseNumber: "",
        title: "",
        date: "",
        court: "",
        courtroom: "",
        judge: "",
        audioFile: null,
      });
    } catch (error) {
      console.error("Error adding recording:", error);
      toast({
        title: "Error",
        description: "Failed to add recording",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Recording</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="caseNumber">Case Number</Label>
            <Input
              id="caseNumber"
              value={formData.caseNumber}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, caseNumber: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Case Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="datetime-local"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="court">Court</Label>
            <Select
              value={selectedCourt}
              onValueChange={(value) => {
                setSelectedCourt(value);
                setFormData((prev) => ({
                  ...prev,
                  court: value,
                  courtroom: "", // Reset courtroom when court changes
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a court" />
              </SelectTrigger>
              <SelectContent>
                {courts.map((court) => (
                  <SelectItem key={court.court_id} value={court.court_id.toString()}>
                    {court.court_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="courtroom">Courtroom</Label>
            <Select
              value={formData.courtroom}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, courtroom: value }))
              }
              disabled={!selectedCourt}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a courtroom" />
              </SelectTrigger>
              <SelectContent>
                {filteredCourtrooms.map((room) => (
                  <SelectItem key={room.courtroom_id} value={room.courtroom_name}>
                    {room.courtroom_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="judge">Judge/Presiding Officer</Label>
            <Input
              id="judge"
              value={formData.judge}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, judge: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audioFile">Audio File</Label>
            <Input
              id="audioFile"
              type="file"
              accept=".wav,.mp3,.m4a,audio/wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/x-aac,audio/m4a"
              onChange={handleFileChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: WAV, MP3, M4A
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Recording"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 