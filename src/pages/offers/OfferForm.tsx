import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { انتخاب, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { sendOfferNotification } from '@/lib/email-notifications';
import { notifyOfferCreated } from '@/lib/notifications';

const formSchema = z.object({
  application_id: z.string().min(1, 'Please select an application'),
  base_amount: z.coerce.number().min(1, 'Base amount is required'),
  variable_amount: z.coerce.number().optional(),
  currency: z.string().default('USD'),
  equity: z.string().optional(),
  benefits_md: z.string().optional(),
  expires_at: z.date().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const OfferForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationIdFromUrl = searchParams.get('application_id');
  const { toast } = useToast();
  const [loading, setUpload] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currency: 'USD',
      base_amount: 0,
      variable_amount: 0,
      application_id: applicationIdFromUrl || '',
    },
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  // Set form value when URL param exists and applications are loaded
  useEffect(() => {
    if (applicationIdFromUrl && applications.length > 0) {
      form.setValue('application_id', applicationIdFromUrl);
    }
  }, [applicationIdFromUrl, applications]);

  const fetchApplications = async () => {
    try {
      // Fetch all active applications
      const { data: apps, error: appsError } = await supabase
        .from('applications')
        .select(`
          id,
          candidate:candidates(full_name, email),
          job:jobs(title),
          current_stage:job_stages(name)
        `)
        .eq('state', 'active')
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch offers that are in progress (not declined/expired)
      const { data: activeOffers, error: offersError } = await supabase
        .from('offers')
        .select('application_id')
        .in('state', ['draft', 'pending_approval', 'approved', 'sent', 'accepted']);

      if (offersError) throw offersError;

      // ایجاد a Set of application IDs that already have active offers
      const appsWithActiveOffers = new Set(activeOffers?.map(o => o.application_id) || []);

      // فیلتر out applications that already have an active offer
      const availableApplications = (apps || []).filter(app => !appsWithActiveOffers.has(app.id));

      setApplications(availableApplications);
    } catch (error: any) {
      toast({
        title: 'Error loading applications',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    setUpload(true);
    try {
      const { data: offer, error } = await supabase.from('offers').insert({
        application_id: values.application_id,
        base_amount: values.base_amount,
        variable_amount: values.variable_amount || null,
        currency: values.currency,
        equity: values.equity || null,
        benefits_md: values.benefits_md || null,
        expires_at: values.expires_at?.toISOString() || null,
        notes: values.notes || null,
        state: 'draft',
      })
      .select()
      .single();

      if (error) throw error;

      // Mark application as hired
      await supabase
        .from('applications')
        .update({ state: 'hired' })
        .eq('id', values.application_id);

      // ایجاد in-app notifications (email will be sent when offer is approved)
      try {
        const selectedApp = applications.find(a => a.id === values.application_id);
        if (selectedApp) {
          await notifyOfferCreated(selectedApp.id, offer.id, selectedApp.candidate.full_name);
        }
      } catch (notifError) {
        console.error('Failed to create notifications:', notifError);
      }

      toast({
        title: 'موفقیت',
        description: 'Offer created successfully',
      });

      navigate('/offers');
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpload(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl">ایجاد Offer</h1>
        <p className="text-muted-foreground">ایجاد a new job offer for a candidate</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جزئیات پیشنهاد</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="application_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate Application</FormLabel>
                    <انتخاب onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب an application" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {applications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.candidate.full_name} - {app.job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </انتخاب>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="base_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>حقوق پایه</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="120000" {...field} />
                      </FormControl>
                      <FormDescription>Annual base salary</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="variable_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variable/پاداش (اختیاری)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="20000" {...field} />
                      </FormControl>
                      <FormDescription>Annual bonus/commission</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>واحد پول</FormLabel>
                      <انتخاب onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </انتخاب>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="equity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سهام (اختیاری)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 0.5% stock options" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Offer انقضا (اختیاری)</FormLabel>
                    <Popover>
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
                          onSelect={field.onChange}
                          disabled={(date) => date < new تاریخ()}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When this offer expires (typically 7-14 days)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits_md"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مزایا (اختیاری)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="• Health, dental, vision insurance&#10;• 401(k) with match&#10;• Unlimited PTO&#10;• دورکاری work options"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      List benefits included with this offer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes (اختیاری)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Internal notes about this offer..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These notes are internal and won't be shared with the candidate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  ایجاد Offer
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/offers')}>
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

export default OfferForm;
