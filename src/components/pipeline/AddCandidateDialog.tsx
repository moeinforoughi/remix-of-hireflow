import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  Dialogعنوان,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { انتخاب, انتخابContent, انتخابItem, انتخابTrigger, انتخابValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { بارگذاری, Paperclip, Plus, جستجو, Loader2, User } from 'lucide-react';
import { parseرزومه } from '@/lib/resume-parser';
import { notifyNewApplication } from '@/lib/notifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

// Format phone number as (XXX) XXX-XXXX
const formatتلفنNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const limitedDigits = digits.slice(0, 10);
  
  if (limitedDigits.length === 0) return '';
  if (limitedDigits.length <= 3) return `(${limitedDigits}`;
  if (limitedDigits.length <= 6) return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3)}`;
  return `(${limitedDigits.slice(0, 3)}) ${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
};

const formSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().refine(
    (val) => !val || val === '' || /^\(\d{3}\) \d{3}-\d{4}$/.test(val),
    { message: 'Please enter a valid US phone number' }
  ),
  linkedin_url: z.string().optional().refine(
    (val) => !val || val === '' || (val.startsWith('http') && val.includes('linkedin.com')),
    { message: 'Please enter a valid لینکدین URL (e.g., https://linkedin.com/in/username)' }
  ),
});

interface Candidate {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

interface افزودنCandidateDialogProps {
  jobId?: string;
  stages?: Array<{ id: string; name: string; order_idx: number }>;
  jobs?: Array<{ id: string; title: string }>;
  onSuccess?: () => void;
}

export const افزودنCandidateDialog = ({ jobId, stages, jobs, onSuccess }: افزودنCandidateDialogProps) => {
  const [open, setباز] = useState(false);
  const [activeTab, setفعالTab] = useState<'new' | 'existing'>('new');
  const [loading, setبارگذاری] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [resumeFile, setرزومهFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedJobId, setانتخابedJobId] = useState<string>(jobId || '');
  const [jobمرحلهs, setJobمرحلهs] = useState<Array<{ id: string; name: string; order_idx: number }>>(stages || []);
  const [phoneValue, setتلفنValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing candidate search state
  const [searchQuery, setجستجوQuery] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [existingJobCandidateIds, setExistingJobCandidateIds] = useState<string[]>([]);
  const [selectedCandidate, setانتخابedCandidate] = useState<Candidate | null>(null);
  const [searchبارگذاری, setجستجوبارگذاری] = useState(false);

  const { register, handleثبت, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(formSchema),
  });

  // Fetch existing candidates when dialog opens or search changes
  useEffect(() => {
    if (open && activeTab === 'existing') {
      fetchCandidates();
    }
  }, [open, activeTab, searchQuery]);

  // Fetch candidates already applied to this job
  useEffect(() => {
    if (open && jobId) {
      fetchExistingدرخواست‌ها();
    }
  }, [open, jobId]);

  const fetchExistingدرخواست‌ها = async () => {
    const targetJobId = jobId || selectedJobId;
    if (!targetJobId) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .select('candidate_id')
        .eq('job_id', targetJobId);

      if (error) throw error;
      setExistingJobCandidateIds((data || []).map(a => a.candidate_id));
    } catch (error) {
      console.error('Error fetching existing applications:', error);
    }
  };

