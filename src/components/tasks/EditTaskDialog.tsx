import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, Dialogعنوان } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { زمانPickerAMPM } from "@/components/ui/time-picker-ampm";

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
  onبازChange: (open: boolean) => void;
  onTaskبه‌روزرسانیd: () => void;
}

export function ویرایشTaskDialog({ task, open, onبازChange, onTaskبه‌روزرسانیd }: ویرایشTaskDialogProps) {
  const [title, setعنوان] = useState(task.title);
  const [label, setLabel] = useState(task.label || "");
  const [dueتاریخ, setDueتاریخ] = useState<تاریخ | undefined>(
    task.due_date ? new تاریخ(task.due_date) : undefined
  );
  const [dueزمان, setDueزمان] = useState(
    task.due_date ? format(new تاریخ(task.due_date), "HH:mm") : "12:00"
  );
  const [status, setوضعیت] = useState<"pending" | "completed">(task.status);
  const [isثبتting, setIsثبتting] = useState(false);

  useEffect(() => {
    setعنوان(task.title);
    setLabel(task.label || "");
    setDueتاریخ(task.due_date ? new تاریخ(task.due_date) : undefined);
    setDueزمان(task.due_date ? format(new تاریخ(task.due_date), "HH:mm") : "12:00");
    setوضعیت(task.status);
  }, [task]);

  const handleثبت = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("عنوان is required");
      return;
    }

    setIsثبتting(true);

    let dueتاریخtime = null;
    if (dueتاریخ) {
      const [hours, minutes] = dueزمان.split(":");
      const datetime = new تاریخ(dueتاریخ);
      datetime.setHours(parseInt(hours), parseInt(minutes), 0);
      dueتاریخtime = datetime.toISOString();
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        title: title.trim(),
        label: label.trim() || null,
        due_date: dueتاریخtime,
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
    onبازChange(false);
    onTaskبه‌روزرسانیd();
  };

  return (
    <Dialog open={open} onبازChange={onبازChange}>
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
                      !dueتاریخ && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueتاریخ ? format(dueتاریخ, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueتاریخ}
                    onانتخاب={setDueتاریخ}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>زمان</Label>
              <زمانPickerAMPM
                value={dueزمان}
                onChange={setDueزمان}
                disabled={!dueتاریخ}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">وضعیت</Label>
            <انتخاب value={status} onValueChange={(value: "pending" | "completed") => setوضعیت(value)}>
              <انتخابTrigger id="status">
                <انتخابValue />
              </انتخابTrigger>
              <انتخابContent>
                <انتخابItem value="pending">در انتظار</انتخابItem>
                <انتخابItem value="completed">انجام شده</انتخابItem>
              </انتخابContent>
            </انتخاب>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onبازChange(false)}>
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
