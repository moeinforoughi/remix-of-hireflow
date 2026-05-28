import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { TimePickerAMPM } from "@/components/ui/time-picker-ampm";

interface Task {
  id: string;
  title: string;
  label: string | null;
  due_date: string | null;
  status: "pending" | "completed";
}

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskRefreshd: () => void;
}

export function EditTaskDialog({ task, open, onOpenChange, onTaskRefreshd }: EditTaskDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [label, setLabel] = useState(task.label || "");
  const [dueDate, setDueDate] = useState<تاریخ | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );
  const [dueTime, setDueTime] = useState(
    task.due_date ? format(new Date(task.due_date), "HH:mm") : "12:00"
  );
  const [status, setStatus] = useState<"pending" | "completed">(task.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setLabel(task.label || "");
    setDueDate(task.due_date ? new Date(task.due_date) : undefined);
    setDueTime(task.due_date ? format(new Date(task.due_date), "HH:mm") : "12:00");
    setStatus(task.status);
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("عنوان is required");
      return;
    }

    setIsSubmitting(true);

    let dueDatetime = null;
    if (dueDate) {
      const [hours, minutes] = dueTime.split(":");
      const datetime = new Date(dueDate);
      datetime.setHours(parseInt(hours), parseInt(minutes), 0);
      dueDatetime = datetime.toISOString();
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        title: title.trim(),
        label: label.trim() || null,
        due_date: dueDatetime,
        status,
      })
      .eq("id", task.id);

    setIsSubmitting(false);

    if (error) {
      toast.error("Failed to update task");
      console.error(error);
      return;
    }

    toast.success("Task updated successfully");
    onOpenChange(false);
    onTaskRefreshd();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ویرایش Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="اختیاری label"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due تاریخ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>زمان</Label>
              <TimePickerAMPM
                value={dueTime}
                onChange={setDueTime}
                disabled={!dueDate}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">وضعیت</Label>
            <Select value={status} onValueChange={(value: "pending" | "completed") => setStatus(value)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="completed">انجام شده</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "در حال به‌روزرسانی..." : "به‌روزرسانی Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