  const fetchCandidates = async () => {
    setجستجوبارگذاری(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      let query = supabase
        .from('candidates')
        .select('id, full_name, email, avatar_url')
        .eq('org_id', profile.org_id)
        .order('full_name')
        .limit(50);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // فیلتر out candidates already applied to this job
      const targetJobId = jobId || selectedJobId;
      let filtered = data || [];
      if (targetJobId && existingJobCandidateIds.length > 0) {
        filtered = filtered.filter(c => !existingJobCandidateIds.includes(c.id));
      }

      setCandidates(filtered);
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
    } finally {
      setجستجوبارگذاری(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileانتخاب(files[0]);
    }
  };

  const handleFileانتخاب = async (file: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 10 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF or Word document',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setرزومهFile(file);
    
    setParsing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = e.target?.result as string;
        const base64Data = base64Content.split(',')[1];

        const { data, error } = await supabase.functions.invoke('preview-parse-resume', {
          body: {
            fileContent: base64Data,
            fileName: file.name,
          },
        });

        if (error) throw error;

        if (data?.success && data?.data) {
          if (data.data.full_name) setValue('full_name', data.data.full_name);
          if (data.data.email) setValue('email', data.data.email);
          if (data.data.phone) {
            const formatted = formatتلفنNumber(data.data.phone);
            setتلفنValue(formatted);
            setValue('phone', formatted);
          }
          if (data.data.linkedin_url) setValue('linkedin_url', data.data.linkedin_url);

          toast({
            title: 'رزومه parsed',
            description: 'Form fields have been auto-filled. Please review and edit as needed.',
          });
        }
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error parsing resume:', error);
      toast({
        title: 'Parsing failed',
        description: 'Could not auto-fill from resume. Please enter details manually.',
        variant: 'destructive',
      });
    } finally {
      setParsing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileانتخاب(files[0]);
    }
  };

  const handleJobChange = async (newJobId: string) => {
    setانتخابedJobId(newJobId);
    
    try {
      const { data, error } = await supabase
        .from('job_stages')
        .select('id, name, order_idx')
        .eq('job_id', newJobId)
        .order('order_idx');

      if (error) throw error;
      setJobمرحلهs(data || []);

      // Refetch existing applications for this job
      const { data: apps } = await supabase
        .from('applications')
        .select('candidate_id')
        .eq('job_id', newJobId);

      setExistingJobCandidateIds((apps || []).map(a => a.candidate_id));
    } catch (error: any) {
      console.error('Error fetching job stages:', error);
    }
  };

  const onثبت = async (data: z.infer<typeof formSchema>) => {
    const targetJobId = jobId || selectedJobId;
    
    if (!targetJobId) {
      toast({
        title: 'خطا',
        description: 'Please select a job',
        variant: 'destructive',
      });
      return;
    }

    setبارگذاری(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('خیرt authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('پروفایل not found');

      let currentمرحلهs = jobمرحلهs;
      if (!currentمرحلهs || currentمرحلهs.length === 0) {
        const { data: stagesData, error: stagesError } = await supabase
          .from('job_stages')
          .select('id, name, order_idx')
          .eq('job_id', targetJobId)
          .order('order_idx');

        if (stagesError) throw stagesError;
        
        if (!stagesData || stagesData.length === 0) {
          const defaultمرحلهs: Array<{
            name: string;
            type: 'applied' | 'screen' | 'phone' | 'onsite' | 'offer' | 'hired' | 'rejected';
            order_idx: number;
          }> = [
            { name: 'ثبت درخواست شده', type: 'applied', order_idx: 0 },
            { name: 'Screening', type: 'screen', order_idx: 1 },
            { name: 'تلفن Interview', type: 'phone', order_idx: 2 },
            { name: 'مصاحبه حضوری', type: 'onsite', order_idx: 3 },
            { name: 'Offer', type: 'offer', order_idx: 4 },
            { name: 'استخدامd', type: 'hired', order_idx: 5 },
            { name: 'ردed', type: 'rejected', order_idx: 6 },
          ];

          const { data: createdمرحلهs, error: createError } = await supabase
            .from('job_stages')
            .insert(defaultمرحلهs.map(stage => ({ ...stage, job_id: targetJobId })))
            .select('id, name, order_idx');

          if (createError) throw createError;
          currentمرحلهs = createdمرحلهs || [];
          
          toast({
            title: 'پایپ‌لاین ایجادd',
            description: 'Default pipeline stages have been set up for this job.',
          });
        } else {
          currentمرحلهs = stagesData;
        }
      }

      // ایجاد candidate
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || null,
          linkedin_url: data.linkedin_url || null,
          source: 'manual',
          org_id: profile.org_id,
          consent: true,
          consent_at: new تاریخ().toISOString(),
        })
        .select()
        .single();

      if (candidateError) throw candidateError;

      // بارگذاری resume if provided
      if (resumeFile && candidate) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${candidate.id}-${تاریخ.now()}.${fileExt}`;
        const filePath = `${profile.org_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, resumeFile);

        if (uploadError) throw uploadError;

        await supabase.from('attachments').insert({
          owner_type: 'candidate',
          owner_id: candidate.id,
          file_name: resumeFile.name,
          file_url: filePath,
          mime_type: resumeFile.type,
          size_bytes: resumeFile.size,
          org_id: profile.org_id,
          uploaded_by: user.id,
        });

        parseرزومه(filePath, candidate.id).catch(console.error);
      }

