"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  UserPlus,
  UserMinus,
  Calendar,
  Mail,
  Edit,
  Trash2,
  Loader2,
  Check,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import {
  transcriptionApi,
  usersApi,
  TranscriptionAssignment,
  User as UserType,
} from "@/services/api";
import { toast } from "sonner";

interface TranscriptionAssignmentsProps {
  caseId: number;
  caseNumber: string;
  currentUser: UserType;
}

export function TranscriptionAssignments({
  caseId,
  caseNumber,
  currentUser,
}: TranscriptionAssignmentsProps) {
  const [assignments, setAssignments] = useState<TranscriptionAssignment[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUserComboboxOpen, setIsUserComboboxOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Get selected user details
  const selectedUser = users.find(user => user.id?.toString() === selectedUserId);

  // Filter available users (not already assigned)
  const availableUsers = users.filter(
    (user) =>
      user.id &&
      !assignments.some(
        (assignment) => assignment.user_id === user.id
      )
  );

  // Filter users based on search query
  const filteredUsers = availableUsers.filter(user =>
    user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Load assignments and users
  useEffect(() => {
    loadData();
  }, [caseId]);

  // Handle user selection
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setIsUserComboboxOpen(false);
    setUserSearchQuery("");
  };

  // Reset form when dialog closes
  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
    setSelectedUserId("");
    setUserSearchQuery("");
    setIsUserComboboxOpen(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      console.log("Loading assignments for case:", caseId);
      console.log("API Base URL:", "http://142.93.56.4:5000");

      // First, try to get assignments for this specific case
      try {
        console.log("Trying to get assignments for case:", caseId);
        const testAssignments = await fetch(
          `/api/backend/transcription_users/${caseId}`,
          {
            method: "GET",
            mode: "cors",
          }
        );
        console.log(
          "Direct API test - Assignments for case status:",
          testAssignments.status
        );

        if (testAssignments.ok) {
          const assignmentsJson = await testAssignments.json();
          console.log(
            "Direct API test - Assignments for case data:",
            assignmentsJson
          );
          setAssignments(assignmentsJson);
        } else if (testAssignments.status === 404) {
          console.log(
            "Specific case endpoint not found, trying all assignments"
          );
          // Fallback to getting all assignments and filtering
          const allAssignmentsResponse = await fetch(
            "/api/backend/transcription_users",
            {
              method: "GET",
              mode: "cors",
            }
          );
          console.log(
            "All assignments API test status:",
            allAssignmentsResponse.status
          );

          if (allAssignmentsResponse.ok) {
            const allAssignmentsJson = await allAssignmentsResponse.json();
            console.log("All assignments data:", allAssignmentsJson);

            // Filter assignments for this case
            const filteredAssignments = allAssignmentsJson.filter(
              (assignment: any) => assignment.case_id === caseId
            );
            console.log(
              "Filtered assignments for case",
              caseId,
              ":",
              filteredAssignments
            );
            setAssignments(filteredAssignments);
          } else {
            console.error(
              "All assignments API failed:",
              allAssignmentsResponse.status,
              allAssignmentsResponse.statusText
            );
          }
        } else {
          console.error(
            "Assignments API failed:",
            testAssignments.status,
            testAssignments.statusText
          );
        }
      } catch (directError) {
        console.error("Direct API test error:", directError);
      }

      // Fetch available users for assignment
      try {
        // Test the users endpoint directly first
        console.log("Testing /users endpoint directly...");
        const testUsersResponse = await fetch("/api/backend/users", {
          method: "GET",
        });
        console.log(
          "Direct API test - Users status:",
          testUsersResponse.status
        );

        if (testUsersResponse.ok) {
          const usersJson = await testUsersResponse.json();
          console.log("Direct API test - Users data:", usersJson);
          console.log("Number of users from direct API:", usersJson.length);

          // Check the structure of the first user if any
          if (usersJson.length > 0) {
            console.log("First user structure:", usersJson[0]);
            console.log("User ID type:", typeof usersJson[0].id);
            console.log("User ID value:", usersJson[0].id);
          }

          setUsers(usersJson);
        } else {
          console.error(
            "Direct users API test failed:",
            testUsersResponse.status,
            testUsersResponse.statusText
          );
          // Try the usersApi as fallback
          const usersData = await usersApi.getUsers();
          console.log("Users loaded via usersApi:", usersData);
          console.log("Number of users loaded:", usersData.length);
          setUsers(usersData);
        }
      } catch (userError) {
        console.error("Failed to load users:", userError);
        // Set empty users array if API fails
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to load assignments: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    console.log("Adding assignment for case:", caseId, "user:", selectedUserId);
    setIsSubmitting(true);
    try {
      // Test the assignment endpoint directly first
      const assignmentData = {
        case_id: caseId,
        user_id: parseInt(selectedUserId),
      };
      console.log("Assignment data to send:", assignmentData);

      const testResponse = await fetch(
        "/api/backend/add_transcription_user",
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assignmentData),
        }
      );

      console.log("Assignment API response status:", testResponse.status);

      if (testResponse.ok) {
        const responseData = await testResponse.json();
        console.log("Assignment API response data:", responseData);
        toast.success("User assigned successfully");
        handleDialogClose();
        loadData();
      } else {
        const errorText = await testResponse.text();
        console.error("Assignment API failed:", testResponse.status, errorText);
        throw new Error(
          `Assignment failed: ${testResponse.status} ${errorText}`
        );
      }
    } catch (error) {
      console.error("Failed to add assignment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to assign user: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: number) => {
    console.log("Removing assignment with ID:", assignmentId);
    try {
      // Test the delete endpoint directly first
      const deleteResponse = await fetch(
        `/api/backend/transcription_users/${assignmentId}`,
        {
          method: "DELETE",
          mode: "cors",
        }
      );

      console.log("Delete API response status:", deleteResponse.status);

      if (deleteResponse.ok) {
        const responseData = await deleteResponse.json();
        console.log("Delete API response data:", responseData);
        toast.success("Assignment removed successfully");
        loadData();
      } else {
        const errorText = await deleteResponse.text();
        console.error("Delete API failed:", deleteResponse.status, errorText);
        throw new Error(`Delete failed: ${deleteResponse.status} ${errorText}`);
      }
    } catch (error) {
      console.error("Failed to remove assignment:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to remove assignment: ${errorMessage}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "transcriber":
        return "bg-blue-100 text-blue-800";
      case "super_admin":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Transcription Assignments
          <Badge variant="outline" className="ml-2">
            {assignments.length} assigned
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading assignments...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Debug info */}
            <div className="text-xs text-muted-foreground">
              Debug: {users.length} users loaded, {assignments.length}{" "}
              assignments
            </div>
            {/* Add Assignment Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign User to Case {caseNumber}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-select">Select User</Label>
                    <Popover open={isUserComboboxOpen} onOpenChange={setIsUserComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isUserComboboxOpen}
                          className="w-full justify-between">
                          {selectedUser ? (
                                <div className="flex items-center gap-2">
                              <span>{selectedUser.name}</span>
                                  <Badge
                                    variant="outline"
                                className={getRoleColor(selectedUser.role)}>
                                {selectedUser.role}
                                  </Badge>
                            </div>
                          ) : (
                            "Search and select a user..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search users by name, email, or role..."
                            value={userSearchQuery}
                            onValueChange={setUserSearchQuery}
                          />
                          <CommandList>
                            <CommandEmpty>
                              {availableUsers.length === 0 ? (
                                <div className="py-6 text-center text-sm">
                                  <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                  <p className="text-muted-foreground">
                                    {users.length === 0 
                                      ? "No users available" 
                                      : "All users are already assigned to this case"
                                    }
                                  </p>
                                </div>
                              ) : (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  <Search className="mx-auto h-8 w-8 mb-2" />
                                  <p>No users found matching "{userSearchQuery}"</p>
                                  <p className="text-xs mt-1">Try searching by name, email, or role</p>
                                </div>
                              )}
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredUsers.map((user) => (
                                <CommandItem
                                  key={user.id!}
                                  value={`${user.name} ${user.email} ${user.role}`}
                                  onSelect={() => handleUserSelect(user.id!.toString())}>
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedUserId === user.id?.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className="flex flex-col">
                                      <span className="font-medium">{user.name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {user.email}
                                      </span>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`ml-auto ${getRoleColor(user.role)}`}>
                                      {user.role}
                                    </Badge>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddAssignment}
                      disabled={isSubmitting || !selectedUserId}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        "Assign User"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Assignments List */}
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users assigned to this case</p>
                <p className="text-sm">Click "Assign User" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{assignment.user_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {assignment.user_email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          Assigned {formatDate(assignment.date_assigned)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Assignment #{assignment.id}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove Assignment
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove{" "}
                              {assignment.user_name} from this case? This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleRemoveAssignment(assignment.id)
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
