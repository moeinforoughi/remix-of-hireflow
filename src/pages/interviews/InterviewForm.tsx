import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, Cardعنوان } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, Formپیام, Formتوضیحات } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { زمانPickerAMPM } from '@/components/ui/time-picker-ampm';
import { Textarea } from '@/components/ui/textarea';
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useگیرندهast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { sendInterviewInvitation } from '@/lib/email-notifications';
import { notifyInterviewScheduled } from '@/lib/notifications';

const formSchema = z.object({
  title: z.string().min(1, 'عنوان is required'),
  application_id: z.string().min(1, 'Please select an application'),
  interview_type: z.enum(['virtual', 'onsite'], {
    required_error: 'Please select interview type',
  }),
  start_date: z.date({ required_error: 'شروع date is required' }),
  start_time: z.string().min(1, 'شروع time is required'),
  end_time: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  meeting_link: z.string().url().optional().or(z.literal('')),
  panel_user_ids: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.interview_type === 'onsite' && !data.location) {
    return false;
  }
  return true;
}, {
  message: 'مکان is required for on-site interviews',
  path: ['location'],
}).refine((data) => {
  if (data.interview_type === 'virtual' && !data.meeting_link) {
    return false;
  }
  return true;
}, {
  message: 'Meeting link is required for virtual interviews',
  path: ['meeting_link'],
});

type FormValues = z.infer<typeof formSchema>;

const InterviewForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useگیرندهast();
  const [loading, setبارگذاری] = useState(false);
  const [applications, setدرخواست‌ها] = useState<any[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [datePickerباز, setتاریخPickerباز] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      application_id: '',
      interview_type: undefined,
      start_time: '09:00',
      end_time: '10:00',
      location: '',
      meeting_link: '',
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsResult, usersResult] = await Promise.all([
        supabase
          .from('applications')
          .select(`
            id,
            candidate:candidates(full_name, email, id),
            job:jobs(title)
          `)
          .eq('state', 'active')
          .order('applied_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('status', 'active')
          .order('full_name')
      ]);

      if (appsResult.error) throw appsResult.error;
      if (usersResult.error) throw usersResult.error;

      setدرخواست‌ها(appsResult.data || []);
      setUsers(usersResult.data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const onثبت = async (values: FormValues) => {
    setبارگذاری(true);
    try {
      // Combine date and time
      const startتاریخزمان = new تاریخ(values.start_date);
      const [startHour, startMin] = values.start_time.split(':');
      startتاریخزمان.setHours(parseInt(startHour), parseInt(startMin));

      const endتاریخزمان = new تاریخ(values.start_date);
      const [endHour, endMin] = values.end_time.split(':');
      endتاریخزمان.setHours(parseInt(endHour), parseInt(endMin));

      const { data: interview, error } = await supabase.from('interviews')
        .insert({
          title: values.title,
          application_id: values.application_id,
          start_at: startتاریخزمان.toISOString(),
          end_at: endتاریخزمان.toISOString(),
          location: values.location || null,
          meeting_link: values.meeting_link || null,
          panel_user_ids: values.panel_user_ids || [],
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;

      // ارسال interview invitation email and notifications
      const selectedApp = applications.find(a => a.id === values.application_id);
      
      if (selectedApp) {
        try {
          await sendInterviewInvitation(
            selectedApp.candidate.email || '',
            selectedApp.candidate.full_name,
            selectedApp.job.title,
            format(startتاریخزمان, 'PPP'),
            format(startتاریخزمان, 'p'),
            values.meeting_link,
            values.location,
            selectedApp.id,
            selectedApp.candidate.id
          );
        } catch (emailError) {
          console.error('Failed to send interview invitation:', emailError);
          // Don't fail the interview scheduling if email fails
        }

        // ایجاد in-app notifications
        try {
          await notifyInterviewScheduled(
            selectedApp.id,
            interview.id,
            selectedApp.candidate.full_name,
            format(startتاریخزمان, 'PPP')
          );
        } catch (notifError) {
          console.error('Failed to create notifications:', notifError);
        }

        // ارسال notifications to مصاحبه‌کننده
        if (values.panel_user_ids && values.panel_user_ids.length > 0) {
          const selectedمصاحبه‌کنندهs = users.filter(u => values.panel_user_ids?.includes(u.id));
          
          for (const مصاحبه‌کننده of selectedمصاحبه‌کنندهs) {
            try {
              await sendInterviewInvitation(
                مصاحبه‌کننده.email,
                مصاحبه‌کننده.full_name,
                selectedApp.job.title,
                format(startتاریخزمان, 'PPP'),
                format(startتاریخزمان, 'p'),
                values.meeting_link,
                values.location,
                selectedApp.id,
                selectedApp.candidate.id
              );

              // ایجاد in-app notification for مصاحبه‌کننده
              const { data: userData } = await supabase.auth.getUser();
              await supabase.from('notifications').insert({
                user_id: مصاحبه‌کننده.id,
                org_id: userData.user?.user_metadata?.org_id,
                type: 'interview_scheduled',
                title: 'Interview هیئت مصاحبه Assignment',
                message: `You've been added to the interview panel for ${selectedApp.job.title} on ${format(startتاریخزمان, 'PPP')} at ${format(startتاریخزمان, 'p')}`,
                entity_type: 'interview',
                entity_id: interview.id,
              });
            } catch (error) {
              console.error(`Failed to notify مصاحبه‌کننده ${مصاحبه‌کننده.full_name}:`, error);
            }
          }
        }
      }

      toast({
        title: 'موفقیت',
        description: 'Interview scheduled successfully',
      });

      navigate('/interviews');
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl">برنامه‌ریزی مصاحبه</h1>
        <p className="text-muted-foreground">Schedule a new interview with a candidate</p>
      </div>

      <Card>
        <CardHeader>
          <Cardعنوان>Interview Details</Cardعنوان>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onثبت={form.handleثبت(onثبت)} className="space-y-6">
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
                name="application_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate Application</FormLabel>
                    <انتخاب onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <انتخابTrigger>
                          <انتخابValue placeholder="انتخاب an application" />
                        </انتخابTrigger>
                      </FormControl>
                      <انتخابContent>
                        {applications.map((app) => (
                          <انتخابItem key={app.id} value={app.id}>
                            {app.candidate.full_name} - {app.job.title}
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
                name="panel_user_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مصاحبه‌کنندهs (اختیاری)</FormLabel>
                    <انتخاب
                      onValueChange={(value) => {
                        const currentValues = field.value || [];
                        if (!currentValues.includes(value)) {
                          field.onChange([...currentValues, value]);
                        }
                      }}
                    >
                      <FormControl>
                        <انتخابTrigger>
                          <انتخابValue placeholder="افزودن مصاحبه‌کننده..." />
                        </انتخابTrigger>
                      </FormControl>
                      <انتخابContent>
                        {users.map((user) => (
                          <انتخابItem key={user.id} value={user.id}>
                            {user.full_name} ({user.email})
                          </انتخابItem>
                        ))}
                      </انتخابContent>
                    </انتخاب>
                    {field.value && field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map((userId) => {
                          const user = users.find((u) => u.id === userId);
                          return user ? (
                            <Badge key={userId} variant="secondary">
                              {user.full_name}
                              <button
                                type="button"
                                onClick={() => {
                                  field.onChange(
                                    field.value?.filter((id) => id !== userId)
                                  );
                                }}
                                className="ml-2 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                    <Formپیام />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>تاریخ مصاحبه</FormLabel>
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
                          disabled={(date) => date < new تاریخ()}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
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
                    <انتخاب onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <انتخابTrigger>
                          <انتخابValue placeholder="انتخاب interview type" />
                        </انتخابTrigger>
                      </FormControl>
                      <انتخابContent>
                        <انتخابItem value="virtual">آنلاین Interview</انتخابItem>
                        <انتخابItem value="onsite">On-site Interview</انتخابItem>
                      </انتخابContent>
                    </انتخاب>
                    <Formپیام />
                  </FormItem>
                )}
              />

              {form.watch('interview_type') === 'onsite' && (
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مکان</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Office - Conference Room A" {...field} />
                      </FormControl>
                      <Formتوضیحات>
                        Physical location for in-person interviews
                      </Formتوضیحات>
                      <Formپیام />
                    </FormItem>
                  )}
                />
              )}

              {form.watch('interview_type') === 'virtual' && (
                <FormField
                  control={form.control}
                  name="meeting_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Call Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://zoom.us/j/..." {...field} />
                      </FormControl>
                      <Formتوضیحات>
                        Zoom, Google Meet, or other video conferencing link
                      </Formتوضیحات>
                      <Formپیام />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  برنامه‌ریزی مصاحبه
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/interviews')}>
                  انصراف
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewForm;
