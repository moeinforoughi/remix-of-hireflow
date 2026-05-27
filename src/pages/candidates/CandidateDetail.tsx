import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, تلفن, FileText, MoreVertical, ChevronRight, Briefcase } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SkillMatchCard } from '@/components/candidates/SkillMatchCard';
import { RatingsSection } from '@/components/candidates/RatingsSection';
import { CommentsSection } from '@/components/candidates/CommentsSection';
import { StatusDropdown } from '@/components/candidates/StatusDropdown';
import { ResumeViewer } from '@/components/candidates/ResumeViewer';
import { EditCandidateDialog } from '@/components/candidates/EditCandidateDialog';
import { CandidateDetailSkeleton } from '@/components/candidates/CandidateDetailSkeleton';
import { RejectDialog } from '@/components/applications/RejectDialog';
import { WithdrawDialog } from '@/components/applications/WithdrawDialog';
import { ApplyToJobDialog } from '@/components/candidates/ApplyToJobDialog';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface Candidate {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  parsed_resume_json: any;
  location: string | null;
  linkedin_url: string | null;
  source: string;
  consent: boolean | null;
}

interface Application {
  id: string;
  applied_at: string;
  current_stage_id: string | null;
  state: 'active' | 'rejected' | 'withdrawn' | 'hired';
  job: {
    id: string;
    title: string;
    location: string | null;
    required_skills?: string[];
  };
  current_stage: {
    id: string;
    name: string;
    type: string;
  } | null;
}

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, canMovePipeline, canViewOffer } = useUserPermissions();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setUpload] = useState(true);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showApplyToJobDialog, setShowSubmit درخواستToJobDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    setUpload(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/candidates');
        return;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const userRole = roleData?.role;

      // Run candidate and applications queries in parallel
      const [candidateResult, applicationsResult] = await Promise.all([
        supabase.from('candidates').select('*').eq('id', id).single(),
        supabase
          .from('applications')
          .select(`
            id,
            applied_at,
            current_stage_id,
            state,
            owner_user_id,
            job:jobs(id, title, location, required_skills),
            current_stage:job_stages!applications_current_stage_id_fkey(id, name, type)
          `)
          .eq('candidate_id', id)
          .order('applied_at', { ascending: false })
      ]);

      if (candidateResult.error) throw candidateResult.error;

      // For basic users (Collaborators): verify they're assigned to at least one application
      if (userRole === 'basic' && applicationsResult.data) {
        const isAssigned = applicationsResult.data.some(
          (app: any) => app.owner_user_id === user.id
        );
        
        if (!isAssigned) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view this candidate.',
            variant: 'destructive',
          });
          navigate('/candidates');
          return;
        }
      }

      setCandidate(candidateResult.data);

      if (!applicationsResult.error && applicationsResult.data) {
        setApplications(applicationsResult.data as any);

        // Fetch stages and resume attachment in parallel
        const attachmentPromise = supabase
          .from('attachments')
          .select('file_url')
          .eq('owner_id', id)
          .eq('owner_type', 'candidate')
          .order('created_at', { ascending: false })
          .limit(1);

        const stagesPromise = applicationsResult.data.length > 0
          ? supabase
              .from('job_stages')
              .select('id, name, type, order_idx')
              .eq('job_id', (applicationsResult.data[0] as any).job.id)
              .order('order_idx')
          : Promise.resolve({ data: null, error: null });

        const [attachmentResult, stagesResult] = await Promise.all([
          attachmentPromise,
          stagesPromise
        ]);

        // Process attachment result
        if (attachmentResult?.data && attachmentResult.data.length > 0) {
          const { data: signedUrlData } = await supabase.storage
            .from('resumes')
            .createSignedUrl(attachmentResult.data[0].file_url, 3600);

          if (signedUrlData?.signedUrl) {
            setResumeUrl(signedUrlData.signedUrl);
          }
        }

        // Process stages result
        if (stagesResult?.data) {
          setStages(stagesResult.data);
        }
      }
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

  const refetchApplications = async (): Promise<void> => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          applied_at,
          current_stage_id,
          state,
          owner_user_id,
          job:jobs(id, title, location, required_skills),
          current_stage:job_stages!applications_current_stage_id_fkey(id, name, type)
        `)
        .eq('candidate_id', id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setApplications(data as any);
      }
    } catch (error: any) {
      console.error('Error refetching applications:', error);
    }
  };

  const handleViewResume = () => {
    if (resumeUrl) {
      setShowResumeDialog(true);
    } else {
      toast({
        title: 'خیر رزومه',
        description: 'خیر resume found for this candidate',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveCandidate = async () => {
    if (!candidate) return;
    
    setIsDeleting(true);
    try {
      // حذف associated applications first (cascade)
      const { error: appError } = await supabase
        .from('applications')
        .delete()
        .eq('candidate_id', candidate.id);
      
      if (appError) throw appError;

      // حذف candidate
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidate.id);

      if (error) throw error;

      toast({
        title: 'Candidate Removed',
        description: `${candidate.full_name} has been removed.`,
      });
      
      navigate('/candidates');
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowRemoveDialog(false);
    }
  };

  const handleRejectCandidate = async (reason: string, note: string) => {
    if (!primaryApplication) {
      toast({
        title: 'خطا',
        description: 'خیر active application to reject',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Find the rejected stage
      const rejectedStage = stages.find(s => s.type === 'rejected');

      if (!rejectedStage) {
        toast({
          title: 'خطا',
          description: 'Rejected stage not found for this job',
          variant: 'destructive',
        });
        return;
      }

      const { data: result, error } = await supabase.functions.invoke('reject-application', {
        body: {
          applicationId: primaryApplication.id,
          reason,
          note,
        },
      });

      if (error) throw error;
      if (!result?.success) {
        throw new Error(result?.error || 'Rejection failed');
      }

      toast({
        title: 'Candidate Rejected',
        description: `${candidate?.full_name} has been rejected.`,
      });

      setShowRejectDialog(false);
      await refetchApplications();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendOffer = () => {
    if (!primaryApplication) {
      toast({
        title: 'خطا',
        description: 'خیر active application to send offer',
        variant: 'destructive',
      });
      return;
    }
    navigate(`/offers/new?application_id=${primaryApplication.id}`);
  };

  const handleWithdraw = async () => {
    if (!primaryApplication) {
      toast({
        title: 'خطا',
        description: 'خیر active application to withdraw',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('applications')
        .update({ state: 'withdrawn' })
        .eq('id', primaryApplication.id);

      if (error) throw error;

      toast({
        title: 'Application Withdrawn',
        description: `${candidate?.full_name}'s application has been withdrawn.`,
      });

      setShowWithdrawDialog(false);
      await refetchApplications();
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <CandidateDetailSkeleton />;
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-4">Candidate not found</h2>
        <Button onClick={() => navigate('/candidates')}>بازگشت to Candidates</Button>
      </div>
    );
  }

  const primaryApplication = applications[0];
  const parsedResume = candidate.parsed_resume_json || {};
  const experienceYears = parsedResume.experience_years || 'N/A';
  const currentRole = parsedResume.current_role || 'N/A';
  const skills = parsedResume.skills || [];

  // Permission checks - only admin roles can reject/offer
  const canReject = role === 'site_admin' || role === 'job_admin' || 
    (primaryApplication && canMovePipeline(primaryApplication.job.id));
  const canOffer = role === 'site_admin' || 
    (primaryApplication && canViewOffer(primaryApplication.job.id));

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/candidates">Candidates</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowSubmit درخواستToJobDialog(true)}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            ثبت درخواست to Job
          </Button>
          {canReject && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowWithdrawDialog(true)}
                disabled={!primaryApplication}
              >
                پس گرفتن
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowRejectDialog(true)}
                disabled={!primaryApplication}
              >
                رد Candidate
              </Button>
            </>
          )}
          {canOffer && (
            <Button 
              className="bg-[#4CAF50] hover:bg-[#45A049] text-white"
              onClick={handleSendOffer}
              disabled={!primaryApplication}
            >
              ارسال پیشنهاد
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background z-50">
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                ویرایش Candidate
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setShowRemoveDialog(true)}
              >
                حذف Candidate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* پروفایل Section */}
      <Card className="rounded-2xl p-8 border shadow-sm">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={candidate.avatar_url || ''} />
            <AvatarFallback className="text-2xl">
              {candidate.full_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <h2 className="text-3xl">{candidate.full_name}</h2>
            
            <div className="space-y-2">
              <div className="flex items-center gap-6">
                {candidate.email && (
                  <a
                    href={`mailto:${candidate.email}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    {candidate.email}
                  </a>
                )}
                {candidate.phone && (
                  <a
                    href={`tel:${candidate.phone}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <تلفن className="h-4 w-4" />
                    {candidate.phone}
                  </a>
                )}
              </div>
              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  لینکدین پروفایل
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {primaryApplication && (
              <StatusDropdown
                currentStage={primaryApplication.current_stage}
                applicationId={primaryApplication.id}
                applicationState={primaryApplication.state}
                availableStages={stages}
                onStageChange={refetchApplications}
              />
            )}
            
            <Button 
              variant="outline" 
              size="default"
              onClick={handleViewResume}
              className="w-full border-border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <FileText className="h-5 w-5 mr-2" />
              View رزومه
            </Button>
          </div>
        </div>
      </Card>

      {/* رزومه Display Dialog */}
      <ResumeViewer
        open={showResumeDialog}
        onOpenChange={setShowResumeDialog}
        resumeUrl={resumeUrl}
        candidateName={candidate.full_name}
      />

      {/* ویرایش Candidate Dialog */}
      <EditCandidateDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        candidate={candidate}
        onRefreshSuccess={fetchData}
      />

      {/* حذف Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {candidate.full_name}? This will also remove all their applications and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCandidate}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'در حال حذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* رد Candidate Dialog */}
      <RejectDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        onConfirm={handleRejectCandidate}
      />

      {/* پس گرفتن Application Dialog */}
      <WithdrawDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        onConfirm={handleWithdraw}
      />

      {/* ثبت درخواست to Job Dialog */}
      <ApplyToJobDialog
        open={showApplyToJobDialog}
        onOpenChange={setShowSubmit درخواستToJobDialog}
        candidateId={candidate.id}
        candidateName={candidate.full_name}
        existingJobIds={applications.map(app => app.job.id)}
        onSuccess={refetchApplications}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {/* پایه Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-sm text-muted-foreground mb-1">Applying for</h3>
                {primaryApplication ? (
                  <Link 
                    to={`/jobs/${primaryApplication.job.id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    {primaryApplication.job.title}
                    {primaryApplication.job.location && ` - ${primaryApplication.job.location}`}
                  </Link>
                ) : (
                  <p className="text-muted-foreground">خیر active application</p>
                )}
              </div>

              <div>
                <h3 className="text-sm text-muted-foreground mb-1">تاریخ ثبت درخواست شده</h3>
                <p className="font-medium">
                  {primaryApplication
                    ? new تاریخ(primaryApplication.applied_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>

              <div>
                <h3 className="text-sm text-muted-foreground mb-1">Years of سابقه کار</h3>
                <p className="font-medium">{experienceYears}</p>
              </div>

              <div>
                <h3 className="text-sm text-muted-foreground mb-1">Current نقش</h3>
                <p className="font-medium">{currentRole}</p>
              </div>
            </CardContent>
          </Card>

          {/* Skill Match */}
          <SkillMatchCard 
            candidateSkills={skills} 
            requiredSkills={primaryApplication?.job?.required_skills || []}
          />

          {/* Ratings */}
          <RatingsSection candidateId={candidate.id} />
        </div>

        {/* Right Column - نظرات */}
        <CommentsSection 
          candidateId={candidate.id}
          applicationId={primaryApplication?.id}
        />
      </div>
    </div>
  );
};

export default CandidateDetail;
