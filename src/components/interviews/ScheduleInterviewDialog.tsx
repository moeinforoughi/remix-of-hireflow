import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useگیرندهast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  Dialogعنوان,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Formپیام,
} from '@/components/ui/form';
import {
  انتخاب,
  انتخابContent,
  انتخابItem,
  انتخابTrigger,
  انتخابValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { زمانPickerAMPM } from '@/components/ui/time-picker-ampm';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  application_id: z.string().min(1, 'Application is required'),
  title: z.string().min(1, 'عنوان is required'),
  date: z.date({ required_error: 'تاریخ is required' }),
  start_time: z.string().min(1, 'شروع time is required'),
  end_time: z.string().min(1, 'End time is required'),
  interview_type: z.enum(['onsite', 'virtual']),
  location: z.string().optional(),
  meeting_link: z.string().optional(),
  panel_user_ids: z.array(z.string()).min(1, 'انتخاب at least one مصاحبه‌کننده'),
  status: z.enum(['scheduled', 'completed', 'no_show', 'cancelled']),
}).refine((data) => {
  if (data.interview_type === 'onsite') {
    return !!data.location;
  }
  return true;
}, {
  message: 'مکان is required for onsite interviews',
  path: ['location'],
}).refine((data) => {
  if (data.interview_type === 'virtual') {
    return !!data.meeting_link && data.meeting_link.length > 0;
  }
  return true;
}, {
  message: 'Meeting link is required for virtual interviews',
  path: ['meeting_link'],
});

type FormValues = z.infer<typeof formSchema>;