      const firstمرحله = currentمرحلهs.find(s => s.name.toکمerCase().includes('applied')) || currentمرحلهs[0];
      
      if (!firstمرحله) {
        throw new Error('خیر stage found for this job');
      }

      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .insert({
          candidate_id: candidate.id,
          job_id: targetJobId,
          current_stage_id: firstمرحله.id,
          state: 'active',
          owner_user_id: user.id,
          applied_at: new تاریخ().toISOString(),
        })
        .select('id')
        .single();

      if (applicationError) throw applicationError;

      // ارسال notification
      if (applicationData) {
        notifyNewApplication(targetJobId, data.full_name, applicationData.id).catch(console.error);
      }

      toast({
        title: 'موفقیت',
        description: 'Candidate added to pipeline',
      });

      reset();
      setرزومهFile(null);
      setتلفنValue('');
      setباز(false);
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

  const handleافزودنExistingCandidate = async () => {
    const targetJobId = jobId || selectedJobId;
    
    if (!targetJobId) {
      toast({
        title: 'خطا',
        description: 'Please select a job',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCandidate) {
      toast({
        title: 'خطا',
        description: 'Please select a candidate',
        variant: 'destructive',
      });
      return;
    }

    setبارگذاری(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('خیرt authenticated');

      // Get stages
      let currentمرحلهs = jobمرحلهs;
      if (!currentمرحلهs || currentمرحلهs.length === 0) {
        const { data: stagesData, error: stagesError } = await supabase
          .from('job_stages')
          .select('id, name, order_idx')
          .eq('job_id', targetJobId)
          .order('order_idx');

        if (stagesError) throw stagesError;
        currentمرحلهs = stagesData || [];
      }

      const firstمرحله = currentمرحلهs.find(s => s.name.toکمerCase().includes('applied')) || currentمرحلهs[0];
      
      if (!firstمرحله) {
        throw new Error('خیر stage found for this job');
      }

      // ایجاد application
      const { data: applicationData, error: applicationError } = await supabase
        .from('applications')
        .insert({
          candidate_id: selectedCandidate.id,
          job_id: targetJobId,
          current_stage_id: firstمرحله.id,
          state: 'active',
          owner_user_id: user.id,
          applied_at: new تاریخ().toISOString(),
        })
        .select('id')
        .single();

      if (applicationError) throw applicationError;

      // ارسال notification
      if (applicationData) {
        notifyNewApplication(targetJobId, selectedCandidate.full_name, applicationData.id).catch(console.error);
      }

      toast({
        title: 'موفقیت',
        description: `${selectedCandidate.full_name} added to pipeline`,
      });

      setانتخابedCandidate(null);
      setجستجوQuery('');
      setباز(false);
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

  const handleبازChange = (newباز: boolean) => {
    setباز(newباز);
    if (!newباز) {
      reset();
      setرزومهFile(null);
      setتلفنValue('');
      setفعالTab('new');
      setانتخابedCandidate(null);
      setجستجوQuery('');
    }
  };

  return (
    <Dialog open={open} onبازChange={handleبازChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          افزودن کاندیدا
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <Dialogعنوان>افزودن کاندیدا</Dialogعنوان>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setفعالTab(v as 'new' | 'existing')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">کاندیدای جدید</TabsTrigger>
            <TabsTrigger value="existing">Existing Candidate</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4">
            <form onثبت={handleثبت(onثبت)} className="space-y-6">
              {/* بارگذاری رزومه Section */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragging ? 'border-primary bg-accent/20' : parsing ? 'border-primary bg-accent/10' : 'border-border'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !parsing && fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <بارگذاری className={`h-6 w-6 text-muted-foreground ${parsing ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {parsing ? 'Parsing resume...' : 'بارگذاری رزومه to auto-fill new applicant information'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {parsing ? 'Extracting candidate information' : 'Drag a file here or click to browse your computer files'}
                    </p>
                  </div>
                  {resumeFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Paperclip className="h-4 w-4" />
                      <span>{resumeFile.name}</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">
                    Manually افزودن کاندیدا
                  </span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {!jobId && jobs && jobs.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="job">Job Position *</Label>
                    <انتخاب value={selectedJobId} onValueChange={handleJobChange}>
                      <انتخابTrigger className="h-11">
                        <انتخابValue placeholder="انتخاب a job" />
                      </انتخابTrigger>
                      <انتخابContent>
                        {jobs.map((job) => (
                          <انتخابItem key={job.id} value={job.id}>
                            {job.title}
                          </انتخابItem>
                        ))}
                      </انتخابContent>
                    </انتخاب>
                  </div>
                )}

                <div className="space-y-2">
                  <Input
                    id="full_name"
                    placeholder="Name"
                    {...register('full_name')}
                    className="h-11"
                  />
                  {errors.full_name?.message && (
                    <p className="text-sm text-destructive">{String(errors.full_name.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="ایمیل"
                    {...register('email')}
                    className="h-11"
                  />
                  {errors.email?.message && (
                    <p className="text-sm text-destructive">{String(errors.email.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    id="phone"
                    placeholder="تلفن number"
                    value={phoneValue}
                    onChange={(e) => {
                      const formatted = formatتلفنNumber(e.target.value);
                      setتلفنValue(formatted);
                      setValue('phone', formatted);
                    }}
                    className="h-11"
                  />
                  {errors.phone?.message && (
                    <p className="text-sm text-destructive">{String(errors.phone.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    id="linkedin_url"
                    placeholder="لینکدین URL"
                    {...register('linkedin_url')}
                    className="h-11"
                  />
                  {errors.linkedin_url?.message && (
                    <p className="text-sm text-destructive">{String(errors.linkedin_url.message)}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setباز(false)}
                  className="px-6"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 bg-foreground text-background hover:bg-foreground/90"
                >
                  {loading ? 'افزودنing...' : 'افزودن کاندیدا'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="existing" className="mt-4 space-y-4">
            {/* Job انتخابion for existing candidate */}
            {!jobId && jobs && jobs.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="job-existing">Job Position *</Label>
                <انتخاب value={selectedJobId} onValueChange={handleJobChange}>
                  <انتخابTrigger className="h-11">
                    <انتخابValue placeholder="انتخاب a job" />
                  </انتخابTrigger>
                  <انتخابContent>
                    {jobs.map((job) => (
                      <انتخابItem key={job.id} value={job.id}>
                        {job.title}
                      </انتخابItem>
                    ))}
                  </انتخابContent>
                </انتخاب>
              </div>
            )}

            {/* جستجو */}
            <div className="relative">
              <جستجو className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو candidates by name or email..."
                value={searchQuery}
                onChange={(e) => setجستجوQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Candidates List */}
            <ScrollArea className="h-[300px] border rounded-lg">
              {searchبارگذاری ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : candidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <User className="h-8 w-8 mb-2" />
                  <p className="text-sm">
                    {searchQuery 
                      ? 'خیر candidates found matching your search' 
                      : 'خیر candidates available for this job'}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedCandidate?.id === candidate.id 
                          ? 'bg-primary/10 border border-primary' 
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setانتخابedCandidate(candidate)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={candidate.avatar_url || ''} />
                        <AvatarFallback>
                          {candidate.full_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{candidate.full_name}</p>
                        {candidate.email && (
                          <p className="text-sm text-muted-foreground truncate">{candidate.email}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* انتخابed Candidate Info */}
            {selectedCandidate && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">انتخابed: </span>
                  <span className="font-medium">{selectedCandidate.full_name}</span>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setباز(false)}
                className="px-6"
              >
                انصراف
              </Button>
              <Button
                onClick={handleافزودنExistingCandidate}
                disabled={loading || !selectedCandidate || (!jobId && !selectedJobId)}
                className="px-6 bg-foreground text-background hover:bg-foreground/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    افزودنing...
                  </>
                ) : (
                  'افزودن to پایپ‌لاین'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
