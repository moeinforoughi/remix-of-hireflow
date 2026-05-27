import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, Cardعنوان } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, Check, X, Plus, جستجو, Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogانصراف,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogعنوان,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  Dialogعنوان,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { TimePickerAMPM } from "@/components/ui/time-picker-ampm";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Task {
  id: string;
  title: string;
  label: string | null;
  due_date: string | null;
  status: "pending" | "completed";
  created_at: string;
  candidate_id: string;
  candidate?: {
    id: string;
    full_name: string;
  };
}

interface Candidate {
  id: string;
  full_name: string;
}

export default function وظایفPage() {
  const [tasks, setوظایف] = useState<Task[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setبارگذاری] = useState(true);
  const [searchQuery, setجستجوQuery] = useState("");
  const [statusفیلتر, setStatusفیلتر] = useState<"all" | "pending" | "completed">("all");
  const [deleteTaskId, setحذفTaskId] = useState<string | null>(null);
  const [editTask, setویرایشTask] = useState<Task | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Form states
  const [formعنوان, setFormعنوان] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formDueDate, setFormDueDate] = useState<Date | undefined>();
  const [formDueTime, setFormDueTime] = useState<string>("09:00");
  const [formStatus, setFormStatus] = useState<"pending" | "completed">("pending");
  const [formCandidateId, setFormCandidateId] = useState<string>("");
  const [isثبتting, setIsثبتting] = useState(false);

  const fetchData = async () => {
    setبارگذاری(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (profile?.org_id) {
        setOrgId(profile.org_id);

        const [tasksRes, candidatesRes] = await Promise.all([
          supabase
            .from("tasks")
            .select("*, candidate:candidates(id, full_name)")
            .eq("org_id", profile.org_id)
            .order("due_date", { ascending: true, nullsFirst: false }),
          supabase
            .from("candidates")
            .select("id, full_name")
            .eq("org_id", profile.org_id)
            .order("full_name")
        ]);

        if (tasksRes.data) {
          setوظایف(tasksRes.data as Task[]);
        }
        if (candidatesRes.data) {
          setCandidates(candidatesRes.data);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load tasks");
    } finally {
      setبارگذاری(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "pending" ? "completed" : "pending";
    const { error } = await supabase
      .from("tasks")
      .update({ status: newStatus })
      .eq("id", task.id);

    if (error) {
      toast.error("Failed to update task status");
      console.error(error);
      return;
    }

    toast.success(`Task marked as ${newStatus}`);
    fetchData();
  };

  const handleحذف = async () => {
    if (!deleteTaskId) return;

    const { error } = await supabase.from("tasks").delete().eq("id", deleteTaskId);

    if (error) {
      toast.error("Failed to delete task");
      console.error(error);
      return;
    }

    toast.success("Task deleted successfully");
    setحذفTaskId(null);
    fetchData();
  };

  const resetForm = () => {
    setFormعنوان("");
    setFormLabel("");
    setFormDueDate(undefined);
    setFormDueTime("09:00");
    setFormStatus("pending");
    setFormCandidateId("");
  };

  const handleAddTask = async () => {
    if (!formعنوان.trim() || !formCandidateId || !orgId) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsثبتting(true);
    try {
      let dueDateTime: string | null = null;
      if (formDueDate) {
        const date = new Date(formDueDate);
        if (formDueTime) {
          const [hours, minutes] = formDueTime.split(":").map(Number);
          date.setHours(hours, minutes);
        }
        dueDateTime = date.toISOString();
      }

      const { error } = await supabase.from("tasks").insert({
        title: formعنوان.trim(),
        label: formLabel.trim() || null,
        due_date: dueDateTime,
        status: formStatus,
        candidate_id: formCandidateId,
        org_id: orgId,
      });

      if (error) throw error;

      toast.success("Task created successfully");
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create task");
    } finally {
      setIsثبتting(false);
    }
  };

  const handleویرایشTask = async () => {
    if (!editTask || !formعنوان.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsثبتting(true);
    try {
      let dueDateTime: string | null = null;
      if (formDueDate) {
        const date = new Date(formDueDate);
        if (formDueTime) {
          const [hours, minutes] = formDueTime.split(":").map(Number);
          date.setHours(hours, minutes);
        }
        dueDateTime = date.toISOString();
      }

      const { error } = await supabase
        .from("tasks")
        .update({
          title: formعنوان.trim(),
          label: formLabel.trim() || null,
          due_date: dueDateTime,
          status: formStatus,
        })
        .eq("id", editTask.id);

      if (error) throw error;

      toast.success("Task updated successfully");
      setویرایشTask(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update task");
    } finally {
      setIsثبتting(false);
    }
  };

  const openویرایشDialog = (task: Task) => {
    setویرایشTask(task);
    setFormعنوان(task.title);
    setFormLabel(task.label || "");
    setFormStatus(task.status);
    if (task.due_date) {
      const date = new Date(task.due_date);
      setFormDueDate(date);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      setFormDueTime(`${hours}:${minutes}`);
    } else {
      setFormDueDate(undefined);
      setFormDueTime("09:00");
    }
  };

  const filteredوظایف = tasks.filter((task) => {
    const matchesجستجو = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.candidate?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusفیلتر === "all" || task.status === statusفیلتر;
    return matchesجستجو && matchesStatus;
  });

  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const completedCount = tasks.filter(t => t.status === "completed").length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">وظایف</h1>
          <p className="text-muted-foreground">
            {pendingCount} pending, {completedCount} completed
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <جستجو className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="جستجو tasks..."
            value={searchQuery}
            onChange={(e) => setجستجوQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={statusفیلتر} onValueChange={(v) => setStatusفیلتر(v as typeof statusفیلتر)}>
          <TabsList>
            <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
            <TabsTrigger value="pending">در انتظار ({pendingCount})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredوظایف.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {tasks.length === 0 ? "No tasks yet. ایجاد your first task!" : "No tasks match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredوظایف.map((task) => (
            <Card key={task.id} className={task.status === "completed" ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={cn("", task.status === "completed" && "line-through")}>
                        {task.title}
                      </h4>
                      {task.label && (
                        <Badge variant="outline" className="text-xs">
                          {task.label}
                        </Badge>
                      )}
                      <Badge
                        variant={task.status === "completed" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {task.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.due_date), "PPp")}
                        </span>
                      )}
                      {task.candidate && (
                        <Link 
                          to={`/candidates/${task.candidate.id}`}
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <User className="h-3 w-3" />
                          {task.candidate.full_name}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(task)}
                      title={task.status === "pending" ? "Mark as completed" : "Mark as pending"}
                    >
                      {task.status === "pending" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openویرایشDialog(task)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setحذفTaskId(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Task Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <Dialogعنوان>Add New Task</Dialogعنوان>
            <DialogDescription>
              ایجاد a new task linked to a candidate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان *</Label>
              <Input
                id="title"
                value={formعنوان}
                onChange={(e) => setFormعنوان(e.target.value)}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidate">Candidate *</Label>
              <Select value={formCandidateId} onValueChange={setFormCandidateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a candidate" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="e.g., Interview, Review, Follow-up"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formDueDate ? format(formDueDate, "PP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formDueDate}
                      onSelect={setFormDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Due Time</Label>
                <TimePickerAMPM value={formDueTime} onChange={setFormDueTime} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as typeof formStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              انصراف
            </Button>
            <Button onClick={handleAddTask} disabled={isثبتting}>
              {isثبتting ? "در حال ایجاد..." : "ایجاد Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ویرایش Task Dialog */}
      <Dialog open={!!editTask} onOpenChange={(open) => { if (!open) { setویرایشTask(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <Dialogعنوان>ویرایش Task</Dialogعنوان>
            <DialogDescription>
              به‌روزرسانی the task details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">عنوان *</Label>
              <Input
                id="edit-title"
                value={formعنوان}
                onChange={(e) => setFormعنوان(e.target.value)}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="e.g., Interview, Review, Follow-up"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formDueDate ? format(formDueDate, "PP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formDueDate}
                      onSelect={setFormDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Due Time</Label>
                <TimePickerAMPM value={formDueTime} onChange={setFormDueTime} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as typeof formStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">در انتظار</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setویرایشTask(null); resetForm(); }}>
              انصراف
            </Button>
            <Button onClick={handleویرایشTask} disabled={isثبتting}>
              {isثبتting ? "در حال به‌روزرسانی..." : "به‌روزرسانی Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حذف تأییدation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={() => setحذفTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogعنوان>حذف Task</AlertDialogعنوان>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogانصراف>انصراف</AlertDialogانصراف>
            <AlertDialogAction onClick={handleحذف}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
