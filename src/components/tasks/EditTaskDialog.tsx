import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, Dialogعنوان } from "@/components/ui/dialog";
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

interface ویرایشTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskبه‌روزرسانیd: () => void;
}

export function ویرایشTaskDialog({ task, open, onOpenChange, onTaskبه‌روزرسانیd }: ویرایشTaskDialogProps) {
  const [title, setعنوان] = useState(task.title);
  const [label, setLabel] = useState(task.label || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );
  const [dueTime, setDueTime] = useState(
    task.due_date ? format(new Date(task.due_date), "HH:mm") : "12:00"
  );
  const [status, setStatus] = useState<"pending" | "completed">(task.status);
  const [isثبتting, setIsثبتting] = useState(false);

  useEffect(() => {
    setعنوان(task.title);
    setLabel(task.label || "");
    setDueDate(task.due_date ? new Date(task.due_date) : undefined);
    setDueTime(task.due_date ? format(new Date(task.due_date), "HH:mm") : "12:00");
    setStatus(task.status);
  }, [task]);

  const handleثبت = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("عنوان is required");
      return;
    }

    setIsثبتting(true);

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

    setIsثبتting(false);

    if (error) {
      toast.error("Failed to update task");
      console.error(error);
      return;
    }

    toast.success("Task updated successfully");
    onOpenChange(false);
    onTaskبه‌روزرسانیd();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <Dialogعنوان>ویرایش Task</Dialogعنوان>
        </DialogHeader>
        <form onثبت={handleثبت} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setعنوان(e.target.value)}
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
              placeholder="Optional label"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
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
              <Label>Time</Label>
              <TimePickerAMPM
                value={dueTime}
                onChange={setDueTime}
                disabled={!dueDate}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: "pending" | "completed") => setStatus(value)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={isثبتting}>
              {isثبتting ? "در حال به‌روزرسانی..." : "به‌روزرسانی Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
