import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, Dialogعنوان, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { زمانPickerAMPM } from "@/components/ui/time-picker-ampm";

interface افزودنTaskDialogProps {
  candidateId: string;
  orgId: string;
  onTaskافزودنed?: () => void;
}

export function افزودنTaskDialog({ candidateId, orgId, onTaskافزودنed }: افزودنTaskDialogProps) {
  const [open, setباز] = useState(false);
  const [title, setعنوان] = useState("");
  const [label, setLabel] = useState("");
  const [dueتاریخ, setDueتاریخ] = useState<تاریخ>();
  const [dueزمان, setDueزمان] = useState("12:00");
  const [status, setوضعیت] = useState<"pending" | "completed">("pending");
  const [isثبتting, setIsثبتting] = useState(false);

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

    const { error } = await supabase.from("tasks").insert({
      candidate_id: candidateId,
      org_id: orgId,
      title: title.trim(),
      label: label.trim() || null,
      due_date: dueتاریخtime,
      status,
    });

    setIsثبتting(false);

    if (error) {
      toast.error("Failed to create task");
      console.error(error);
      return;
    }

    toast.success("Task created successfully");
    setباز(false);
    setعنوان("");
    setLabel("");
    setDueتاریخ(undefined);
    setDueزمان("12:00");
    setوضعیت("pending");
    onTaskافزودنed?.();
  };

  return (
    <Dialog open={open} onبازChange={setباز}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          افزودن وظیفه
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <Dialogعنوان>افزودن وظیفه جدید</Dialogعنوان>
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
            <Button type="button" variant="outline" onClick={() => setباز(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={isثبتting}>
              {isثبتting ? "در حال ایجاد..." : "ایجاد Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
