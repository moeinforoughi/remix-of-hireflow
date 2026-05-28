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
import { برچسب } from "@/components/ui/label";
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
  status: "در انتظار" | "انجام شده";
  created_at: string;
  candidate_id: string;
  candidate?: {
    id: string;
    full_name: string;
  };
}

interface کاندیدا {
  id: string;
  full_name: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [کاندیداها, setکاندیداها] = useState<کاندیدا[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setجستجوQuery] = useState("");
  const [statusفیلتر, setوضعیتفیلتر] = useState<"all" | "در انتظار" | "انجام شده">("all");
  const [deleteTaskId, setRemoveTaskId] = useState<string | null>(null);
  const [editTask, setویرایشTask] = useState<Task | null>(null);
  const [isAddDialogباز, setIsAddDialogباز] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Form states
  const [formعنوان, setFormعنوان] = useState("");
  const [formبرچسب, setFormبرچسب] = useState("");
  const [formDueDate, setFormDueDate] = useState<Date | undefined>();
  const [formDueTime, setFormDueTime] = useState<string>("09:00");
  const [formوضعیت, setFormوضعیت] = useState<"در انتظار" | "انجام شده">("در انتظار");
  const [formکاندیداId, setFormکاندیداId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
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

        const [tasksRes, کاندیداهاRes] = await Promise.all([
          supabase
            .from("tasks")
            .select("*, candidate:کاندیداها(id, full_name)")
            .eq("org_id", profile.org_id)
            .order("due_date", { ascending: true, nullsFirst: false }),
          supabase
            .from("کاندیداها")
            .select("id, full_name")
            .eq("org_id", profile.org_id)
            .order("full_name")
        ]);

        if (tasksRes.data) {
          setTasks(tasksRes.data as Task[]);
        }
        if (کاندیداهاRes.data) {
          setکاندیداها(کاندیداهاRes.data);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("خطا در بارگذاری وظایف");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleوضعیت = async (task: Task) => {
    const newوضعیت = task.status === "در انتظار" ? "انجام شده" : "در انتظار";
    const { error } = await supabase
      .from("tasks")
      .update({ status: newوضعیت })
      .eq("id", task.id);

    if (error) {
      toast.error("خطا در به‌روزرسانی وضعیت وظیفه");
      console.error(error);
      return;
    }

    toast.success(`وظیفه علامت‌گذاری شد به عنوان ${newوضعیت}`);
    fetchData();
  };

  const handleRemove = async () => {
    if (!deleteTaskId) return;

    const { error } = await supabase.from("tasks").delete().eq("id", deleteTaskId);

    if (error) {
      toast.error("خطا در حذف وظیفه");
      console.error(error);
      return;
    }

    toast.success("وظیفه با موفقیت حذف شد");
    setRemoveTaskId(null);
    fetchData();
  };

  const resetForm = () => {
    setFormعنوان("");
    setFormبرچسب("");
    setFormDueDate(undefined);
    setFormDueTime("09:00");
    setFormوضعیت("در انتظار");
    setFormکاندیداId("");
  };

  const handleAddTask = async () => {
    if (!formعنوان.trim() || !formکاندیداId || !orgId) {
      toast.error("لطفاً فیلدهای الزامی را پر کنید");
      return;
    }

    setIsSubmitting(true);
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
        label: formبرچسب.trim() || null,
        due_date: dueDateTime,
        status: formوضعیت,
        candidate_id: formکاندیداId,
        org_id: orgId,
      });

      if (error) throw error;

      toast.success("وظیفه با موفقیت ایجاد شد");
      setIsAddDialogباز(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("خطا در ایجاد وظیفه");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleویرایشTask = async () => {
    if (!editTask || !formعنوان.trim()) {
      toast.error("لطفاً فیلدهای الزامی را پر کنید");
      return;
    }

    setIsSubmitting(true);
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
          label: formبرچسب.trim() || null,
          due_date: dueDateTime,
          status: formوضعیت,
        })
        .eq("id", editTask.id);

      if (error) throw error;

      toast.success("وظیفه با موفقیت به‌روزرسانی شد");
      setویرایشTask(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error("خطا در به‌روزرسانی وظیفه");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openویرایشDialog = (task: Task) => {
    setویرایشTask(task);
    setFormعنوان(task.title);
    setFormبرچسب(task.label || "");
    setFormوضعیت(task.status);
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

  const filteredTasks = tasks.filter((task) => {
    const matchesجستجو = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.candidate?.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesوضعیت = statusفیلتر === "all" || task.status === statusفیلتر;
    return matchesجستجو && matchesوضعیت;
  });

  const در انتظارCount = tasks.filter(t => t.status === "در انتظار").length;
  const انجام شدهCount = tasks.filter(t => t.status === "انجام شده").length;

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
            {در انتظارCount} در انتظار, {انجام شدهCount} انجام شده
          </p>
        </div>
        <Button onClick={() => setIsAddDialogباز(true)}>
          <Plus className="h-4 w-4 mr-2" />
          افزودن وظیفه
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
        <Tabs value={statusفیلتر} onValueChange={(v) => setوضعیتفیلتر(v as typeof statusفیلتر)}>
          <TabsList>
            <TabsTrigger value="all">همه ({tasks.length})</TabsTrigger>
            <TabsTrigger value="در انتظار">در انتظار ({در انتظارCount})</TabsTrigger>
            <TabsTrigger value="انجام شده">انجام شده ({انجام شدهCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {tasks.length === 0 ? "خیر tasks yet. ایجاد your first task!" : "خیر tasks match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={task.status === "انجام شده" ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={cn("", task.status === "انجام شده" && "line-through")}>
                        {task.title}
                      </h4>
                      {task.label && (
                        <Badge variant="outline" className="text-xs">
                          {task.label}
                        </Badge>
                      )}
                      <Badge
                        variant={task.status === "انجام شده" ? "default" : "secondary"}
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
                          to={`/کاندیداها/${task.candidate.id}`}
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
                      onClick={() => handleToggleوضعیت(task)}
                      title={task.status === "در انتظار" ? "علامت‌گذاری به عنوان انجام‌شده" : "علامت‌گذاری به عنوان در انتظار"}
                    >
                      {task.status === "در انتظار" ? (
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
                      onClick={() => setRemoveTaskId(task.id)}
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

      {/* افزودن وظیفه Dialog */}
      <Dialog open={isAddDialogباز} onبازChange={setIsAddDialogباز}>
        <DialogContent>
          <DialogHeader>
            <Dialogعنوان>افزودن وظیفه جدید</Dialogعنوان>
            <DialogDescription>
              ایجاد a new task linked to a candidate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <برچسب htmlFor="title">عنوان *</برچسب>
              <Input
                id="title"
                value={formعنوان}
                onChange={(e) => setFormعنوان(e.target.value)}
                placeholder="عنوان وظیفه را وارد کنید"
              />
            </div>
            <div className="space-y-2">
              <برچسب htmlFor="candidate">کاندیدا *</برچسب>
              <Select value={formکاندیداId} onValueChange={setFormکاندیداId}>
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب a candidate" />
                </SelectTrigger>
                <SelectContent>
                  {کاندیداها.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      {candidate.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <برچسب htmlFor="label">برچسب</برچسب>
              <Input
                id="label"
                value={formبرچسب}
                onChange={(e) => setFormبرچسب(e.target.value)}
                placeholder="مثلاً مصاحبه، بررسی، پیگیری"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <برچسب>Due تاریخ</برچسب>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formDueDate ? format(formDueDate, "PP") : "تاریخ را انتخاب کنید"}
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
                <برچسب>Due زمان</برچسب>
                <TimePickerAMPM value={formDueTime} onChange={setFormDueTime} />
              </div>
            </div>
            <div className="space-y-2">
              <برچسب>وضعیت</برچسب>
              <Select value={formوضعیت} onValueChange={(v) => setFormوضعیت(v as typeof formوضعیت)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="در انتظار">در انتظار</SelectItem>
                  <SelectItem value="انجام شده">انجام شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogباز(false); resetForm(); }}>
              انصراف
            </Button>
            <Button onClick={handleAddTask} disabled={isSubmitting}>
              {isSubmitting ? "در حال ایجاد..." : "ایجاد Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ویرایش Task Dialog */}
      <Dialog open={!!editTask} onبازChange={(open) => { if (!open) { setویرایشTask(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <Dialogعنوان>ویرایش Task</Dialogعنوان>
            <DialogDescription>
              به‌روزرسانی the task details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <برچسب htmlFor="edit-title">عنوان *</برچسب>
              <Input
                id="edit-title"
                value={formعنوان}
                onChange={(e) => setFormعنوان(e.target.value)}
                placeholder="عنوان وظیفه را وارد کنید"
              />
            </div>
            <div className="space-y-2">
              <برچسب htmlFor="edit-label">برچسب</برچسب>
              <Input
                id="edit-label"
                value={formبرچسب}
                onChange={(e) => setFormبرچسب(e.target.value)}
                placeholder="مثلاً مصاحبه، بررسی، پیگیری"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <برچسب>Due تاریخ</برچسب>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formDueDate ? format(formDueDate, "PP") : "تاریخ را انتخاب کنید"}
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
                <برچسب>Due زمان</برچسب>
                <TimePickerAMPM value={formDueTime} onChange={setFormDueTime} />
              </div>
            </div>
            <div className="space-y-2">
              <برچسب>وضعیت</برچسب>
              <Select value={formوضعیت} onValueChange={(v) => setFormوضعیت(v as typeof formوضعیت)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="در انتظار">در انتظار</SelectItem>
                  <SelectItem value="انجام شده">انجام شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setویرایشTask(null); resetForm(); }}>
              انصراف
            </Button>
            <Button onClick={handleویرایشTask} disabled={isSubmitting}>
              {isSubmitting ? "در حال به‌روزرسانی..." : "به‌روزرسانی Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حذف Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onبازChange={() => setRemoveTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogعنوان>حذف Task</AlertDialogعنوان>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogانصراف>انصراف</AlertDialogانصراف>
            <AlertDialogAction onClick={handleRemove}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