interface ScheduleInterviewDialogProps {
  open: boolean;
  onبازChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ScheduleInterviewDialog({
  open,
  onبازChange,
  onSuccess,
}: ScheduleInterviewDialogProps) {
  const [loading, setبارگذاری] = useState(false);
  const [applications, setدرخواست‌ها] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [datePickerباز, setتاریخPickerباز] = useState(false);
  const [panelPickerباز, setهیئت مصاحبهPickerباز] = useState(false);
  const { toast } = useگیرندهast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      interview_type: 'virtual',
      status: 'scheduled',
      panel_user_ids: [],
      start_time: '09:00',
      end_time: '10:00',
    },
  });

  const interviewType = form.watch('interview_type');

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [applicationsRes, usersRes] = await Promise.all([
        supabase
          .from('applications')
          .select('id, candidate:candidates(full_name), job:jobs(title)')
          .eq('state', 'active'),
        supabase.from('profiles').select('id, full_name'),
      ]);

      if (applicationsRes.error) throw applicationsRes.error;
      if (usersRes.error) throw usersRes.error;

      setدرخواست‌ها(applicationsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const onثبت = async (values: FormValues) => {
    setبارگذاری(true);
    try {
      const startتاریخزمان = new تاریخ(values.date);
      const [startHour, startMinute] = values.start_time.split(':');
      startتاریخزمان.setHours(parseInt(startHour), parseInt(startMinute));

      const endتاریخزمان = new تاریخ(values.date);
      const [endHour, endMinute] = values.end_time.split(':');
      endتاریخزمان.setHours(parseInt(endHour), parseInt(endMinute));

      const { error } = await supabase.from('interviews').insert({
        application_id: values.application_id,
        title: values.title,
        start_at: startتاریخزمان.toISOString(),
        end_at: endتاریخزمان.toISOString(),
        status: values.status,
        location: values.interview_type === 'onsite' ? values.location : null,
        meeting_link: values.interview_type === 'virtual' ? values.meeting_link : null,
        panel_user_ids: values.panel_user_ids,
      });

      if (error) throw error;

      toast({
        title: 'موفقیت',
        description: 'Interview scheduled successfully',
      });

      form.reset();
      onبازChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setبارگذاری(false);
    }
  };

  return (
    <Dialog open={open} onبازChange={onبازChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <Dialogعنوان>برنامه‌ریزی مصاحبه</Dialogعنوان>
        </DialogHeader>

        <Form {...form}>
          <form onثبت={form.handleثبت(onثبت)} className="space-y-4">
            <FormField
              control={form.control}
              name="application_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Candidate Application</FormLabel>
                  <انتخاب onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <انتخابTrigger>
                        <انتخابValue placeholder="انتخاب application" />
                      </انتخابTrigger>
                    </FormControl>
                    <انتخابContent>
                      {applications.map((app) => (
                        <انتخابItem key={app.id} value={app.id}>
                          {(app.candidate?.full_name || 'Unknown candidate')}
                          {' - '}
                          {(app.job?.title || 'Unknown role')}
                        </انتخابItem>
                      ))}
                    </انتخابContent>
                  </انتخاب>
                  <Formپیام />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview عنوان</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., مصاحبه فنی" {...field} />
                  </FormControl>
                  <Formپیام />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>تاریخ</FormLabel>
                  <Popover open={datePickerباز} onبازChange={setتاریخPickerباز}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onانتخاب={(date) => {
                          field.onChange(date);
                          setتاریخPickerباز(false);
                        }}
                        disabled={(date) => {
                          const today = new تاریخ();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Formپیام />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شروع زمان</FormLabel>
                    <FormControl>
                      <زمانPickerAMPM value={field.value || "09:00"} onChange={field.onChange} />
                    </FormControl>
                    <Formپیام />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End زمان</FormLabel>
                    <FormControl>
                      <زمانPickerAMPM value={field.value || "10:00"} onChange={field.onChange} />
                    </FormControl>
                    <Formپیام />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="interview_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>نوع مصاحبه</FormLabel>
                  <انتخاب onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <انتخابTrigger>
                        <انتخابValue />
                      </انتخابTrigger>
                    </FormControl>
                    <انتخابContent>
                      <انتخابItem value="virtual">آنلاین</انتخابItem>
                      <انتخابItem value="onsite">Onsite</انتخابItem>
                    </انتخابContent>
                  </انتخاب>
                  <Formپیام />
                </FormItem>
              )}
            />

            {interviewType === 'virtual' && (
              <FormField
                control={form.control}
                name="meeting_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>لینک جلسه</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://meet.google.com/..."
                        {...field}
                      />
                    </FormControl>
                    <Formپیام />
                  </FormItem>
                )}
              />
            )}

            {interviewType === 'onsite' && (
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مکان</FormLabel>
                    <FormControl>
                      <Input placeholder="Office address" {...field} />
                    </FormControl>
                    <Formپیام />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="panel_user_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview هیئت مصاحبه</FormLabel>
                  <Popover open={panelPickerباز} onبازChange={setهیئت مصاحبهPickerباز}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-between font-normal',
                            !field.value?.length && 'text-muted-foreground'
                          )}
                        >
                          {field.value?.length
                            ? `${field.value.length} مصاحبه‌کننده(s) selected`
                            : 'انتخاب مصاحبه‌کننده'}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <div className="max-h-64 overflow-auto">
                        {users.filter(user => user != null).map((user) => {
                          const isانتخابed = field.value?.includes(user.id);
                          return (
                            <div
                              key={user.id}
                              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                              onClick={() => {
                                const currentValues = field.value || [];
                                if (isانتخابed) {
                                  field.onChange(currentValues.filter((v) => v !== user.id));
                                } else {
                                  field.onChange([...currentValues, user.id]);
                                }
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  isانتخابed ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {user.full_name}
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t p-2">
                        <Button
                          type="button"
                          size="sm"
                          className="w-full"
                          onClick={() => setهیئت مصاحبهPickerباز(false)}
                        >
                          انجام شد
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Formپیام />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>وضعیت</FormLabel>
                  <انتخاب onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <انتخابTrigger>
                        <انتخابValue />
                      </انتخابTrigger>
                    </FormControl>
                    <انتخابContent>
                      <انتخابItem value="scheduled">Scheduled</انتخابItem>
                      <انتخابItem value="completed">انجام شده</انتخابItem>
                      <انتخابItem value="no_show">خیر نمایش</انتخابItem>
                      <انتخابItem value="cancelled">انصرافled</انتخابItem>
                    </انتخابContent>
                  </انتخاب>
                  <Formپیام />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onبازChange(false)}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                برنامه‌ریزی مصاحبه
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
