import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, Cardعنوان } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useگیرندهast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Calendar, Clock, MapPin, Video, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { پیامComposer } from '@/components/messaging/پیامComposer';
import { پیامزمانline } from '@/components/messaging/پیامزمانline';
import { ApplicationActions } from '@/components/applications/ApplicationActions';
import { Activityزمانline } from '@/components/shared/Activityزمانline';
import { فرم ارزیابیsDialog } from '@/components/interviews/فرم ارزیابیsDialog';
import { افزودنTaskDialog } from '@/components/tasks/افزودنTaskDialog';
import { وظایفList } from '@/components/tasks/وظایفList';

interface ApplicationDetail {
  id: string;
  applied_at: string;
  state: string;
  rejection_reason?: string;
  rejection_note?: string;
  cover_letter?: string;
  candidate: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin_url?: string;
    org_id: string;
  };
  job: {
    id: string;
    title: string;
    department: string;
    location: string;
  };
  current_stage?: {
    id: string;
    name: string;
  };
}

interface Interview {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  location: string;
  meeting_link?: string;
  status: string;
  timezone?: string;
  panel_user_ids?: string[];
}

interface Offer {
  id: string;
  state: string;
}

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useگیرندهast();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setبارگذاری] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loadingInterviews, setبارگذاریInterviews] = useState(false);
  const [selectedInterviewId, setانتخابedInterviewId] = useState<string | null>(null);
  const [scorecardsDialogباز, setفرم ارزیابیsDialogباز] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [tasks, setوظایف] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchApplication();
      fetchInterviews();
      fetchOffer();
    }
  }, [id]);

  useEffect(() => {
    if (application?.candidate?.id) {
      fetchوظایف();
    }
  }, [application?.candidate?.id]);

  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          applied_at,
          state,
          rejection_reason,
          rejection_note,
          cover_letter,
          candidate:candidates(id, full_name, email, phone, location, linkedin_url, org_id),
          job:jobs(id, title, department, location),
          current_stage:job_stages(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setApplication(data);
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

  const fetchInterviews = async () => {
    if (!id) return;
    
    try {
      setبارگذاریInterviews(true);
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('application_id', id)
        .order('start_at', { ascending: false });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error: any) {
      console.error('Error fetching interviews:', error);
      toast({
        title: 'خطا',
        description: 'Failed to load interviews',
        variant: 'destructive',
      });
    } finally {
      setبارگذاریInterviews(false);
    }
  };

  const fetchOffer = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('id, state')
        .eq('application_id', id)
        .maybeSingle();

      if (error) throw error;
      setOffer(data);
    } catch (error: any) {
      console.error('Error fetching offer:', error);
    }
  };

  const fetchوظایف = async () => {
    if (!application?.candidate?.id) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('candidate_id', application.candidate.id)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setوظایف(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    }
  };

  const getوضعیتBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getردionReasonText = (reason: string) => {
    switch (reason) {
      case 'not_qualified':
        return 'خیرt Qualified';
      case 'position_filled':
        return 'Position Filled';
      case 'withdrawn':
        return 'پس گرفتنn by Candidate';
      case 'failed_assessment':
        return 'Failed Assessment';
      case 'cultural_fit':
        return 'Cultural Fit';
      case 'compensation':
        return 'Compensation Mismatch';
      case 'experience':
        return 'Insufficient سابقه کار';
      case 'skills':
        return 'مهارت‌ها Mismatch';
      case 'other':
        return 'Other';
      default:
        return reason;
    }
  };

  const handleرد = async (reason: string, note: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          state: 'rejected',
          rejection_reason: reason,
          rejection_note: note,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Application ردed',
        description: 'The application has been marked as rejected.',
      });

      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleپس گرفتن = async () => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ state: 'withdrawn' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Application پس گرفتنn',
        description: 'The application has been marked as withdrawn.',
      });

      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleاستخدام = async () => {
    try {
      // Try to move the application to the "استخدامd" stage for this job
      let hiredمرحلهId: string | null = null;
      if (application?.job?.id) {
        const { data: stage, error: stageError } = await supabase
          .from('job_stages')
          .select('id')
          .eq('job_id', application.job.id)
          .eq('type', 'hired')
          .maybeSingle();

        if (stageError) throw stageError;
        hiredمرحلهId = stage?.id ?? null;
      }

      const updates: { state: 'hired'; current_stage_id?: string | null } = { state: 'hired' };
      if (hiredمرحلهId) {
        updates.current_stage_id = hiredمرحلهId;
      }

      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .select('id')
        .single();

      if (error) throw error;
      
      // Check if update actually affected a row
      if (!data) {
        throw new Error('You do not have permission to hire this candidate');
      }

      toast({
        title: 'Candidate استخدامd',
        description: hiredمرحلهId ? 'Moved to the استخدامd stage.' : 'Marked as hired. (خیر استخدامd stage configured)'
      });

      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEndقراردادی = async () => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ state: 'withdrawn' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'قراردادی Ended',
        description: 'The employment contract has been terminated.',
      });

      fetchApplication();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!application || !application.candidate || !application.job) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">
          {!application 
            ? 'Application not found' 
            : 'Unable to load application details. The candidate or job may have been deleted or you may not have permission to view this application.'}
        </p>
        <Button onClick={() => navigate('/applications')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          بازگشت to درخواست‌ها
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl">{application.candidate.full_name}</h1>
          <Link to={`/jobs/${application.job.id}`} className="text-muted-foreground hover:text-primary transition-colors">
            {application.job.title}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {application.state === 'hired' ? (
            <>
              {offer && (
                <Button asChild variant="default">
                  <Link to={`/offers/${offer.id}`}>
                    View جزئیات پیشنهاد
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={handleEndقراردادی}>
                End قراردادی
              </Button>
            </>
          ) : (
            <ApplicationActions
              applicationState={application.state}
              onرد={handleرد}
              onپس گرفتن={handleپس گرفتن}
              onاستخدام={handleاستخدام}
              offerState={offer?.state}
              applicationId={application.id}
            />
          )}
          <Badge 
            className={application.state === 'active' ? 'bg-green-500 text-white hover:bg-green-600 border-transparent' : undefined}
          >
            {application.state}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">وظایف ({tasks.length})</TabsTrigger>
          <TabsTrigger value="messages">پیامs</TabsTrigger>
          <TabsTrigger value="timeline">زمانline</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Cardعنوان>Candidate Information</Cardعنوان>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">ایمیل</p>
                  <p className="font-medium">{application.candidate.email}</p>
                </div>
                {application.candidate.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">تلفن</p>
                    <p className="font-medium">{application.candidate.phone}</p>
                  </div>
                )}
                {application.candidate.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">مکان</p>
                    <p className="font-medium">{application.candidate.location}</p>
                  </div>
                )}
                {application.candidate.linkedin_url && (
                  <div>
                    <p className="text-sm text-muted-foreground">لینکدین</p>
                    <a
                      href={application.candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      View پروفایل
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Cardعنوان>Application Details</Cardعنوان>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Job</p>
                  <p className="font-medium">{application.job.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">بخش</p>
                  <p className="font-medium">{application.job.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current مرحله</p>
                  <p className="font-medium">{application.current_stage?.name || 'خیرt assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ثبت درخواست شده تاریخ</p>
                  <p className="font-medium">
                    {format(new تاریخ(application.applied_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {application.cover_letter && (
            <Card>
              <CardHeader>
                <Cardعنوان>کاور لتر</Cardعنوان>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap text-foreground">{application.cover_letter}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {application.state === 'rejected' && (
            <Card>
              <CardHeader>
                <Cardعنوان>ردion Details</Cardعنوان>
              </CardHeader>
              <CardContent className="space-y-2">
                {application.rejection_reason && (
                  <div>
                    <p className="text-sm text-muted-foreground">Reason</p>
                    <p className="font-medium">{getردionReasonText(application.rejection_reason)}</p>
                  </div>
                )}
                {application.rejection_note && (
                  <div>
                    <p className="text-sm text-muted-foreground">خیرte</p>
                    <p className="font-medium">{application.rejection_note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Cardعنوان>وظایف</Cardعنوان>
              <افزودنTaskDialog 
                candidateId={application.candidate.id} 
                orgId={application.candidate.org_id} 
                onTaskافزودنed={fetchوظایف} 
              />
            </CardHeader>
            <CardContent>
              <وظایفList tasks={tasks} onوظایفChange={fetchوظایف} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <پیامComposer 
              candidateId={application.candidate.id}
              applicationId={application.id}
              defaultگیرنده={application.candidate.email ? [application.candidate.email] : []}
            />
            <پیامزمانline applicationId={application.id} />
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Activityزمانline entityType="application" entityId={application.id} />
        </TabsContent>

        <TabsContent value="interviews">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <Cardعنوان>Interviews</Cardعنوان>
              <Button asChild size="sm">
                <Link to={`/interviews/new?applicationId=${application.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  برنامه‌ریزی مصاحبه
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingInterviews ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">خیر interviews scheduled yet</p>
                  <Button asChild variant="outline">
                    <Link to={`/interviews/new?applicationId=${application.id}`}>
                      Schedule First Interview
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className={interviews.length > 1 ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-4"}>
                  {interviews.map((interview) => (
                    <Card key={interview.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <Link 
                              to={`/interviews/${interview.id}`}
                              className="text-lg font-semibold hover:text-primary transition-colors inline-flex items-center gap-2"
                            >
                              {interview.title}
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <Badge 
                              variant={getوضعیتBadgeVariant(interview.status)} 
                              className="ml-3"
                            >
                              {interview.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{format(new تاریخ(interview.start_at), 'MMM d, yyyy')}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>
                              {format(new تاریخ(interview.start_at), 'h:mm a')} - {format(new تاریخ(interview.end_at), 'h:mm a')}
                              {interview.timezone && ` (${interview.timezone})`}
                            </span>
                          </div>
                          
                          {interview.location && !interview.meeting_link && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span>{interview.location}</span>
                            </div>
                          )}
                          
                          {interview.meeting_link && (
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <a 
                                href={interview.meeting_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate"
                              >
                                Join آنلاین Meeting
                              </a>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <Button asChild variant="outline" size="sm" className="w-full">
                            <Link to={`/interviews/${interview.id}`}>
                              مشاهده جزئیات
                            </Link>
                          </Button>
                          {interview.status === 'completed' && (
                            <Button 
                              asChild={false}
                              variant="default" 
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setانتخابedInterviewId(interview.id);
                                setفرم ارزیابیsDialogباز(true);
                              }}
                            >
                              View فرم ارزیابیs
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedInterviewId && (
        <فرم ارزیابیsDialog
          interviewId={selectedInterviewId}
          open={scorecardsDialogباز}
          onبازChange={setفرم ارزیابیsDialogباز}
        />
      )}
    </div>
  );
};

export default ApplicationDetail;
